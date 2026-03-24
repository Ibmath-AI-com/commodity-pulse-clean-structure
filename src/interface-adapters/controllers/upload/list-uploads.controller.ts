// FILE: src/interface-adapters/controllers/upload/list-uploads.controller.ts
import "server-only";
import { cookies } from "next/headers";

import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { ISessionService } from "@/src/application/services/session.service.interface";
import type { IListUploadsUseCase } from "@/src/application/use-cases/upload/list-uploads.use-case";

import { UnauthenticatedError } from "@/src/entities/errors/auth";
import { ListUploadsResult }  from "@/src/entities/models/upload";

type ControllerInput = {
  commodity: string;
  region?: string;
};

export type IListUploadsController = ReturnType<typeof listUploadsController>;

export const listUploadsController =
  (
    instrumentation: IInstrumentationService,
    sessionService: ISessionService,
    listUploads: IListUploadsUseCase
  ) =>
  async (input: ControllerInput): Promise<ListUploadsResult> =>
    instrumentation.startSpan({ name: "listUploadsController", op: "http" }, async () => {
      
      const cookieStore = await cookies();
      const sessionToken = await sessionService.getSessionToken(cookieStore);

      if (!sessionToken) {
        throw new UnauthenticatedError("Must be logged in");
      }


      if (!input?.commodity?.trim()) {
        throw new Error("Missing commodity");
      }

      return listUploads({
        commodity: input.commodity.trim().toLowerCase(),
        region: input.region ?? "global",
      });
    });