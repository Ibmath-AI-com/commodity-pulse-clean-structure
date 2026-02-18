import { createModule } from "@evyweb/ioctopus";
import { DI_SYMBOLS } from "@/di/types";

import { FirestorePredictionsDashboardRepository } from "@/src/infrastructure/repositories/predictions-dashboard.repository.firestore";

import { getDashboardHistoryUseCase } from "@/src/application/use-cases/dashboard/get-dashboard-history.use-case";
import { getDashboardKpisUseCase } from "@/src/application/use-cases/dashboard/get-dashboard-kpis.use-case";
import { getDashboardInsightsUseCase } from "@/src/application/use-cases/dashboard/get-dashboard-insights.use-case";

import { getDashboardController } from "@/src/interface-adapters/controllers/dashboard/get-dashboard.controller";

export function createDashboardModule() {
  const m = createModule();

  m.bind(DI_SYMBOLS.IPredictionsDashboardRepository).toClass(
    FirestorePredictionsDashboardRepository
  );

  m.bind(DI_SYMBOLS.IGetDashboardHistoryUseCase).toHigherOrderFunction(
    getDashboardHistoryUseCase,
    [DI_SYMBOLS.IInstrumentationService, DI_SYMBOLS.IPredictionsDashboardRepository]
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
      DI_SYMBOLS.IGetDashboardHistoryUseCase,
      DI_SYMBOLS.IGetDashboardKpisUseCase,
      DI_SYMBOLS.IGetDashboardInsightsUseCase,
    ]
  );

  return m;
}
