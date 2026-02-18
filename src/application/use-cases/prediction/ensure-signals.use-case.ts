// FILE: src/application/use-cases/prediction/ensure-signals.use-case.ts

import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { IGetUploadListUseCase } from "@/src/application/use-cases/prediction/get-upload-list.use-case";
import type { IGenerateReportUseCase } from "@/src/application/use-cases/prediction/generate-report.use-case";
import type { UploadListItem } from "@/src/entities/models/prediction";
import { InputParseError } from "@/src/entities/errors/common";

export type EnsureSignalsInput = {
  commodity: string;
  region?: string; // defaulted
};

export type EnsureSignalsResult =
  | { status: "exists" }
  | { status: "triggered"; sourceObjectName: string };

export type IEnsureSignalsUseCase = ReturnType<typeof ensureSignalsUseCase>;

function pickLatestIncomingPdf(items: UploadListItem[], commodity: string): UploadListItem | null {
  const c = commodity.trim().toLowerCase();
  const prefix = `incoming/${c}/doc/`;

  const pdfs = (items ?? [])
    .filter((x) => x && typeof x.name === "string")
    .filter((x) => x.name.toLowerCase().startsWith(prefix))
    .filter((x) => x.name.toLowerCase().endsWith(".pdf"))
    .filter((x) => x.isActive !== false);

  if (!pdfs.length) return null;

  pdfs.sort((a, b) => {
    const ta = new Date(String(a.updated ?? 0)).getTime() || 0;
    const tb = new Date(String(b.updated ?? 0)).getTime() || 0;
    return tb - ta;
  });

  return pdfs[0];
}

export const ensureSignalsUseCase =
  (instrumentation: IInstrumentationService, getUploadList: IGetUploadListUseCase, generateReport: IGenerateReportUseCase) =>
  async (input: EnsureSignalsInput): Promise<EnsureSignalsResult> =>
    instrumentation.startSpan({ name: "ensureSignalsUseCase", op: "function" }, async () => {
      const commodity = input?.commodity?.trim().toLowerCase();
      if (!commodity) throw new InputParseError("Missing commodity");

      const region = input?.region?.trim() ? input.region.trim().toLowerCase() : "global";

      const { items, eventSignalsExists } = await getUploadList({ commodity, region });

      if (eventSignalsExists) return { status: "exists" };

      const latestPdf = pickLatestIncomingPdf(items, commodity);
      if (!latestPdf?.name) {
        throw new InputParseError(`No report found in incoming/${commodity}/doc/. Upload a PDF first.`);
      }

      // Recommended: pass region through if your report generation is region-aware
      await generateReport({ commodity, /* region, */ sourceObjectName: latestPdf.name });

      return { status: "triggered", sourceObjectName: latestPdf.name };
    });
