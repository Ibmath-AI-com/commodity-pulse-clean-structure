// FILE: src/interface-adapters/mappers/prediction/n8n-prediction.mapper.ts

import type { PredictionBundle } from "@/src/entities/models/prediction";

function isObject(x: unknown): x is Record<string, any> {
  return typeof x === "object" && x !== null;
}

function unwrapN8n(raw: unknown): Record<string, any> {
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

/**
 * Maps raw n8n payload (your sample: [ { ...flat fields... } ]) into PredictionBundle.
 * n8n runs once and returns one consolidated result.
 */
export function mapN8nPayloadToPredictionBundle(raw: unknown): PredictionBundle {
  const r = unwrapN8n(raw);

  // Optional: fail fast if n8n returns ok:false
  if (r.ok === false) {
    const msg = String(r.error ?? r.message ?? "n8n returned ok:false").trim();
    throw new Error(msg || "n8n returned ok:false");
  }

  return {
    tender: {
      tenderAction: r?.tenderAction ?? null,
      tenderPredictedPrice: toNumberOrNull(r?.tenderPredictedPrice),
      unit: r?.unit ?? null,
      confidence: r?.confidence ?? null,
      decisionConfidence: r?.decisionConfidence ?? null,
      rationale: r?.rationale ?? null,
      signals: isObject(r?.signals)
        ? {
            trend: r.signals?.trend ?? null,
            sentimentScore: toNumberOrNull(r.signals?.sentimentScore),
            alignmentScore: toNumberOrNull(r.signals?.alignmentScore),
          }
        : null,
    },

    expectedRange: isObject(r?.expectedRange)
      ? {
          p10: toNumberOrNull(r.expectedRange?.p10),
          p90: toNumberOrNull(r.expectedRange?.p90),
          level: toNumberOrNull(r.expectedRange?.level),
          method: r.expectedRange?.method ?? null,
          halfWidth: toNumberOrNull(r.expectedRange?.halfWidth),
          n: toNumberOrNull(r.expectedRange?.n),
        }
      : null,

    expectedSellingPrice: r?.expectedSellingPrice ?? null,
    spotPricesText: r?.spotPricesText ?? null,

    caliBidTable: Array.isArray(r?.caliBidTable) ? r.caliBidTable : null,

    news: isObject(r?.news)
      ? {
          count: Array.isArray(r.news?.events) ? r.news.events.length : null,
          events: Array.isArray(r.news?.events) ? r.news.events : null,
        }
      : null,

    evidence: Array.isArray(r?.evidence) ? r.evidence : null,

    // If you added riskAnalysis to PredictionBundle type, this will flow through.
    riskAnalysis: isObject(r?.riskAnalysis) ? (r.riskAnalysis as any) : null,

    notes: Array.isArray(r?.notes) ? r.notes : null,
    market: isObject(r?.market) ? r.market : null,
  };
}
