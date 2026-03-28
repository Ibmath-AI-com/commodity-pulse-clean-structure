// FILE: src/interface-adapters/controllers/upload/archive-uploads.controller.ts
import "server-only";
import { cookies } from "next/headers";
import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { ISessionService } from "@/src/application/services/session.service.interface";
import type { IArchiveUploadsUseCase } from "@/src/application/use-cases/upload/archive-uploads.use-case";
import type { IGetCurrentUserUseCase } from "@/src/application/use-cases/auth/get-current-user.use-case";

import { ArchiveUploadsResult } from "@/src/entities/models/upload";
import { UnauthenticatedError } from "@/src/entities/errors/auth";

type ControllerInput = {
  objectNames: string[];
};

export type IArchiveUploadsController = ReturnType<typeof archiveUploadsController>;

export const archiveUploadsController =
  (
    instrumentation: IInstrumentationService,
    sessionService: ISessionService,
    getCurrentUser: IGetCurrentUserUseCase,
    archiveUploads: IArchiveUploadsUseCase
  ) =>
  async (input: ControllerInput): Promise<ArchiveUploadsResult> =>
    instrumentation.startSpan({ name: "archiveUploadsController", op: "http" }, async () => {
      const cookieStore = await cookies();
      const sessionToken = await sessionService.getSessionToken(cookieStore);

      if (!sessionToken) {
        throw new UnauthenticatedError("Must be logged in");
      }

      await getCurrentUser(sessionToken);

      if (!input?.objectNames?.length) {
        throw new Error("Missing objectNames");
      }

      const objectNames = input.objectNames
        .map((x) => x?.trim())
        .filter((x): x is string => Boolean(x));

      if (!objectNames.length) {
        throw new Error("Missing objectNames");
      }

      return archiveUploads({
        objectNames,
      });
    });