import { cookies } from "next/headers";

import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { ISessionService } from "@/src/application/services/session.service.interface";
import type { IGetDashboardHistoryUseCase } from "@/src/application/use-cases/dashboard/get-dashboard-history.use-case";
import type { IGetDashboardKpisUseCase } from "@/src/application/use-cases/dashboard/get-dashboard-kpis.use-case";
import type { IGetDashboardInsightsUseCase } from "@/src/application/use-cases/dashboard/get-dashboard-insights.use-case";

import { UnauthenticatedError } from "@/src/entities/errors/auth";
import type {
  DashboardPrediction,
  DashboardKpis,
  Insight,
} from "@/src/entities/models/dashboard";

function presenter(
  rows: DashboardPrediction[],
  kpis: DashboardKpis,
  insights: Insight[],
  instrumentation: IInstrumentationService
) {
  return instrumentation.startSpan(
    { name: "getDashboard Presenter", op: "serialize" },
    () => ({
      rows: rows.map((r) => ({
        ...r,
        createdAt: r.createdAt ? r.createdAt.toISOString() : null,
      })),
      kpis,
      insights,
    })
  );
}

export type IGetDashboardController = ReturnType<
  typeof getDashboardController
>;

export const getDashboardController =
  (
    instrumentation: IInstrumentationService,
    sessionService: ISessionService, // ✅ correct service
    getHistoryUseCase: IGetDashboardHistoryUseCase,
    getKpisUseCase: IGetDashboardKpisUseCase,
    getInsightsUseCase: IGetDashboardInsightsUseCase
  ) =>
  async (): Promise<ReturnType<typeof presenter>> =>
    instrumentation.startSpan(
      { name: "getDashboard Controller", op: "http" },
      async () => {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("session")?.value;

        if (!sessionCookie) {
          throw new UnauthenticatedError("Must be logged in");
        }

        const { uid } = await sessionService.validateSessionCookie({
          sessionCookie,
        });

        const rows = await getHistoryUseCase({
          uid,
          limit: 100,
        });

        const kpis = await getKpisUseCase(rows);

        const insights = await getInsightsUseCase(rows, 6);

        return presenter(rows, kpis, insights, instrumentation);
      }
    );
