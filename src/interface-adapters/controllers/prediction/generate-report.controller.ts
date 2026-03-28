import "server-only";
import { cookies } from "next/headers";

import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { ISessionService } from "@/src/application/services/session.service.interface";
import type { IGenerateReportUseCase } from "@/src/application/use-cases/prediction/generate-report.use-case";

import { UnauthenticatedError } from "@/src/entities/errors/auth";

type ControllerInput = {
  commodity: string;
  sourceObjectName: string;
};

export type IGenerateReportController = ReturnType<
  typeof generateReportController
>;

export const generateReportController =
  (
    instrumentation: IInstrumentationService,
    sessionService: ISessionService,
    generateReport: IGenerateReportUseCase
  ) =>
  async (input: ControllerInput): Promise<{ ok: true }> =>
    instrumentation.startSpan(
      { name: "generateReport Controller", op: "http" },
      async () => {
        const cookieStore = await cookies();
        const sessionToken = await sessionService.getSessionToken(cookieStore);

        if (!sessionToken) {
          throw new UnauthenticatedError("Must be logged in");
        }

        if (!input.commodity) {
          throw new Error("Missing commodity");
        }

        if (!input.sourceObjectName) {
          throw new Error("Missing sourceObjectName");
        }

        await generateReport({
          commodity: input.commodity.trim().toLowerCase(),
          sourceObjectName: input.sourceObjectName,
        });

        return { ok: true };
      }
    );
