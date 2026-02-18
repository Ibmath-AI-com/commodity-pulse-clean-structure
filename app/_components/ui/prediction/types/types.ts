/* Service contracts payloads (used by application/services ports) */
import type { PredictionBundle } from "@/src/entities/models/prediction";

export type Status = "idle" | "loading" | "success" | "error";

/* Run Timeline UI */

export type StepState = "pending" | "running" | "done" | "error";
export type RunStepKey = "report" | "forecast" | "refresh";

export type RiskLevel = "HIGH" | "MEDIUM" | "LOW"

export type RiskItem = { key?: string; title?: string; level?: RiskLevel; bullet?: string }

export type RiskPayload = { asOf?: string | null; modelVersion?: number; items: RiskItem[] }

export type RunTimelineState = {
  visible: boolean;
  steps: Record<RunStepKey, StepState>;
  message: string;
};

/* Detailed tables for UI sections */

export type DriverRow = {
  driver: string;
  direction: Direction;
  strength: "Weak" | "Moderate" | "Strong";
  explanation: string;
};

export type RiskRow = {
  risk: string;
  severity: "Low" | "Medium" | "High";
  condition: string;
  impact: string;
};

export type EvidenceRow = {
  event: string;
  type: string;
  direction: Direction;
  relevance: string;
};

/* Run Result (UI-facing) */

export type Direction = "Bullish" | "Bearish" | "Neutral";
export type Strength = "Strong" | "Moderate" | "Slight" | "N/A";

export type Result = {
  currency?: string | null;
  riskLevel?: "High" | "Medium" | "Low" | string | null;

  tenderUnit?: string | null;

  sentimentScore?: number | null;
  direction?: Direction;
  strength?: Strength;

  tenderPredictedPrice?: number | null;
  p10?: number | null;
  p90?: number | null;
};


export type MultiItem = {
  basisKey: string;
  basisLabel: string;
  bundle: PredictionBundle;
  result: Result;
};
