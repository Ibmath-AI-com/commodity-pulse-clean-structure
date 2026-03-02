import { createModule } from "@evyweb/ioctopus";
import { DI_SYMBOLS } from "@/di/types";

// Infrastructure
import { FirebaseReportsRepository } from "@/src/infrastructure/repositories/reports.repository.firebase";
import { GcsReportStorageService } from "@/src/infrastructure/services/report-storage.service.gcs";

// Use Cases
import { getReportsListUseCase } from "@/src/application/use-cases/report/get-reports-list.use-case";
import { getReportUrlUseCase } from "@/src/application/use-cases/report/get-report-url.use-case";
import { readReportUseCase } from "@/src/application/use-cases/report/read-report.use-case";

// Interface Adapters (Controller)
import { reportsController } from "@/src/interface-adapters/controllers/report/reports.controller";

export function createReportModule() {
    const reportModule = createModule();

    // Infrastructure
    reportModule
        .bind(DI_SYMBOLS.IReportsRepository)
        .toClass(FirebaseReportsRepository);
    reportModule
        .bind(DI_SYMBOLS.IReportStorageService)
        .toClass(GcsReportStorageService);

    // Use Cases
    reportModule
        .bind(DI_SYMBOLS.IGetReportsListUseCase)
        .toHigherOrderFunction(getReportsListUseCase, [
            DI_SYMBOLS.IInstrumentationService,
            DI_SYMBOLS.IReportsRepository,
        ]);
    reportModule
        .bind(DI_SYMBOLS.IGetReportUrlUseCase)
        .toHigherOrderFunction(getReportUrlUseCase, [
            DI_SYMBOLS.IInstrumentationService,
            DI_SYMBOLS.IReportStorageService,
        ]);
    reportModule
        .bind(DI_SYMBOLS.IReadReportUseCase)
        .toHigherOrderFunction(readReportUseCase, [
            DI_SYMBOLS.IInstrumentationService,
            DI_SYMBOLS.IReportStorageService,
        ]);

    // Controller
    reportModule
        .bind(DI_SYMBOLS.IReportsController)
        .toHigherOrderFunction(reportsController, [
            DI_SYMBOLS.IInstrumentationService,
            DI_SYMBOLS.ISessionService,
            DI_SYMBOLS.IGetReportsListUseCase,
            DI_SYMBOLS.IGetReportUrlUseCase,
            DI_SYMBOLS.IReadReportUseCase,
        ]);

    return reportModule;
}
