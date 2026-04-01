// FILE: src/interface-adapters/controllers/upload/get-upload-news-details.controller.ts

import "server-only";
import { cookies } from "next/headers";

import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { ISessionService } from "@/src/application/services/session.service.interface";
import type { IGetUploadNewsDetailsUseCase } from "@/src/application/use-cases/upload/get-upload-news-details.use-case";

import { UnauthenticatedError } from "@/src/entities/errors/auth";
import type { DocumentNewsDetails } from "@/src/entities/models/news";

type ControllerInput = {
  commodity: string;
  sourcePath?: string;
  documentId?: string;
  fileName?: string;
};

export type IGetUploadNewsDetailsController = ReturnType<
  typeof getUploadNewsDetailsController
>;

export const getUploadNewsDetailsController =
  (
    instrumentation: IInstrumentationService,
    sessionService: ISessionService,
    getUploadNewsDetails: IGetUploadNewsDetailsUseCase
  ) =>
  async (input: ControllerInput): Promise<DocumentNewsDetails> =>
    instrumentation.startSpan(
      { name: "getUploadNewsDetailsController", op: "http" },
      async () => {
        const cookieStore = await cookies();
        const sessionToken = await sessionService.getSessionToken(cookieStore);

        if (!sessionToken) {
          throw new UnauthenticatedError("Must be logged in");
        }

        if (!input?.commodity?.trim()) {
            throw new Error("Missing commodity");
        }
        
        return getUploadNewsDetails.execute(input);
      }
    );
