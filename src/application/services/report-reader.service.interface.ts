export type ReadReportFileResult =
  | { ok: true; kind: "json"; objectName: string; json: unknown }
  | { ok: true; kind: "text"; objectName: string; text: string }
  | { ok: false; error: string };

export interface IReportReaderService {
  readByObjectName(objectName: string): Promise<ReadReportFileResult>;
}