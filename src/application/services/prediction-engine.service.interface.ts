//E:\AI Projects\commodity-clean-structure\src\application\services\prediction-engine.service.interface.ts
import type { PredictionBundle } from "@/src/entities/models/prediction";

export type PredictionExecuteInput = {
  uid: string;
  commodity: string;
  futureDate: string; // YYYY-MM-DD
  basisKeys: string[]; // max 2 (enforced by UI/use-case)
  basisLabels: string[]; // same length as basisKeys
  basePrices: Array<number | null>; // aligned with basis order; null allowed when not provided
};

// n8n runs once and returns one consolidated result (even if 2 basis were selected).
export type PredictionExecuteOutput = {
  bundle: PredictionBundle;
};

export interface IPredictionEngineService {
  execute(input: PredictionExecuteInput): Promise<PredictionExecuteOutput>;
}
