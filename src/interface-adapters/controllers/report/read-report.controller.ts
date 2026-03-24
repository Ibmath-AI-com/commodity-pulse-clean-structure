import "server-only";

import { cookies } from "next/headers";
import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { ISessionService } from "@/src/application/services/session.service.interface";
import type { IReadReportUseCase } from "@/src/application/use-cases/report/read-report.use-case";
import type { IGetCurrentUserUseCase } from "@/src/application/use-cases/auth/get-current-user.use-case";

import { UnauthenticatedError } from "@/src/entities/errors/auth";

type ControllerInput = {
  objectName: string;
};

export type IReadReportController = ReturnType<typeof readReportController>;

export const readReportController =
  (
    instrumentation: IInstrumentationService,
    sessionService: ISessionService,
    getCurrentUser: IGetCurrentUserUseCase,
    readReport: IReadReportUseCase
  ) =>
  async (input: ControllerInput): Promise<
    | { ok: true; kind: "json"; objectName: string; json: unknown }
    | { ok: true; kind: "text"; objectName: string; text: string }
    | { ok: false; error: string }
  > =>
    instrumentation.startSpan({ name: "readReportController", op: "http" }, async () => {
      const cookieStore = await cookies();
      const sessionToken = await sessionService.getSessionToken(cookieStore);

      if (!sessionToken) {
        throw new UnauthenticatedError("Must be logged in");
      }

      await getCurrentUser(sessionToken);

      if (!input?.objectName?.trim()) {
        throw new Error("Missing objectName");
      }

      return readReport({
        objectName: input.objectName.trim(),
      });
    });