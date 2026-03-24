// FILE: src/application/use-cases/upload/archive-uploads.use-case.ts
import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { IUploadPageService } from "@/src/application/services/upload.service.interface";

import type { ArchiveUploadsResult } from "@/src/entities/models/upload";

type ArchiveUploadsCommand = {
  objectNames: string[];
};

export type IArchiveUploadsUseCase = ReturnType<typeof archiveUploadsUseCase>;

export const archiveUploadsUseCase =
  (instrumentation: IInstrumentationService, uploadService: IUploadPageService) =>
  async (cmd: ArchiveUploadsCommand): Promise<ArchiveUploadsResult> =>
    instrumentation.startSpan({ name: "archiveUploadsUseCase", op: "function" }, async () => {
      if (!Array.isArray(cmd?.objectNames) || cmd.objectNames.length === 0) {
        throw new Error("Missing objectNames");
      }

      return uploadService.archive({
        objectNames: cmd.objectNames,
      });
    });