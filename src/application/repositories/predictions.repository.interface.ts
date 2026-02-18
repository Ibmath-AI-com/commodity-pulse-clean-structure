// FILE: src/application/repositories/predictions.repository.interface.ts

import type { PredictionRecord } from "@/src/entities/models/prediction";

export type GetPredictionsQuery = {
  uid: string;
  limit?: number;
  commodity?: string;
  status?: "success" | "error" | "unknown";
};

export interface IPredictionsRepository {
  save(prediction: PredictionRecord): Promise<void>;
  getByUser(query: GetPredictionsQuery): Promise<PredictionRecord[]>;
  getById(id: string): Promise<PredictionRecord | null>;
}
