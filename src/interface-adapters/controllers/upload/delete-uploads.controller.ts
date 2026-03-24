// FILE: src/interface-adapters/controllers/upload/delete-uploads.controller.ts
import "server-only";
import { cookies } from "next/headers";
import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { ISessionService } from "@/src/application/services/session.service.interface";
import type { IDeleteUploadsUseCase } from "@/src/application/use-cases/upload/delete-uploads.use-case";
import type { IGetCurrentUserUseCase } from "@/src/application/use-cases/auth/get-current-user.use-case";

import { DeleteUploadsResult } from "@/src/entities/models/upload";
import { UnauthenticatedError } from "@/src/entities/errors/auth";

type ControllerInput = {
  objectNames: string[];
};

export type IDeleteUploadsController = ReturnType<typeof deleteUploadsController>;

export const deleteUploadsController =
  (
    instrumentation: IInstrumentationService,
    sessionService: ISessionService,
    getCurrentUser: IGetCurrentUserUseCase,
    deleteUploads: IDeleteUploadsUseCase
  ) =>
  async (input: ControllerInput): Promise<DeleteUploadsResult> =>
    instrumentation.startSpan({ name: "deleteUploadsController", op: "http" }, async () => {
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

      return deleteUploads({
        objectNames,
      });
    });