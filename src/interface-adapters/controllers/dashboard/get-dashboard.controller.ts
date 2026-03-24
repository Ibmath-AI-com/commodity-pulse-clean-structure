// FILE: src/interface-adapters/controllers/dashboard/get-dashboard.controller.ts

import { cookies } from "next/headers";

import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { ISessionService } from "@/src/application/services/session.service.interface";
import type { IGetCurrentUserUseCase } from "@/src/application/use-cases/auth/get-current-user.use-case";
import type { IGetDashboardHistoryUseCase } from "@/src/application/use-cases/dashboard/get-dashboard-history.use-case";
import type { IGetDashboardChartUseCase } from "@/src/application/use-cases/dashboard/get-dashboard-chart.use-case";
import type { IGetDashboardKpisUseCase } from "@/src/application/use-cases/dashboard/get-dashboard-kpis.use-case";
import type { IGetDashboardInsightsUseCase } from "@/src/application/use-cases/dashboard/get-dashboard-insights.use-case";

import { UnauthenticatedError } from "@/src/entities/errors/auth";
import type {
  DashboardChartPoint,
  DashboardPrediction,
  DashboardKpis,
  Insight,
} from "@/src/entities/models/dashboard";

function presenter(
  rows: DashboardPrediction[],
  chart: DashboardChartPoint[],
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
      chart,
      kpis,
      insights,
    })
  );
}

export type IGetDashboardController = ReturnType<typeof getDashboardController>;

export const getDashboardController =
  (
    instrumentation: IInstrumentationService,
    sessionService: ISessionService,
    getCurrentUserUseCase: IGetCurrentUserUseCase,
    getHistoryUseCase: IGetDashboardHistoryUseCase,
    getChartUseCase: IGetDashboardChartUseCase,
    getKpisUseCase: IGetDashboardKpisUseCase,
    getInsightsUseCase: IGetDashboardInsightsUseCase
  ) =>
  async (input?: { commodity?: string }): Promise<ReturnType<typeof presenter>> =>
    instrumentation.startSpan(
      { name: "getDashboard Controller", op: "http" },
      async () => {
        const cookieStore = await cookies();
        const sessionToken = await sessionService.getSessionToken(cookieStore);

        if (!sessionToken) {
          throw new UnauthenticatedError("Must be logged in");
        }

        const currentUser = await getCurrentUserUseCase(sessionToken);

        const rows = await getHistoryUseCase({
          uid: currentUser.id,
          commodity: input?.commodity,
          limit: 100,
        });

        const chart = await getChartUseCase({
          uid: currentUser.id,
          commodity: input?.commodity,
          limit: 24,
        });

        const kpis = await getKpisUseCase(rows, chart);
        const insights = await getInsightsUseCase(rows, 6);

        return presenter(rows, chart, kpis, insights, instrumentation);
      }
    );