// src/lib/prediction/mappers.ts
import type { PredictionBundle } from "@/src/entities/models/prediction";
import type {  Result } from "@/app/_components/ui/prediction/types/types";
import { toNumberLoose } from "@/lib/prediction/normalize";

export function mapPayloadToResult(bundle: PredictionBundle): Result {
  const tender = bundle?.tender;
  const predictedNum = toNumberLoose(tender?.tenderPredictedPrice);
  const unit = String(tender?.unit ?? "USD/t");

  return {
    tenderPredictedPrice: predictedNum ?? null,
    currency: unit,
    riskLevel: null,        // if you don't have a real risk model yet
    tenderUnit: unit,
    sentimentScore: tender?.signals?.sentimentScore ?? null,
    direction: undefined,   // keep computed in UI (you already do)
    strength: undefined,
    p10: bundle?.expectedRange?.p10 ?? null,
    p90: bundle?.expectedRange?.p90 ?? null,
  };
}
