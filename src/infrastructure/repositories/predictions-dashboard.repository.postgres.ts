// FILE: src/infrastructure/repositories/predictions-dashboard.repository.postgres.ts

import "server-only";
import type { Pool } from "pg";

import type { IPredictionsDashboardRepository } from "@/src/application/repositories/predictions-dashboard.repository.interface";
import type {
  DashboardChartPoint,
  DashboardPrediction,
  Status,
} from "@/src/entities/models/dashboard";

import { GET_PREDICTIONS_FOR_USER_QUERY } from "@/src/infrastructure/db/queries/dashboard/get-predictions-for-user.query";
import { GET_MARKET_CHART_FOR_USER_QUERY } from "@/src/infrastructure/db/queries/dashboard/get-market-chart-for-user.query";

type DbNewsEvent = {
  headline?: string | null;
  impact_direction?: string | null;
  importance_score?: number | string | null;
  event_type?: string | null;
  event_date?: string | null;
  evidence_summary?: string | null;
};

type DbRow = {
  id: number | string;
  uid: string;
  commodity: string;
  future_date: Date | string | null;
  status: string | null;
  created_at: Date | string | null;
  runtime_ms: number | null;
  n8n_http_status: number | null;
  error: string | null;

  tender_predicted_price: number | string | null;
  trend: string | null;
  news_count: number | string | null;

  basis_key: string | null;
  basis_label: string | null;
  base_price: number | string | null;

  news_events: unknown;
};

type DbChartRow = {
  future_date: Date | string | null;
  actual_price: number | string | null;
  tender_predicted_price: number | string | null;
};

function toStatus(value: string | null | undefined): Status {
  const s = String(value ?? "").trim().toLowerCase();

  if (s === "success") return "success";
  if (s === "failed") return "failed";
  if (s === "running") return "running";
  if (s === "pending") return "pending";

  return "pending";
}

function toNullableNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }

  return null;
}

function normalizeNewsEvents(value: unknown): DbNewsEvent[] {
  return Array.isArray(value) ? (value as DbNewsEvent[]) : [];
}

function toIsoDate(value: Date | string | null): string {
  if (typeof value === "string") return value.slice(0, 10);
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return "";
}

function mapDashboardPrediction(row: DbRow): DashboardPrediction {
  const newsEvents = normalizeNewsEvents(row.news_events);
  const basePrice = toNullableNumber(row.base_price);

  return {
    id: String(row.id),
    uid: row.uid,
    commodity: row.commodity,
    createdAt: row.created_at ? new Date(row.created_at) : null,
    futureDate: toIsoDate(row.future_date) || null,
    basisKeys: row.basis_key ? [row.basis_key] : [],
    basisLabels: row.basis_label ? [row.basis_label] : [],
    status: toStatus(row.status),
    runtimeMs: row.runtime_ms,
    n8nHttpStatus: row.n8n_http_status,
    error: row.error,
    basePrices: basePrice == null ? null : [basePrice],

    outputs: {
      tenderPredictedPrice: toNullableNumber(row.tender_predicted_price),
      signals: {
        trend: row.trend ?? null,
      },
    },

    news: {
      count:
        typeof row.news_count === "string"
          ? Number(row.news_count)
          : typeof row.news_count === "number"
          ? row.news_count
          : 0,
      events: newsEvents.map((ev) => ({
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

function mapChartPoint(row: DbChartRow): DashboardChartPoint {
  return {
    date: toIsoDate(row.future_date),
    actualPrice: toNullableNumber(row.actual_price),
    predictedPrice: toNullableNumber(row.tender_predicted_price),
  };
}

export class PostgresPredictionsDashboardRepository
  implements IPredictionsDashboardRepository
{
  constructor(private readonly pool: Pool) {}

  async getPredictionsForUser(params: {
    uid: string;
    commodity?: string;
    limit?: number;
  }): Promise<DashboardPrediction[]> {
    const res = await this.pool.query<DbRow>(
      GET_PREDICTIONS_FOR_USER_QUERY,
      [params.uid, params.commodity ?? null, params.limit ?? 50]
    );

    return res.rows.map(mapDashboardPrediction);
  }

  async getMarketChartForUser(params: {
    uid: string;
    commodity?: string;
    limit?: number;
  }): Promise<DashboardChartPoint[]> {
    const res = await this.pool.query<DbChartRow>(
      GET_MARKET_CHART_FOR_USER_QUERY,
      [params.uid, params.commodity ?? null, params.limit ?? 24]
    );

    return res.rows.map(mapChartPoint).filter((x) => x.date);
  }
}