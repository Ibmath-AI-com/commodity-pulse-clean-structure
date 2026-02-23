// FILE: src/interface-adapters/mappers/prediction/n8n-prediction.mapper.ts

import type { PredictionBundle } from "@/src/entities/models/prediction";

type AnyRecord = Record<string, unknown>;

type TenderNN = NonNullable<PredictionBundle["tender"]>;
type SignalsNN = NonNullable<TenderNN["signals"]>;
type NewsEventNN = NonNullable<NonNullable<NonNullable<PredictionBundle["news"]>["events"]>[number]>;

function isObject(x: unknown): x is AnyRecord {
  return typeof x === "object" && x !== null;
}

function unwrapN8n(raw: unknown): AnyRecord {
  if (Array.isArray(raw)) {
    const first = raw[0];
    if (!isObject(first)) throw new Error("Invalid n8n response: array[0] is not an object");
    return first;
  }
  if (!isObject(raw)) throw new Error("Invalid n8n response: not an object");
  return raw;
}

function toNumberOrNull(x: unknown): number | null {
  if (x == null) return null;
  if (typeof x === "number") return Number.isFinite(x) ? x : null;
  if (typeof x === "string") {
    const s = x.trim();
    if (!s) return null;
    const n = Number(s);
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(x);
  return Number.isFinite(n) ? n : null;
}

function toStringOrNull(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v;
  return String(v);
}

// Minimal “NewsEvent” normalizer: keep only fields you know exist; drop garbage safely.
function mapNewsEvent(x: unknown): NewsEventNN | null {
  if (!isObject(x)) return null;

  // Keep these keys aligned with your NewsEvent type from src/entities/models/prediction
  const event_type = toStringOrNull(x["event_type"]);
  const headline = toStringOrNull(x["headline"]);
  const evidence_summary = toStringOrNull(x["evidence_summary"]);
  const impact_direction = toStringOrNull(x["impact_direction"]);
  const importance_score =
    typeof x["importance_score"] === "number" && Number.isFinite(x["importance_score"])
      ? (x["importance_score"] as number)
      : toNumberOrNull(x["importance_score"]);
  const event_date = toStringOrNull(x["event_date"]);

  // Return an object that matches NewsEvent’s shape (all optional fields, so safe)
  return {
    event_type,
    headline,
    evidence_summary,
    impact_direction,
    importance_score: importance_score ?? null,
    event_date,
  } as NewsEventNN;
}

/**
 * Maps raw n8n payload into PredictionBundle.
 */
export function mapN8nPayloadToPredictionBundle(raw: unknown): PredictionBundle {
  const r = unwrapN8n(raw);

  if (r["ok"] === false) {
    const msg = String(r["error"] ?? r["message"] ?? "n8n returned ok:false").trim();
    throw new Error(msg || "n8n returned ok:false");
  }

  const signalsRaw = isObject(r["signals"]) ? (r["signals"] as AnyRecord) : null;
  const expectedRangeRaw = isObject(r["expectedRange"]) ? (r["expectedRange"] as AnyRecord) : null;
  const newsRaw = isObject(r["news"]) ? (r["news"] as AnyRecord) : null;

  // expectedRange: do NOT include keys your domain type doesn’t have.
  // (Your earlier error proves "method" is not in ExpectedRange.)
  const expectedRange: PredictionBundle["expectedRange"] = expectedRangeRaw
    ? ({
        p10: toNumberOrNull(expectedRangeRaw["p10"]),
        p90: toNumberOrNull(expectedRangeRaw["p90"]),
        level: toNumberOrNull(expectedRangeRaw["level"]),
        halfWidth: toNumberOrNull(expectedRangeRaw["halfWidth"]),
        n: toNumberOrNull(expectedRangeRaw["n"]),
      } as PredictionBundle["expectedRange"])
    : null;

  // news: map events to NewsEvent[]
  const eventsRaw = newsRaw && Array.isArray(newsRaw["events"]) ? (newsRaw["events"] as unknown[]) : null;
  const mappedEvents = eventsRaw
    ? (eventsRaw.map(mapNewsEvent).filter((x): x is NewsEventNN => x !== null) as unknown as NonNullable<
        NonNullable<PredictionBundle["news"]>["events"]
      >)
    : null;

  const news: PredictionBundle["news"] = newsRaw
    ? ({
        count: mappedEvents ? mappedEvents.length : null,
        events: mappedEvents,
      } as PredictionBundle["news"])
    : null;

  const signals: TenderNN["signals"] = signalsRaw
    ? ({
        trend: toStringOrNull(signalsRaw["trend"]) as SignalsNN["trend"],
        sentimentScore: toNumberOrNull(signalsRaw["sentimentScore"]),
        alignmentScore: toNumberOrNull(signalsRaw["alignmentScore"]),
      } as SignalsNN)
    : null;

  return {
    tender: {
      tenderAction: (r["tenderAction"] ?? null) as PredictionBundle["tender"]["tenderAction"],
      tenderPredictedPrice: toNumberOrNull(r["tenderPredictedPrice"]),
      unit: (r["unit"] ?? null) as PredictionBundle["tender"]["unit"],
      confidence: (r["confidence"] ?? null) as PredictionBundle["tender"]["confidence"],
      decisionConfidence: (r["decisionConfidence"] ?? null) as PredictionBundle["tender"]["decisionConfidence"],
      rationale: (r["rationale"] ?? null) as PredictionBundle["tender"]["rationale"],
      signals,
    },

    expectedRange,

    expectedSellingPrice: (r["expectedSellingPrice"] ?? null) as PredictionBundle["expectedSellingPrice"],
    spotPricesText: (r["spotPricesText"] ?? null) as PredictionBundle["spotPricesText"],

    caliBidTable: (Array.isArray(r["caliBidTable"]) ? (r["caliBidTable"] as unknown[]) : null) as PredictionBundle["caliBidTable"],

    news,

    evidence: (Array.isArray(r["evidence"]) ? (r["evidence"] as unknown[]) : null) as PredictionBundle["evidence"],

    // keep pass-through
    riskAnalysis: (isObject(r["riskAnalysis"]) ? (r["riskAnalysis"] as AnyRecord) : null) as PredictionBundle["riskAnalysis"],

    notes: (Array.isArray(r["notes"]) ? (r["notes"] as unknown[]) : null) as PredictionBundle["notes"],
    market: (isObject(r["market"]) ? (r["market"] as AnyRecord) : null) as PredictionBundle["market"],
  };
}