"use server";

import { redirect } from "next/navigation";
import { AuthenticationError, UnauthenticatedError } from "@/src/entities/errors/auth";

export type PredictionActiveNewsItem = {
  documentId: string;
  documentName: string;
  commodity: string;
  headline: string;
  eventType: string | null;
  impactDirection: string | null;
  importanceScore: number | null;
  eventDate: string | null;
  evidenceSummary: string | null;
  regions: string[];
};

export async function runPredictionAction(input: {
  commodity: string;
  futureDate: string;
  basisKeys: string[];
  basisLabels: string[];
  basePrices: number[];
  region?: string;
  forceRun?: boolean;
}) {
  const { getInjection } = await import("@/di/container");

  const instrumentation = getInjection("IInstrumentationService");

  return instrumentation.startSpan(
    { name: "prediction.actions > runPredictionAction", op: "function.nextjs" },
    async () => {
      try {
        const controller = getInjection("IExecutePredictionController");
        return await controller({
          commodity: input.commodity,
          futureDate: input.futureDate,
          basisKeys: input.basisKeys,
          basisLabels: input.basisLabels,
          basePrices: input.basePrices,
          region: input.region ?? "global",
          forceRun: input.forceRun ?? false,
        });
      } catch (err) {
        if (err instanceof UnauthenticatedError || err instanceof AuthenticationError) {
          redirect("/login");
        }
        const crash = getInjection("ICrashReporterService");
        crash.report(err);
        throw err;
      }
    }
  );
}

function decodeFileLabel(value: string) {
  const normalized = String(value ?? "").replace(/\+/g, " ");
  try {
    return decodeURIComponent(normalized);
  } catch {
    return normalized;
  }
}

export async function getPredictionActiveNewsAction(input: {
  commodity: string;
}): Promise<PredictionActiveNewsItem[]> {
  const { getInjection } = await import("@/di/container");

  const instrumentation = getInjection("IInstrumentationService");

  return instrumentation.startSpan(
    { name: "prediction.actions > getPredictionActiveNewsAction", op: "function.nextjs" },
    async () => {
      try {
        const { postgres } = await import("@/src/infrastructure/db/postgres.client");
        const commodity = String(input.commodity ?? "").trim().toLowerCase();

        if (!commodity) return [];

        const rows = await postgres.query<{
          document_id: string;
          filename: string | null;
          commodity: string;
          headline: string | null;
          event_type: string | null;
          impact_direction: string | null;
          importance_score: number | null;
          event_date: Date | string | null;
          evidence_summary: string | null;
          regions: string[] | null;
        }>(
          `
            select
              me.document_id,
              d.filename,
              me.commodity,
              me.headline,
              me.event_type,
              me.impact_direction,
              me.importance_score,
              me.event_date,
              me.evidence_summary,
              case
                when jsonb_typeof(me.regions) = 'array'
                  then array(select jsonb_array_elements_text(me.regions))
                else null
              end as regions
            from public.market_events me
            left join public.documents d on d.document_id = me.document_id
            where lower(me.commodity) = $1
              and coalesce(me.active, false) = true
              and (me.expiry_date is null or me.expiry_date >= now())
              and coalesce(me.archive, false) = false
            order by me.event_date desc nulls last, me.created_at desc nulls last
          `,
          [commodity]
        );

        return rows.rows.map((row) => ({
          documentId: row.document_id,
          documentName: decodeFileLabel(row.filename ?? row.document_id),
          commodity: row.commodity,
          headline: row.headline ?? "Untitled event",
          eventType: row.event_type,
          impactDirection: row.impact_direction,
          importanceScore:
            typeof row.importance_score === "number" ? row.importance_score : row.importance_score == null ? null : Number(row.importance_score),
          eventDate: row.event_date instanceof Date ? row.event_date.toISOString() : row.event_date ?? null,
          evidenceSummary: row.evidence_summary,
          regions: Array.isArray(row.regions) ? row.regions : [],
        }));
      } catch (err) {
        if (err instanceof UnauthenticatedError || err instanceof AuthenticationError) {
          redirect("/login");
        }
        const crash = getInjection("ICrashReporterService");
        crash.report(err);
        throw err;
      }
    }
  );
}
