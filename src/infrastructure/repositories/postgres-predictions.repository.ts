// FILE: src/infrastructure/repositories/postgres-predictions.repository.ts

import "server-only";

import type { Pool, PoolClient } from "pg";

import type {
  IPredictionsRepository,
  GetPredictionsQuery,
} from "@/src/application/repositories/predictions.repository.interface";
import type { PredictionRecord } from "@/src/entities/models/prediction";

type DbPredictionRunRow = {
  id: number;
  uid: string;
  commodity: string | null;
  future_date: Date | string | null;
  created_at: Date | string | null;
  runtime_ms: number | null;
  status: string | null;
  n8n_http_status: number | null;
  error: string | null;
  tender_predicted_price: number | string | null;
  trend: string | null;
};

type DbBasisRow = {
  basis_key: string | null;
  basis_label: string | null;
  base_price: number | string | null;
};

type DbNewsEventRow = {
  headline: string | null;
  impact_direction: string | null;
  importance_score: number | string | null;
  event_type: string | null;
  event_date: string | null;
  evidence_summary: string | null;
};

function toNullableNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function toNullableDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value : null;

  const d = new Date(value as string);
  return Number.isFinite(d.getTime()) ? d : null;
}

function toStatus(value: unknown): PredictionRecord["status"] {
  const s = String(value ?? "").trim().toLowerCase();

  if (s === "success") return "success";
  if (s === "failed") return "failed";
  if (s === "running") return "running";
  if (s === "pending") return "pending";

  return "pending";
}

function mapPredictionRecord(
  run: DbPredictionRunRow,
  basisRows: DbBasisRow[],
  newsRows: DbNewsEventRow[]
): PredictionRecord {
  return {
    id: String(run.id),
    uid: run.uid,
    createdAt: toNullableDate(run.created_at),
    runtimeMs: run.runtime_ms ?? null,
    commodity: run.commodity ?? null,
    futureDate:
      typeof run.future_date === "string"
        ? run.future_date.slice(0, 10)
        : run.future_date instanceof Date
          ? run.future_date.toISOString().slice(0, 10)
          : null,
    basisLabels: basisRows.map((x) => x.basis_label).filter((x): x is string => Boolean(x)),
    basisKeys: basisRows.map((x) => x.basis_key).filter((x): x is string => Boolean(x)),
    basePrices: basisRows
      .map((x) => toNullableNumber(x.base_price))
      .filter((x): x is number => x != null),
    status: toStatus(run.status),
    n8nHttpStatus: run.n8n_http_status ?? null,
    outputs: {
      tenderPredictedPrice: toNullableNumber(run.tender_predicted_price),
      signals: {
        trend: run.trend ?? null,
      },
    },
    error: run.error ?? null,
    news: {
      count: newsRows.length,
      events: newsRows.map((ev) => ({
        headline: ev.headline ?? null,
        impact_direction: ev.impact_direction ?? null,
        importance_score: toNullableNumber(ev.importance_score),
        event_type: ev.event_type ?? null,
        event_date: ev.event_date ?? null,
        evidence_summary: ev.evidence_summary ?? null,
      })),
    },
  };
}

async function replaceBasisRows(
  client: PoolClient,
  predictionRunId: number,
  record: PredictionRecord
): Promise<void> {
  await client.query(
    `
    delete from prediction_basis_price
    where prediction_run_id = $1
    `,
    [predictionRunId]
  );

  const basisKeys = Array.isArray(record.basisKeys) ? record.basisKeys : [];
  const basisLabels = Array.isArray(record.basisLabels) ? record.basisLabels : [];
  const basePrices = Array.isArray(record.basePrices) ? record.basePrices : [];

  const count = Math.max(basisKeys.length, basisLabels.length, basePrices.length);

  for (let i = 0; i < count; i += 1) {
    const basisKey = basisKeys[i] ?? null;
    const basisLabel = basisLabels[i] ?? null;
    const basePrice = basePrices[i] ?? null;

    if (!basisKey && !basisLabel && basePrice == null) continue;

    await client.query(
      `
      insert into prediction_basis_price (
        prediction_run_id,
        basis_key,
        basis_label,
        base_price
      )
      values ($1, $2, $3, $4)
      `,
      [predictionRunId, basisKey, basisLabel, basePrice]
    );
  }
}

async function replaceNewsRows(
  client: PoolClient,
  predictionRunId: number,
  record: PredictionRecord
): Promise<void> {
  await client.query(
    `
    delete from prediction_news_event
    where prediction_run_id = $1
    `,
    [predictionRunId]
  );

  const events = Array.isArray(record.news?.events) ? record.news.events : [];

  for (let i = 0; i < events.length; i += 1) {
    const ev = events[i];
    const eventIndex = i + 1;

    await client.query(
      `
      insert into prediction_news_event (
        prediction_run_id,
        event_index,
        headline,
        impact_direction,
        importance_score,
        event_type,
        event_date,
        evidence_summary
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8)
      `,
      [
        predictionRunId,
        eventIndex,
        ev.headline ?? null,
        ev.impact_direction ?? null,
        ev.importance_score ?? null,
        ev.event_type ?? null,
        ev.event_date ?? null,
        ev.evidence_summary ?? null,
      ]
    );
  }
}

export class PostgresPredictionsRepository implements IPredictionsRepository {
  constructor(private readonly pool: Pool) {}

  async save(prediction: PredictionRecord): Promise<void> {
    if (!prediction.uid) {
      throw new Error("Missing prediction uid");
    }

    const client = await this.pool.connect();

    try {
      await client.query("begin");

      const runRes = await client.query<{ id: number }>(
        `
          insert into prediction_run (
            uid,
            commodity,
            future_date,
            created_at,
            updated_at,
            runtime_ms,
            status,
            n8n_http_status,
            error,
            tender_predicted_price,
            trend,
            news_count
          )
          values (
            $1,
            $2,
            $3,
            coalesce($4, now()),
            now(),
            $5,
            $6,
            $7,
            $8,
            $9,
            $10,
            $11
          )
          returning id
        `,
        [
          prediction.uid,
          prediction.commodity,
          prediction.futureDate,
          prediction.createdAt ?? null,
          prediction.runtimeMs ?? null,
          prediction.status,
          prediction.n8nHttpStatus ?? null,
          prediction.error ?? null,
          prediction.outputs?.tenderPredictedPrice ?? null,
          prediction.outputs?.signals?.trend ?? null,
          prediction.news?.count ??
            (Array.isArray(prediction.news?.events) ? prediction.news.events.length : 0),
        ]
      );

      const predictionRunId = runRes.rows[0]?.id;
      if (!predictionRunId) {
        throw new Error("Failed to obtain prediction_run.id after insert");
      }

      await replaceBasisRows(client, predictionRunId, prediction);
      await replaceNewsRows(client, predictionRunId, prediction);

      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  }

  async getByUser(query: GetPredictionsQuery): Promise<PredictionRecord[]> {
    if (!query?.uid) throw new Error("Missing uid");

    const rawLimit =
      typeof query.limit === "number" && Number.isFinite(query.limit) ? query.limit : 100;
    const limit = Math.max(1, Math.min(rawLimit, 200));

    const runRes = await this.pool.query<DbPredictionRunRow>(
      `
      select
        id,
        uid,
        commodity,
        future_date,
        created_at,
        runtime_ms,
        status,
        n8n_http_status,
        error,
        tender_predicted_price,
        trend
      from prediction_run
      where uid = $1
        and ($2::text is null or commodity = $2)
        and ($3::text is null or status = $3)
      order by created_at desc
      limit $4
      `,
      [query.uid, query.commodity?.trim().toLowerCase() ?? null, query.status ?? null, limit]
    );

    const out: PredictionRecord[] = [];

    for (const run of runRes.rows) {
      const [basisRes, newsRes] = await Promise.all([
        this.pool.query<DbBasisRow>(
          `
          select basis_key, basis_label, base_price
          from prediction_basis_price
          where prediction_run_id = $1
          order by id asc
          `,
          [run.id]
        ),
        this.pool.query<DbNewsEventRow>(
          `
          select
            headline,
            impact_direction,
            importance_score,
            event_type,
            event_date,
            evidence_summary
          from prediction_news_event
          where prediction_run_id = $1
          order by id asc
          `,
          [run.id]
        ),
      ]);

      out.push(mapPredictionRecord(run, basisRes.rows, newsRes.rows));
    }

    return out;
  }

  async getById(id: string): Promise<PredictionRecord | null> {
    const numericId = Number(id);
    if (!Number.isInteger(numericId) || numericId <= 0) {
      return null;
    }

    const runRes = await this.pool.query<DbPredictionRunRow>(
      `
      select
        id,
        uid,
        commodity,
        future_date,
        created_at,
        runtime_ms,
        status,
        n8n_http_status,
        error,
        tender_predicted_price,
        trend
      from prediction_run
      where id = $1
      limit 1
      `,
      [numericId]
    );

    if (!runRes.rowCount) return null;

    const run = runRes.rows[0];

    const [basisRes, newsRes] = await Promise.all([
      this.pool.query<DbBasisRow>(
        `
        select basis_key, basis_label, base_price
        from prediction_basis_price
        where prediction_run_id = $1
        order by id asc
        `,
        [run.id]
      ),
      this.pool.query<DbNewsEventRow>(
        `
        select
          headline,
          impact_direction,
          importance_score,
          event_type,
          event_date,
          evidence_summary
        from prediction_news_event
        where prediction_run_id = $1
        order by id asc
        `,
        [run.id]
      ),
    ]);

    return mapPredictionRecord(run, basisRes.rows, newsRes.rows);
  }
}