// FILE: src/application/use-cases/upload/delete-uploads.use-case.ts
import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { IUploadPageService } from "@/src/application/services/upload.service.interface";

import type { DeleteUploadsResult } from "@/src/entities/models/upload";

type DeleteUploadsCommand = {
  objectNames: string[];
};

export type IDeleteUploadsUseCase = ReturnType<typeof deleteUploadsUseCase>;

export const deleteUploadsUseCase =
  (instrumentation: IInstrumentationService, uploadService: IUploadPageService) =>
  async (cmd: DeleteUploadsCommand): Promise<DeleteUploadsResult> =>
    instrumentation.startSpan({ name: "deleteUploadsUseCase", op: "function" }, async () => {
      if (!Array.isArray(cmd?.objectNames) || cmd.objectNames.length === 0) {
        throw new Error("Missing objectNames");
      }

      return uploadService.delete({
        objectNames: cmd.objectNames,
      });
    });