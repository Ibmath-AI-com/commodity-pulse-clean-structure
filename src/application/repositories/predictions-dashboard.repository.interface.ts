// FILE: src/application/repositories/predictions-dashboard.repository.interface.ts

import type {
  DashboardChartPoint,
  DashboardPrediction,
} from "@/src/entities/models/dashboard";

export interface IPredictionsDashboardRepository {
  getPredictionsForUser(params: {
    uid: string;
    commodity?: string;
    limit?: number;
  }): Promise<DashboardPrediction[]>;

  getMarketChartForUser(params: {
    uid: string;
    commodity?: string;
    limit?: number;
  }): Promise<DashboardChartPoint[]>;
}