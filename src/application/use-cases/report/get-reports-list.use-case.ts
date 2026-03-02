// FILE: src/application/use-cases/report/get-reports-list.use-case.ts

import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { IReportsRepository } from "@/src/application/repositories/reports.repository.interface";
import type { ReportBase } from "@/src/entities/models/report-base";

export type IGetReportsListUseCase = ReturnType<typeof getReportsListUseCase>;

export const getReportsListUseCase =
    (
        instrumentation: IInstrumentationService,
        reportsRepository: IReportsRepository
    ) =>
        async (): Promise<ReportBase[]> =>
            instrumentation.startSpan(
                { name: "getReportsListUseCase", op: "function" },
                async () => {
                    return reportsRepository.listReports();
                }
            );
