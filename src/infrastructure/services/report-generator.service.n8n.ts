import "server-only";

import type {
  IReportGeneratorService,
  ReportGenerateInput,
  ReportGenerateOutput,
} from "@/src/application/services/report-generator.service.interface";
import type { IN8nService } from "@/src/application/services/n8n.service.interface";

export class N8nReportGeneratorService implements IReportGeneratorService {
  constructor(private readonly n8n: IN8nService) {}

  async generate(input: ReportGenerateInput): Promise<ReportGenerateOutput> {
    return this.n8n.call<ReportGenerateInput, ReportGenerateOutput>("report_generate", input, {
      timeoutMs: 180_000,
      idempotencyKey: `report:${input.commodity}:${input.sourceObjectName}`,
    });
  }
}
