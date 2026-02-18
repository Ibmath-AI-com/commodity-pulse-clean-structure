// FILE: src/application/services/report-generator.service.interface.ts



export type ReportGenerateInput = {
  commodity: string;
  sourceObjectName: string;
};

export type ReportGenerateOutput = {
  ok: true;
};

/**
 * Port to trigger signal extraction from the latest PDF.
 * Typically wraps POST /api/report/generate (server-side).
 */
export interface IReportGeneratorService {
  generate(input: ReportGenerateInput): Promise<ReportGenerateOutput>;
}
