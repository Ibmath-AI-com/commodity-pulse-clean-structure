"use server";

import { redirect } from "next/navigation";
import { AuthenticationError, UnauthenticatedError } from "@/src/entities/errors/auth";

export type ReportSourceFile = {
  bucket: "active" | "archive";
  objectName: string;
  name: string;
  updated?: string;
  size?: string | number;
  contentType?: string;
};

export type ListReportFilesResult =
  | {
      ok: true;
      commodity: string;
      active: ReportSourceFile[];
      archived: ReportSourceFile[];
    }
  | { ok: false; error: string };

export type ReportSourceReadUrlResult = {
  url: string;
  bucketName: string;
  objectName: string;
  expiresMinutes: number;
};

export async function listReportFilesAction(input: { commodity: string }): Promise<ListReportFilesResult> {
  const { getInjection } = await import("@/di/container");
  const instrumentation = getInjection("IInstrumentationService");

  return instrumentation.startSpan(
    { name: "report.actions > listReportFilesAction", op: "function.nextjs" },
    async () => {
      try {
        const storage = getInjection("IObjectStorageService");
        const commodity = String(input.commodity ?? "").trim().toLowerCase();

        const activePrefix = `incoming/${commodity}/doc/`;
        const archivePrefix = `archive/${commodity}/doc/`;

        const [activeList, archiveList] = await Promise.all([
          storage.listObjects("active", { prefix: activePrefix, endsWith: ".pdf", maxResults: 200 }, { timeoutMs: 15000 }),
          storage.listObjects("archive", { prefix: archivePrefix, endsWith: ".pdf", maxResults: 200 }, { timeoutMs: 15000 }),
        ]);

        const mapRow = (bucket: "active" | "archive") => (it: { name: string; updated?: string; size?: string | number; contentType?: string }) => ({
          bucket,
          objectName: it.name,
          name: it.name.split("/").filter(Boolean).pop() ?? it.name,
          updated: it.updated,
          size: it.size,
          contentType: it.contentType,
        });

        return {
          ok: true,
          commodity,
          active: (activeList.items ?? []).filter((it) => Boolean(it.name)).map(mapRow("active")),
          archived: (archiveList.items ?? []).filter((it) => Boolean(it.name)).map(mapRow("archive")),
        } satisfies ListReportFilesResult;
      } catch (err) {
        if (err instanceof UnauthenticatedError || err instanceof AuthenticationError) {
          redirect("/login");
        }
        const crash = getInjection("ICrashReporterService");
        crash.report(err);
        throw err;
      }
    }
  );
}

export async function createReportSourceReadUrlAction(
  input: { bucket: "active" | "archive"; objectName: string }
): Promise<ReportSourceReadUrlResult> {
  const { getInjection } = await import("@/di/container");
  const instrumentation = getInjection("IInstrumentationService");

  return instrumentation.startSpan(
    { name: "report.actions > createReportSourceReadUrlAction", op: "function.nextjs" },
    async () => {
      try {
        const storage = getInjection("IObjectStorageService");
        return await storage.createSignedReadUrl(
          input.bucket,
          { objectName: input.objectName, expiresMinutes: 15 },
          { timeoutMs: 15000 }
        );
      } catch (err) {
        if (err instanceof UnauthenticatedError || err instanceof AuthenticationError) {
          redirect("/login");
        }
        const crash = getInjection("ICrashReporterService");
        crash.report(err);
        throw err;
      }
    }
  );
}
