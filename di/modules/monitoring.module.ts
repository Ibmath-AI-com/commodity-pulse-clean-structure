// di/modules/monitoring.module.ts
import { createModule } from "@evyweb/ioctopus";

import { NoopInstrumentationService } from "@/src/infrastructure/services/instrumentation.service.noop";
import { NoopCrashReporterService } from "@/src/infrastructure/services/crash-reporter.service.noop";

import { DI_SYMBOLS } from "@/di/types";

export function createMonitoringModule() {
  const monitoringModule = createModule();

  // Keep the same test/non-test branching for compatibility with the template.
  // Right now both can be noop; replace the non-test ones when you add real tooling.
  if (process.env.NODE_ENV === "test") {
    monitoringModule
      .bind(DI_SYMBOLS.IInstrumentationService)
      .toClass(NoopInstrumentationService);

    monitoringModule
      .bind(DI_SYMBOLS.ICrashReporterService)
      .toClass(NoopCrashReporterService);
  } else {
    monitoringModule
      .bind(DI_SYMBOLS.IInstrumentationService)
      .toClass(NoopInstrumentationService);

    monitoringModule
      .bind(DI_SYMBOLS.ICrashReporterService)
      .toClass(NoopCrashReporterService);
  }

  return monitoringModule;
}
