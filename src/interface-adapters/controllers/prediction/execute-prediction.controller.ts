import crypto from "crypto";
import { cookies } from "next/headers";

import type { IPredictionsRepository } from "@/src/application/repositories/predictions.repository.interface";
import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { ISessionService } from "@/src/application/services/session.service.interface";
import type { IGetCurrentUserUseCase } from "@/src/application/use-cases/auth/get-current-user.use-case";
import type { ICheckDocumentGenerationStatusUseCase } from "@/src/application/use-cases/prediction/check-document-generation-status.use-case";
import type { IExecutePredictionUseCase } from "@/src/application/use-cases/prediction/execute-prediction.use-case";

import { UnauthenticatedError } from "@/src/entities/errors/auth";
import type { PredictionBundle, PredictionRecord } from "@/src/entities/models/prediction";
import type { PredictionReadinessResult } from "@/src/entities/models/document-generation-status";

type RunPredictionInput = {
  commodity: string;
  region?: string;
  futureDate: string;
  basisKeys: string[];
  basisLabels: string[];
  basePrices: Array<number | null>;
  forceRun?: boolean;
};

export type RunPredictionOutput =
  | {
      type: "blocked";
      message: string;
    }
  | {
      type: "confirmation_required";
      message: string;
      status: PredictionReadinessResult;
    }
  | {
      type: "success";
      bundle: PredictionBundle;
    };

export type IRunPredictionController = ReturnType<typeof runPredictionController>;

export const runPredictionController =
  (
    instrumentation: IInstrumentationService,
    sessionService: ISessionService,
    getCurrentUser: IGetCurrentUserUseCase,
    checkDocumentGenerationStatus: ICheckDocumentGenerationStatusUseCase,
    executePrediction: IExecutePredictionUseCase,
    predictionsRepo: IPredictionsRepository
  ) =>
  async (input: RunPredictionInput): Promise<RunPredictionOutput> =>
    instrumentation.startSpan(
      { name: "runPrediction Controller", op: "http" },
      async () => {
        const cookieStore = await cookies();
        const sessionToken = await sessionService.getSessionToken(cookieStore);

        if (!sessionToken) {
          throw new UnauthenticatedError("Must be logged in");
        }

        const currentUser = await getCurrentUser(sessionToken);
        const uid = currentUser.id;

        const commodity = String(input.commodity ?? "").trim().toLowerCase();
        const futureDate = String(input.futureDate ?? "").trim();

        if (!commodity) throw new Error("Missing commodity");
        if (!futureDate) throw new Error("Missing futureDate");
        if (!/^\d{4}-\d{2}-\d{2}$/.test(futureDate)) {
          throw new Error("futureDate must be YYYY-MM-DD");
        }

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

        const docCheck = await checkDocumentGenerationStatus({ commodity });

        const hasReady = docCheck.readyDocuments.length > 0;
        const hasRunning = docCheck.runningDocuments.length > 0;
        const hasFailed = docCheck.failedDocuments.length > 0;

        if (docCheck.totalDocuments === 0) {
          return {
            type: "blocked",
            message: "No generated documents found for this commodity.",
          };
        }

        if (docCheck.totalDocuments === 1 && !hasReady) {
          return {
            type: "blocked",
            message: docCheck.message ?? "The only available document is not ready.",
          };
        }

        if (!hasReady) {
          return {
            type: "blocked",
            message: docCheck.message ?? "No ready documents available for forecasting.",
          };
        }

        if ((hasRunning || hasFailed) && !input.forceRun) {
          return {
            type: "confirmation_required",
            message:
              docCheck.message ??
              (hasRunning
                ? "Some documents are still running. Continue without them?"
                : "Some documents failed. Continue without them?"),
            status: docCheck,
          };
        }

        const { bundle } = await executePrediction({
          uid,
          commodity,
          futureDate,
          basisKeys,
          basisLabels,
          basePrices,
        });

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

       // Save the run record to the database   
       try {
          await predictionsRepo.save({
            ...recordBase,
            id: crypto.randomUUID(),
          });
        } catch (error) {
          console.error("Failed to persist prediction record", {
            commodity,
            futureDate,
            uid,
            basisKeys,
            basisLabels,
            basePrices,
            error,
          });
          throw error;
        }

        return {
          type: "success",
          bundle,
        };
      }
    );