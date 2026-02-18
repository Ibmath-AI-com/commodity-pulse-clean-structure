// FILE: src/entities/models/prediction.ts

/* News / Events */

export type NewsEvent = {
  event_type?: string | null;
  headline?: string | null;
  evidence_summary?: string | null;
  impact_direction?: string | null;
  importance_score?: number | null;
  event_date?: string | null; // YYYY-MM-DD
};

export type PredNews = {
  count?: number | null;
  events?: NewsEvent[] | null;
};

/* Tender / Signals / Range */

export type Confidence = "High" | "Medium" | "Low";

export type TenderSignals = {
  trend?: string | null;
  sentimentScore?: number | null;
  alignmentScore?: number | null;
};

export type TenderDecision = {
  tenderAction?: string | null;
  tenderPredictedPrice?: number | null;
  unit?: string | null;
  confidence?: Confidence | null;
  decisionConfidence?: Confidence | null;
  rationale?: string | null;
  signals?: TenderSignals | null;
};

export type ExpectedRange = {
  p10: number | null;
  p90: number | null;
  level?: number | null;
  method?: string | null;
  halfWidth?: number | null;
  n?: number | null;
};

/* Risk (n8n output includes this; UI renders it) */

export type RiskLevel = "HIGH" | "MEDIUM" | "LOW";

export type RiskItem = {
  key?: string | null;
  title?: string | null;
  level?: RiskLevel | null;
  bullet?: string | null;
};

export type RiskAnalysis = {
  asOf?: string | null;
  modelVersion?: number | null;
  items: RiskItem[];
  debug?: Record<string, unknown> | null;
};

/* Payload (domain view) */

export type PredictionBundle = {
  tender: TenderDecision;

  expectedRange?: ExpectedRange | null;
  expectedSellingPrice?: string | null;
  spotPricesText?: string | null;

  caliBidTable?: unknown[] | null;

  news?: PredNews | null;
  evidence?: NewsEvent[] | unknown[] | null;

  riskAnalysis?: RiskAnalysis | null;

  notes?: unknown[] | null;
  market?: Record<string, unknown> | null;
};

/* Prediction Persistence Record (Firestore "predictions") */

export type PredictionRecord = {
  id: string;
  uid: string;

  createdAt: Date | null;
  runtimeMs: number | null;

  commodity: string | null;
  futureDate: string | null; // YYYY-MM-DD

  basisLabels: string[] | null;
  basisKeys: string[] | null;

  // allow nulls if base price can be omitted
  basePrices: Array<number | null> | null;

  status: "success" | "error" | "unknown";
  n8nHttpStatus: number | null;

  outputs: {
    tenderPredictedPrice?: number | null;
    signals?: { trend?: string | null } | null;
  } | null;

  error: string | null;
  news: PredNews | null;
};

/* Upload list response (Prediction needs it) */

export type UploadListItem = {
  name: string;
  updated?: string;
  contentType?: string;
  isActive?: boolean;

  kind?: "doc" | "rdata";
  root?: "incoming" | "archive";

  reportExists?: boolean;
  reportObjectName?: string;

  pricesExists?: boolean;
  pricesObjectName?: string;
};

export type UploadListResp =
  | { ok: true; items: UploadListItem[]; eventSignalsExists?: boolean }
  | { ok: false; error?: string };
