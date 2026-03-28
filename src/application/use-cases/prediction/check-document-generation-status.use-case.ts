// FILE: src/application/use-cases/prediction/check-document-generation-status.use-case.ts

import type { IDocumentGenerationStatusRepository } from "@/src/application/repositories/document-generation-status.repository.interface";
import type {
  DocumentGenerationStatus,
  PredictionReadinessItem,
  PredictionReadinessResult,
} from "@/src/entities/models/document-generation-status";

export type ICheckDocumentGenerationStatusUseCase = (
  input: { commodity: string }
) => Promise<PredictionReadinessResult>;

function toItem(row: DocumentGenerationStatus): PredictionReadinessItem {
  const allSuccess =
    row.newsStatus === "success" &&
    row.imagesStatus === "success" &&
    row.vectorsStatus === "success";

  const anyFailed =
    row.newsStatus === "failed" ||
    row.imagesStatus === "failed" ||
    row.vectorsStatus === "failed";

  return {
    documentId: row.documentId,
    status: allSuccess ? "success" : anyFailed ? "failed" : "running",
    newsStatus: row.newsStatus,
    imagesStatus: row.imagesStatus,
    vectorsStatus: row.vectorsStatus,
  };
}

export const checkDocumentGenerationStatusUseCase =
  (
    repo: IDocumentGenerationStatusRepository
  ): ICheckDocumentGenerationStatusUseCase =>
  async ({ commodity }) => {
    const rows = await repo.findByCommodity(commodity);
    const items = rows.map(toItem);

    const readyDocuments = items.filter((x) => x.status === "success");
    const runningDocuments = items.filter((x) => x.status === "running");
    const failedDocuments = items.filter((x) => x.status === "failed");

    const totalDocuments = items.length;

    let canRunForecast = readyDocuments.length > 0;
    let message: string | null = null;

    if (totalDocuments === 0) {
      canRunForecast = false;
      message = "No generated documents found for this commodity.";
    } else if (totalDocuments === 1 && readyDocuments.length === 0) {
      canRunForecast = false;
      message = runningDocuments.length
        ? "The only available document is still running."
        : "The only available document failed. Re-upload it or fix the workflow.";
    } else if (runningDocuments.length > 0 && readyDocuments.length > 0) {
      message = "Some documents are still running. You can wait or exclude them.";
    } else if (failedDocuments.length > 0 && readyDocuments.length > 0) {
      message = "Some documents failed. Re-upload them or exclude them.";
    } else if (readyDocuments.length === totalDocuments) {
      message = null;
    } else if (readyDocuments.length === 0) {
      canRunForecast = false;
      message = "No document is fully ready for forecasting.";
    }

    return {
      commodity,
      totalDocuments,
      readyDocuments,
      runningDocuments,
      failedDocuments,
      canRunForecast,
      message,
    };
  };