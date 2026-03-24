// FILE: src/application/use-cases/upload/init-upload.use-case.ts
import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { IUploadPageService } from "@/src/application/services/upload.service.interface";

import type { InitUploadResult } from "@/src/entities/models/upload";

type InitUploadCommand = {
  commodity: string;
  region?: string;
  filename: string;
  contentType: string;
};

export type IInitUploadUseCase = ReturnType<typeof initUploadUseCase>;

export const initUploadUseCase =
  (instrumentation: IInstrumentationService, uploadService: IUploadPageService) =>
  async (cmd: InitUploadCommand): Promise<InitUploadResult> =>
    instrumentation.startSpan({ name: "initUploadUseCase", op: "function" }, async () => {
      if (!cmd?.commodity?.trim()) throw new Error("Missing commodity");
      if (!cmd?.filename?.trim()) throw new Error("Missing filename");
      if (!cmd?.contentType?.trim()) throw new Error("Missing contentType");

      return uploadService.init({
        commodity: cmd.commodity.trim().toLowerCase(),
        region: cmd.region ?? "global",
        filename: cmd.filename.trim(),
        contentType: cmd.contentType.trim(),
      });
    });