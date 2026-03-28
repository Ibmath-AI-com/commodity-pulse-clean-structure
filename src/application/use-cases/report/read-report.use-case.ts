import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type {
  IReportReaderService,
  ReadReportFileResult,
} from "@/src/application/services/report-reader.service.interface";

export type IReadReportUseCase = (input: {
  objectName: string;
}) => Promise<ReadReportFileResult>;

export const readReportUseCase =
  (
    instrumentation: IInstrumentationService,
    reportReaderService: IReportReaderService
  ): IReadReportUseCase =>
  async (input) => {
    return instrumentation.startSpan(
      { name: "report.use-case > readReportUseCase", op: "function" },
      async () => {
        const objectName = String(input.objectName ?? "").trim();
        if (!objectName) {
          return { ok: false, error: "Missing objectName" };
        }

        return await reportReaderService.readByObjectName(objectName);
      }
    );
  };