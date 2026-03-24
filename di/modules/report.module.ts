import { createModule } from "@evyweb/ioctopus";
import { DI_SYMBOLS } from "@/di/types";

import type { IObjectStorageService } from "@/src/application/services/storage.service.interface";
import { OSReportReaderService } from "@/src/infrastructure/services/report-reader.service";

import { readReportUseCase } from "@/src/application/use-cases/report/read-report.use-case";
import { readReportController } from "@/src/interface-adapters/controllers/report/read-report.controller";

export function createReportModule() {
  const m = createModule();

  m.bind(DI_SYMBOLS.IReportReaderService).toHigherOrderFunction(
    (storage: IObjectStorageService) => new OSReportReaderService(storage),
    [DI_SYMBOLS.IObjectStorageService]
  );

  m.bind(DI_SYMBOLS.IReadReportUseCase).toHigherOrderFunction(
    readReportUseCase,
    [DI_SYMBOLS.IInstrumentationService, DI_SYMBOLS.IReportReaderService]
  );

  m.bind(DI_SYMBOLS.IReadReportController).toHigherOrderFunction(
    readReportController,
    [DI_SYMBOLS.IInstrumentationService, DI_SYMBOLS.ISessionService, DI_SYMBOLS.IReadReportUseCase]
  );

  return m;
}