import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { IPredictionsDashboardRepository } from "@/src/application/repositories/predictions-dashboard.repository.interface";
import type { DashboardPrediction } from "@/src/entities/models/dashboard";

export type IGetDashboardHistoryUseCase = ReturnType<typeof getDashboardHistoryUseCase>;

export const getDashboardHistoryUseCase =
  (
    instrumentation: IInstrumentationService,
    repository: IPredictionsDashboardRepository
  ) =>
  async (
    input: { uid: string; limit: number }
  ): Promise<DashboardPrediction[]> =>
    instrumentation.startSpan(
      { name: "getDashboardHistoryUseCase", op: "function" },
      async () => {
        if (!input.uid) {
          throw new Error("Missing uid");
        }

        return repository.getPredictionsForUser(input.uid, input.limit);
      }
    );
