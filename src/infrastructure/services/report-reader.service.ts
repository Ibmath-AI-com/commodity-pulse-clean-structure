import "server-only";

import type {
  IReportReaderService,
  ReadReportFileResult,
} from "@/src/application/services/report-reader.service.interface";
import type { IObjectStorageService } from "@/src/application/services/storage.service.interface";

function tryParseJson(v: string): unknown | null {
  const s = String(v ?? "").trim();
  if (!s) return null;

  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export class OSReportReaderService implements IReportReaderService {
  constructor(private readonly storage: IObjectStorageService) {}

  async readByObjectName(objectName: string): Promise<ReadReportFileResult> {
    const key = String(objectName ?? "").trim();
    if (!key) return { ok: false, error: "Missing objectName" };

    try {
      const text = await this.storage.readObjectAsText("active", key);

      const parsed = tryParseJson(text);
      if (parsed != null) {
        return {
          ok: true,
          kind: "json",
          objectName: key,
          json: parsed,
        };
      }

      return {
        ok: true,
        kind: "text",
        objectName: key,
        text,
      };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to read report";
      return { ok: false, error: msg };
    }
  }
}