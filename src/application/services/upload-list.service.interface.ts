// FILE: src/application/services/upload-list.service.interface.ts
import type { UploadListItem } from "@/src/entities/models/prediction";

export type UploadListQuery = {
  commodity: string;
  region?: string; // default "global" in implementation
};

export type UploadListResult = {
  items: UploadListItem[];
  eventSignalsExists: boolean;
};

export interface IUploadListService {
  list(input: UploadListQuery): Promise<UploadListResult>;
}
