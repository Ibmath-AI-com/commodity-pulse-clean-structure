import "server-only";
import { cookies } from "next/headers";

import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { ISessionService } from "@/src/application/services/session.service.interface";
import type { IGetUploadListUseCase } from "@/src/application/use-cases/prediction/get-upload-list.use-case";

import { UnauthenticatedError } from "@/src/entities/errors/auth";
import type { UploadListResult } from "@/src/application/services/upload-list.service.interface";

type ControllerInput = {
  commodity: string;
  region?: string;
};

export type IGetUploadListController = ReturnType<
  typeof getUploadListController
>;

export const getUploadListController =
  (
    instrumentation: IInstrumentationService,
    sessionService: ISessionService,
    getUploadList: IGetUploadListUseCase
  ) =>
  async (input: ControllerInput): Promise<UploadListResult> =>
    instrumentation.startSpan(
      { name: "getUploadList Controller", op: "http" },
      async () => {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("session")?.value;

        if (!sessionCookie) {
          throw new UnauthenticatedError("Must be logged in");
        }

        await sessionService.validateSessionCookie({ sessionCookie });

        if (!input.commodity) {
          throw new Error("Missing commodity");
        }

        return getUploadList({
          commodity: input.commodity.trim().toLowerCase(),
          region: input.region ?? "global",
        });
      }
    );
