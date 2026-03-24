// FILE: di/modules/dashboard.module.ts

import { createModule } from "@evyweb/ioctopus";
import { DI_SYMBOLS } from "@/di/types";
import type { Pool } from "pg";

import { PostgresPredictionsDashboardRepository } from "@/src/infrastructure/repositories/predictions-dashboard.repository.postgres";

import { getDashboardHistoryUseCase } from "@/src/application/use-cases/dashboard/get-dashboard-history.use-case";
import { getDashboardKpisUseCase } from "@/src/application/use-cases/dashboard/get-dashboard-kpis.use-case";
import { getDashboardInsightsUseCase } from "@/src/application/use-cases/dashboard/get-dashboard-insights.use-case";
import { getDashboardChartUseCase } from "@/src/application/use-cases/dashboard/get-dashboard-chart.use-case";

import { getDashboardController } from "@/src/interface-adapters/controllers/dashboard/get-dashboard.controller";

export function createDashboardModule() {
  const m = createModule();

  m.bind(DI_SYMBOLS.IPredictionsDashboardRepository).toHigherOrderFunction(
    (pool: Pool) => new PostgresPredictionsDashboardRepository(pool),
    [DI_SYMBOLS.IPostgresPool]
  );

  m.bind(DI_SYMBOLS.IGetDashboardHistoryUseCase).toHigherOrderFunction(
    getDashboardHistoryUseCase,
    [
      DI_SYMBOLS.IInstrumentationService,
      DI_SYMBOLS.IPredictionsDashboardRepository,
    ]
  );

  m.bind(DI_SYMBOLS.IGetDashboardChartUseCase).toHigherOrderFunction(
    getDashboardChartUseCase,
    [
      DI_SYMBOLS.IInstrumentationService,
      DI_SYMBOLS.IPredictionsDashboardRepository,
    ]
  );

  m.bind(DI_SYMBOLS.IGetDashboardKpisUseCase).toHigherOrderFunction(
    getDashboardKpisUseCase,
    [DI_SYMBOLS.IInstrumentationService]
  );

  m.bind(DI_SYMBOLS.IGetDashboardInsightsUseCase).toHigherOrderFunction(
    getDashboardInsightsUseCase,
    [DI_SYMBOLS.IInstrumentationService]
  );

  m.bind(DI_SYMBOLS.IGetDashboardController).toHigherOrderFunction(
    getDashboardController,
    [
      DI_SYMBOLS.IInstrumentationService,
      DI_SYMBOLS.ISessionService,
      DI_SYMBOLS.IGetCurrentUserUseCase,
      DI_SYMBOLS.IGetDashboardHistoryUseCase,
      DI_SYMBOLS.IGetDashboardChartUseCase,
      DI_SYMBOLS.IGetDashboardKpisUseCase,
      DI_SYMBOLS.IGetDashboardInsightsUseCase,
    ]
  );

  return m;
}