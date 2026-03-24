// FILE: src/application/use-cases/dashboard/get-dashboard-chart.use-case.ts

import type { IPredictionsDashboardRepository } from "@/src/application/repositories/predictions-dashboard.repository.interface";
import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { DashboardChartPoint } from "@/src/entities/models/dashboard";

export type IGetDashboardChartUseCase = ReturnType<typeof getDashboardChartUseCase>;

export const getDashboardChartUseCase =
  (
    instrumentation: IInstrumentationService,
    repository: IPredictionsDashboardRepository
  ) =>
  async (input: {
    uid: string;
    commodity?: string;
    limit: number;
  }): Promise<DashboardChartPoint[]> =>
    instrumentation.startSpan(
      { name: "getDashboardChartUseCase", op: "function" },
      async () => {
        if (!input.uid) {
          throw new Error("Missing uid");
        }

        return repository.getMarketChartForUser({
          uid: input.uid,
          commodity: input.commodity,
          limit: input.limit,
        });
      }
    );