import "server-only";
import { cookies } from "next/headers";

import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { ISessionService } from "@/src/application/services/session.service.interface";

import type { IGetReportsListUseCase } from "@/src/application/use-cases/report/get-reports-list.use-case";
import type { IGetReportUrlUseCase } from "@/src/application/use-cases/report/get-report-url.use-case";
import type { IReadReportUseCase } from "@/src/application/use-cases/report/read-report.use-case";

import { UnauthenticatedError } from "@/src/entities/errors/auth";

export type IReportsController = ReturnType<typeof reportsController>;

export const reportsController = (
    instrumentation: IInstrumentationService,
    sessionService: ISessionService,
    getReportsList: IGetReportsListUseCase,
    getReportUrl: IGetReportUrlUseCase,
    readReport: IReadReportUseCase
) => ({
    listReports: async () =>
        instrumentation.startSpan(
            { name: "ReportsController.listReports", op: "http" },
            async () => {
                const cookieStore = await cookies();
                const sessionCookie = cookieStore.get("session")?.value;

                if (!sessionCookie) throw new UnauthenticatedError("Must be logged in");
                await sessionService.validateSessionCookie({ sessionCookie });

                return getReportsList();
            }
        ),

    getReportUrl: async (objectName: string) =>
        instrumentation.startSpan(
            { name: "ReportsController.getReportUrl", op: "http" },
            async () => {
                const cookieStore = await cookies();
                const sessionCookie = cookieStore.get("session")?.value;

                if (!sessionCookie) throw new UnauthenticatedError("Must be logged in");
                await sessionService.validateSessionCookie({ sessionCookie });

                return getReportUrl(objectName);
            }
        ),

    readReport: async (objectName: string) =>
        instrumentation.startSpan(
            { name: "ReportsController.readReport", op: "http" },
            async () => {
                const cookieStore = await cookies();
                const sessionCookie = cookieStore.get("session")?.value;

                if (!sessionCookie) throw new UnauthenticatedError("Must be logged in");
                await sessionService.validateSessionCookie({ sessionCookie });

                return readReport(objectName);
            }
        ),
});
