import type { DashboardPrediction } from "@/src/entities/models/dashboard";

export interface IPredictionsDashboardRepository {
  getPredictionsForUser(uid: string, limit: number): Promise<DashboardPrediction[]>;
}