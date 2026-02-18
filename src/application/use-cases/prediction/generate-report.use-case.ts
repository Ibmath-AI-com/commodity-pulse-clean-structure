// FILE: src/application/use-cases/prediction/generate-report.use-case.ts

import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type {
  IReportGeneratorService,
  ReportGenerateInput,
  ReportGenerateOutput,
} from "@/src/application/services/report-generator.service.interface";

export type IGenerateReportUseCase = ReturnType<typeof generateReportUseCase>;

export const generateReportUseCase =
  (
    instrumentation: IInstrumentationService,
    reportService: IReportGeneratorService
  ) =>
  async (input: ReportGenerateInput): Promise<ReportGenerateOutput> =>
    instrumentation.startSpan(
      { name: "generateReportUseCase", op: "function" },
      async () => {
        if (!input.commodity?.trim()) {
          throw new Error("Missing commodity");
        }

        if (!input.sourceObjectName?.trim()) {
          throw new Error("Missing sourceObjectName");
        }

        return reportService.generate(input);
      }
    );
