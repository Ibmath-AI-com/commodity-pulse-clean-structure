// FILE: src/application/use-cases/upload/list-uploads.use-case.ts
import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { INewsStorageService } from "@/src/application/services/news-storage.service.interface";
import type { IUploadPageService } from "@/src/application/services/upload.service.interface";

import type { ListUploadsResult } from "@/src/entities/models/upload";

type ListUploadsQuery = {
  commodity: string;
  region?: string;
};

export type IListUploadsUseCase = ReturnType<typeof listUploadsUseCase>;

export const listUploadsUseCase =
  (
    instrumentation: IInstrumentationService,
    uploadService: IUploadPageService,
    newsStorageService: INewsStorageService
  ) =>
  async (query: ListUploadsQuery): Promise<ListUploadsResult> =>
    instrumentation.startSpan({ name: "listUploadsUseCase", op: "function" }, async () => {
      if (!query?.commodity?.trim()) throw new Error("Missing commodity");

      const normalizedCommodity = query.commodity.trim().toLowerCase();
      const normalizedRegion = query.region ?? "global";

      const result = await uploadService.list({
        commodity: normalizedCommodity,
        region: normalizedRegion,
      });

      if (!result.ok) {
        return result;
      }

      const items = await Promise.all(
      result.items.map(async (item) => {
        const isDoc =
          item.kind === "doc" ||
          (item.path ?? "").toLowerCase().includes("/doc/") ||
          (item.name ?? "").toLowerCase().endsWith(".pdf");

        if (!isDoc) {
          return {
            ...item,
            newsSummary: undefined,
          };
        }

        const newsSummary = await newsStorageService.getDocumentNewsSummary({
          commodity: item.commodity,
          sourcePath: item.sourcePath ?? item.path,
          documentId: item.documentId,
          fileName: item.name,
        });

        return {
          ...item,
          newsSummary,
        };
      })
    );

      return {
        ...result,
        items,
      };
    });
