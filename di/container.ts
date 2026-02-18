// di/container.ts
import { createContainer } from "@evyweb/ioctopus";
import { DI_RETURN_TYPES, DI_SYMBOLS } from "@/di/types";

import { createMonitoringModule } from "@/di/modules/monitoring.module";
import { createDashboardModule } from "@/di/modules/dashboard.module";
import { createAuthModule } from "@/di/modules/auth.module";
import { createPredictionModule } from "@/di/modules/prediction.module";

const ApplicationContainer = createContainer();

ApplicationContainer.load(Symbol("MonitoringModule"), createMonitoringModule());
ApplicationContainer.load(Symbol("AuthModule"), createAuthModule());
ApplicationContainer.load(Symbol("DashboardModule"), createDashboardModule());
ApplicationContainer.load(Symbol("PredictionModule"), createPredictionModule());

export function getInjection<K extends keyof typeof DI_SYMBOLS>(
  symbol: K
): DI_RETURN_TYPES[K] {
  return ApplicationContainer.get(DI_SYMBOLS[symbol]) as DI_RETURN_TYPES[K];
}
