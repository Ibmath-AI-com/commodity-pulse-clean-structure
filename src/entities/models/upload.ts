// FILE: src/entities/models/upload.ts

import type { DocumentNewsSummary } from "@/src/entities/models/news";

export type UploadKind = "doc" | "rdata" | "general";
export type UploadGenerationStatus = "running" | "success" | "failed";

export type UploadListItem = {
  documentId: string;
  commodity: string;
  path: string;
  sourcePath?: string;
  processingStatus?: string;
  generationStatus?: UploadGenerationStatus;
  sourceFile?: string;
  recordCount?: number;
  updatedAt?: string;
  newsSummary?: DocumentNewsSummary;
  name: string; // full object name
  size?: string | number;
  contentType?: string;
  updated?: string;

  kind: UploadKind;

  // Optional computed flags (GCS-based). If you later move to n8n, keep same shape.
  reportExists?: boolean;
  reportObjectName?: string;

  pricesExists?: boolean;
  pricesObjectName?: string;
};


export type ListUploadsResult =
  | {
      ok: true;
      bucketName: string;
      commodity: string;
      region: string;
      eventSignalsExists: boolean;
      items: UploadListItem[];
    }
  | { ok: false; error: string };

export type InitUploadResult =
  | {
      ok: true;
      bucketName: string;
      objectName: string;
      uploadUrl: string;
      expiresMinutes: number;
      kind: UploadKind;
    }
  | { ok: false; error: string };

export type DeleteUploadsResult =
  | { ok: true; deleted: string[] }
  | { ok: false; error: string };

export type ArchiveUploadsResult =
  | { ok: true; archived: string[] }
  | { ok: false; error: string };

export type NotifyUploadCompleteResult =
  | { ok: true }
  | { ok: false; error: string };

