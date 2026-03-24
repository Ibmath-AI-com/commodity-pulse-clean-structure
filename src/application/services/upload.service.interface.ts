// FILE: src/application/services/upload.service.interface.ts
import type { InitUploadResult, DeleteUploadsResult, ArchiveUploadsResult, ListUploadsResult } from "@/src/entities/models/upload";

export type ListUploadsQuery = { commodity: string; region: string };
export type InitUploadCommand = { commodity: string; region: string; filename: string; contentType: string };
export type DeleteUploadsCommand = { objectNames: string[] };
export type ArchiveUploadsCommand = { objectNames: string[] };


export interface IUploadPageService {
  list(query: ListUploadsQuery): Promise<ListUploadsResult>;
  init(cmd: InitUploadCommand): Promise<InitUploadResult>;
  delete(cmd: DeleteUploadsCommand): Promise<DeleteUploadsResult>;
  archive(cmd: ArchiveUploadsCommand): Promise<ArchiveUploadsResult>;
}