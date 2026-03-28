// FILE: src/application/use-cases/dashboard/get-dashboard-history.use-case.ts

import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { IPredictionsDashboardRepository } from "@/src/application/repositories/predictions-dashboard.repository.interface";
import type { DashboardPrediction } from "@/src/entities/models/dashboard";

export type IGetDashboardHistoryUseCase =
  ReturnType<typeof getDashboardHistoryUseCase>;

export const getDashboardHistoryUseCase =
  (
    instrumentation: IInstrumentationService,
    repository: IPredictionsDashboardRepository
  ) =>
  async (input: {
    uid: string;
    limit: number;
    commodity?: string;
  }): Promise<DashboardPrediction[]> =>
    instrumentation.startSpan(
      { name: "getDashboardHistoryUseCase", op: "function" },
      async () => {
        if (!input.uid) {
          throw new Error("Missing uid");
        }

        return repository.getPredictionsForUser({
          uid: input.uid,
          limit: input.limit,
          commodity: input.commodity,
        });
      }
    );