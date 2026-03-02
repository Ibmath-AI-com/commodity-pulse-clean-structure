// FILE: src/application/use-cases/report/read-report.use-case.ts

import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { IReportStorageService } from "@/src/application/services/report-storage.service.interface";

export type IReadReportUseCase = ReturnType<typeof readReportUseCase>;

export const readReportUseCase =
    (
        instrumentation: IInstrumentationService,
        storageService: IReportStorageService
    ) =>
        async (objectName: string): Promise<{ kind: "json" | "text", json?: any, text?: string }> =>
            instrumentation.startSpan(
                { name: "readReportUseCase", op: "function" },
                async () => {
                    if (!objectName?.trim()) {
                        throw new Error("Missing objectName");
                    }
                    return storageService.readCleanReport(objectName);
                }
            );
