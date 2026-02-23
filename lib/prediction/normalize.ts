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

type UnknownRecord = Record<string, unknown>;

function isRecord(v: unknown): v is UnknownRecord {
  return typeof v === "object" && v !== null;
}

function hasStringOutput(v: unknown): v is UnknownRecord & { output: string } {
  return isRecord(v) && typeof v.output === "string";
}

function hasObjectOutput(v: unknown): v is UnknownRecord & { output: UnknownRecord } {
  return isRecord(v) && isRecord(v.output);
}

function looksLikeBundle(o: UnknownRecord): boolean {
  return (
    "tender" in o ||
    "caliBidTable" in o ||
    "tenderPredictedPrice" in o ||
    "tenderAction" in o
  );
}

/**
 * Normalize any n8n response into a PredictionBundle.
 * IMPORTANT: This is pure normalization; network calls belong in infrastructure/services.
 */
export function normalizeN8nPayload(raw: unknown): PredictionBundle {
  let p: unknown = Array.isArray(raw) ? raw[0] : raw;

  if (hasStringOutput(p)) {
    const parsed = parseMaybeJsonString(p.output);
    if (parsed) p = parsed;
  }

  if (hasObjectOutput(p)) {
    const o = p.output;
    if (looksLikeBundle(o)) p = o;
  }

  // If workflow returns top-level tender fields, wrap them
  if (isRecord(p) && !("tender" in p) && ("tenderAction" in p || "tenderPredictedPrice" in p || "unit" in p)) {
    const tenderAction = "tenderAction" in p ? p.tenderAction : undefined;
    const tenderPredictedPrice = "tenderPredictedPrice" in p ? p.tenderPredictedPrice : undefined;
    const unit = "unit" in p ? p.unit : undefined;

    p = {
      ...p,
      tender: {
        tenderAction: tenderAction ?? "PASS",
        tenderPredictedPrice: tenderPredictedPrice ?? null,
        unit: unit ?? "USD/t",
        confidence: normalizeConfidence("confidence" in p ? p.confidence : undefined),
        decisionConfidence: "decisionConfidence" in p ? p.decisionConfidence : undefined,
        rationale: ("rationale" in p ? p.rationale : "") ?? "",
        signals: "signals" in p ? p.signals : undefined,
      },
    };
  }

  // Ensure decisionConfidence exists if alignmentScore exists
  if (isRecord(p)) {
    const tender = isRecord(p.tender) ? p.tender : null;
    const signals = tender && isRecord(tender.signals) ? tender.signals : null;
    const alignmentScore = signals?.alignmentScore;

    if (tender && tender.decisionConfidence == null && typeof alignmentScore === "number") {
      p = {
        ...p,
        tender: {
          ...tender,
          decisionConfidence: labelFromAlignmentScore(alignmentScore),
        },
      };
    }
  }

  return p as PredictionBundle;
}

export function isApiMultiResponse(x: unknown): x is ApiMultiResponse {
  return (
    isRecord(x) &&
    Array.isArray((x as { results?: unknown }).results)
  );
}