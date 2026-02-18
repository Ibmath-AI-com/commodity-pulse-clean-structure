// FILE: src/application/use-cases/prediction/execute-prediction.use-case.ts

import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type {
  IPredictionEngineService,
  PredictionExecuteInput,
  PredictionExecuteOutput,
} from "@/src/application/services/prediction-engine.service.interface";

export type IExecutePredictionUseCase = ReturnType<typeof executePredictionUseCase>;

export const executePredictionUseCase =
  (instrumentation: IInstrumentationService, executionService: IPredictionEngineService) =>
  async (input: PredictionExecuteInput): Promise<PredictionExecuteOutput> =>
    instrumentation.startSpan({ name: "executePredictionUseCase", op: "function" }, async () => {
      /* ===============================
         Hard validation (domain boundary)
      =============================== */

      if (!input.uid) throw new Error("Missing uid");

      const commodity = String(input.commodity ?? "").trim().toLowerCase();
      if (!commodity) throw new Error("Missing commodity");

      const futureDate = String(input.futureDate ?? "").trim();
      if (!futureDate) throw new Error("Missing futureDate");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(futureDate)) throw new Error("futureDate must be YYYY-MM-DD");

      if (!Array.isArray(input.basisKeys) || input.basisKeys.length === 0) {
        throw new Error("At least one basis is required");
      }
      if (input.basisKeys.length > 2) throw new Error("Maximum 2 basis allowed");

      if (!Array.isArray(input.basisLabels) || input.basisLabels.length === 0) {
        throw new Error("At least one basis label is required");
      }
      if (input.basisLabels.length !== input.basisKeys.length) {
        throw new Error("basisLabels length must match basisKeys length");
      }

      if (!Array.isArray(input.basePrices)) throw new Error("basePrices must be an array");
      if (input.basePrices.length !== input.basisKeys.length) {
        throw new Error("basePrices length must match basis length");
      }

      // basePrices allow null (not provided). If provided, must be finite.
      if (input.basePrices.some((p) => p != null && !Number.isFinite(p))) {
        throw new Error("Invalid basePrices values");
      }

      /* ===============================
         Delegate to engine
      =============================== */

      return executionService.execute({
        ...input,
        commodity,
        futureDate,
      });
    });
