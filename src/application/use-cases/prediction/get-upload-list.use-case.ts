// FILE: src/application/use-cases/prediction/get-upload-list.use-case.ts

import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type {
  IUploadListService,
  UploadListQuery,
  UploadListResult,
} from "@/src/application/services/upload-list.service.interface";

export type IGetUploadListUseCase = ReturnType<
  typeof getUploadListUseCase
>;

export const getUploadListUseCase =
  (
    instrumentation: IInstrumentationService,
    uploadService: IUploadListService
  ) =>
  async (query: UploadListQuery): Promise<UploadListResult> =>
    instrumentation.startSpan(
      { name: "getUploadListUseCase", op: "function" },
      async () => {
        if (!query?.commodity?.trim()) {
          throw new Error("Missing commodity");
        }

        return uploadService.list({
          commodity: query.commodity.trim().toLowerCase(),
          region: query.region ?? "global",
        });
      }
    );
