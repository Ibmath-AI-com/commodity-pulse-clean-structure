// FILE: src/interface-adapters/controllers/upload/init-upload.controller.ts
import "server-only";
import { cookies } from "next/headers";

import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { ISessionService } from "@/src/application/services/session.service.interface";
import type { IInitUploadUseCase } from "@/src/application/use-cases/upload/init-upload.use-case";

import { UnauthenticatedError } from "@/src/entities/errors/auth";
import { InitUploadResult }  from "@/src/entities/models/upload";


type ControllerInput = {
  commodity: string;
  region?: string;
  filename: string;
  contentType: string;
};

export type IInitUploadController = ReturnType<typeof initUploadController>;

export const initUploadController =
  (
    instrumentation: IInstrumentationService,
    sessionService: ISessionService,
    initUpload: IInitUploadUseCase
  ) =>
  async (input: ControllerInput): Promise<InitUploadResult> =>
    instrumentation.startSpan({ name: "initUploadController", op: "http" }, async () => {
      
      const cookieStore = await cookies();
      const sessionToken = await sessionService.getSessionToken(cookieStore);

      if (!sessionToken) {
        throw new UnauthenticatedError("Must be logged in");
      }

      if (!input?.commodity?.trim()) throw new Error("Missing commodity");
      if (!input?.filename?.trim()) throw new Error("Missing filename");
      if (!input?.contentType?.trim()) throw new Error("Missing contentType");

      return initUpload({
        commodity: input.commodity.trim().toLowerCase(),
        region: input.region ?? "global",
        filename: input.filename.trim(),
        contentType: input.contentType.trim(),
      });
    });