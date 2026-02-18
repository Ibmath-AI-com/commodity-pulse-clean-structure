import type { Confidence, PredictionBundle } from "@/src/entities/models/prediction";

// If you still receive the API multi-shape from your predict endpoint, define it here (DTO shape).
export type ApiMultiResponse = {
  results: Array<{
    basisKey: string;
    basisLabel: string;
    data: unknown;
  }>;
};

// ✅ Stable mapping: alignmentScore -> label
export function labelFromAlignmentScore(x: number): Confidence {
  if (!Number.isFinite(x)) return "Low";
  if (x >= 0.6) return "High";
  if (x >= 0.35) return "Medium";
  return "Low";
}

export function parseMaybeJsonString(v: unknown) {
  if (typeof v !== "string") return null;
  try {
    return JSON.parse(v);
  } catch {
    return null;
  }
}

export function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function toNumberLoose(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") {
    const m = v.match(/-?\d+(\.\d+)?/);
    if (!m) return null;
    const n = Number(m[0]);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

export function normalizeConfidence(v: unknown): Confidence {
  const x = String(v ?? "").trim().toLowerCase();
  if (x === "high") return "High";
  if (x === "low") return "Low";
  return "Medium";
}

// ✅ FIX: treat BID as "Up"
export function actionToImpact(actionRaw: string): "Up" | "Down" | "Risk" {
  const a = String(actionRaw ?? "").trim().toUpperCase();
  if (a === "BUY BID" || a === "BID") return "Up";
  if (a === "SELL OFFER" || a === "OFFER") return "Down";
  return "Risk";
}

/**
 * Normalize any n8n response into a PredictionBundle.
 * IMPORTANT: This is pure normalization; network calls belong in infrastructure/services.
 */
export function normalizeN8nPayload(raw: unknown): PredictionBundle {
  let p: any = Array.isArray(raw) ? raw[0] : raw;

  if (p && typeof p.output === "string") {
    const parsed = parseMaybeJsonString(p.output);
    if (parsed) p = parsed;
  }

  if (p && typeof p.output === "object" && p.output) {
    const o = p.output as any;
    if (o.tender || o.caliBidTable || o.tenderPredictedPrice || o.tenderAction) p = o;
  }

  // If workflow returns top-level tender fields, wrap them
  if (!p?.tender && (p?.tenderAction || p?.tenderPredictedPrice != null || p?.unit)) {
    p = {
      ...p,
      tender: {
        tenderAction: p.tenderAction ?? "PASS",
        tenderPredictedPrice: p.tenderPredictedPrice ?? null,
        unit: p.unit ?? "USD/t",
        confidence: normalizeConfidence(p.confidence),
        decisionConfidence: p.decisionConfidence ?? undefined,
        rationale: p.rationale ?? "",
        signals: p.signals ?? undefined,
      },
    };
  }

  // Ensure decisionConfidence exists if alignmentScore exists
  const a = p?.tender?.signals?.alignmentScore;
  if (p?.tender && p.tender.decisionConfidence == null && typeof a === "number") {
    p = {
      ...p,
      tender: {
        ...p.tender,
        decisionConfidence: labelFromAlignmentScore(a),
      },
    };
  }

  return p as PredictionBundle;
}

export function isApiMultiResponse(x: unknown): x is ApiMultiResponse {
  return !!x && typeof x === "object" && Array.isArray((x as any).results);
}
