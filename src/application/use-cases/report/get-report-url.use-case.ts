// FILE: src/application/use-cases/report/get-report-url.use-case.ts

import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { IReportStorageService } from "@/src/application/services/report-storage.service.interface";

export type IGetReportUrlUseCase = ReturnType<typeof getReportUrlUseCase>;

export const getReportUrlUseCase =
    (
        instrumentation: IInstrumentationService,
        storageService: IReportStorageService
    ) =>
        async (objectName: string): Promise<string> =>
            instrumentation.startSpan(
                { name: "getReportUrlUseCase", op: "function" },
                async () => {
                    if (!objectName?.trim()) {
                        throw new Error("Missing objectName");
                    }
                    return storageService.getSignedUrl(objectName);
                }
            );
