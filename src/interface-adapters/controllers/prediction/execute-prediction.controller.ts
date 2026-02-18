// FILE: src/interface-adapters/controllers/prediction/run-prediction.controller.ts
import { cookies } from "next/headers";

import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { ISessionService } from "@/src/application/services/session.service.interface";
import type { IEnsureSignalsUseCase } from "@/src/application/use-cases/prediction/ensure-signals.use-case";
import type { IExecutePredictionUseCase } from "@/src/application/use-cases/prediction/execute-prediction.use-case";
import type { IPredictionsRepository } from "@/src/application/repositories/predictions.repository.interface";

import { UnauthenticatedError } from "@/src/entities/errors/auth";
import type { PredictionBundle, PredictionRecord } from "@/src/entities/models/prediction";

type RunPredictionInput = {
  commodity: string;
  region?: string; // default "global"
  futureDate: string; // YYYY-MM-DD
  basisKeys: string[]; // max 2 (enforce in UI; validate here)
  basisLabels: string[]; // same length as basisKeys
  basePrices: Array<number | null>; // same length as basisKeys; null allowed
};

export type RunPredictionOutput = {
  bundle: PredictionBundle;
};

export type IRunPredictionController = ReturnType<typeof runPredictionController>;

export const runPredictionController =
  (
    instrumentation: IInstrumentationService,
    sessionService: ISessionService,
    ensureSignals: IEnsureSignalsUseCase,
    executePrediction: IExecutePredictionUseCase,
    predictionsRepo: IPredictionsRepository
  ) =>
  async (input: RunPredictionInput): Promise<RunPredictionOutput> =>
    instrumentation.startSpan({ name: "runPrediction Controller", op: "http" }, async () => {
      const cookieStore = await cookies(); // IMPORTANT (Next 15+)
      const sessionCookie = cookieStore.get("session")?.value;
      if (!sessionCookie) throw new UnauthenticatedError("Must be logged in");

      const { uid } = await sessionService.validateSessionCookie({ sessionCookie });

      // Validate input defensively (don’t trust client)
      const commodity = String(input.commodity ?? "").trim().toLowerCase();
      const region = String(input.region ?? "global").trim().toLowerCase() || "global";
      const futureDate = String(input.futureDate ?? "").trim();

      if (!commodity) throw new Error("Missing commodity");
      if (!futureDate) throw new Error("Missing futureDate");
      if (!/^\d{4}-\d{2}-\d{2}$/.test(futureDate)) throw new Error("futureDate must be YYYY-MM-DD");

      const basisKeys = Array.isArray(input.basisKeys) ? input.basisKeys : [];
      if (basisKeys.length < 1) throw new Error("At least one basis is required");
      if (basisKeys.length > 2) throw new Error("Max 2 basis allowed");

      const basisLabels = Array.isArray(input.basisLabels) ? input.basisLabels : [];
      if (basisLabels.length !== basisKeys.length) {
        throw new Error("basisLabels length must match basisKeys length");
      }

      const basePrices = Array.isArray(input.basePrices) ? input.basePrices : [];
      if (basePrices.length !== basisKeys.length) {
        throw new Error("basePrices length must match basis length");
      }
      if (basePrices.some((p) => p != null && !Number.isFinite(p))) {
        throw new Error("Invalid basePrices values");
      }

      // 1) Ensure signals exist (may trigger report generation)
      await ensureSignals({ commodity, region });

      // 2) Execute prediction (n8n)
      const { bundle } = await executePrediction({
        uid,
        commodity,
        futureDate,
        basisKeys,
        basisLabels,
        basePrices,
      });

      // 3) Persist minimal record (don’t fail request on persistence errors)
      const recordBase: Omit<PredictionRecord, "id"> = {
        uid,
        createdAt: new Date(),
        runtimeMs: null,
        commodity,
        futureDate,
        basisLabels,
        basisKeys,
        basePrices,
        status: "success",
        n8nHttpStatus: null,
        outputs: {
          tenderPredictedPrice: bundle?.tender?.tenderPredictedPrice ?? null,
          signals: bundle?.tender?.signals
            ? { trend: bundle.tender.signals.trend ?? null }
            : null,
        },
        error: null,
        news: bundle?.news ?? null,
      };

      try {
        await predictionsRepo.save({ ...recordBase, id: crypto.randomUUID() });
      } catch {
        // Persistence failure should not break prediction response.
      }

      // 4) Return DTO
      return { bundle };
    });
