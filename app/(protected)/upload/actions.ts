// FILE: app/(protected)/upload/actions.ts
"use server";

import { redirect } from "next/navigation";
import { AuthenticationError, UnauthenticatedError } from "@/src/entities/errors/auth";

export async function listUploadsAction(input: { commodity: string; region?: string }) {
  const { getInjection } = await import("@/di/container");

  const instrumentation = getInjection("IInstrumentationService");

  return instrumentation.startSpan(
    { name: "upload.actions > listUploadsAction", op: "function.nextjs" },
    async () => {
      try {
        const controller = getInjection("IListUploadsController");
        return await controller({
          commodity: input.commodity,
          region: input.region ?? "global",
        });
      } catch (err) {
        if (err instanceof UnauthenticatedError || err instanceof AuthenticationError) {
          redirect("/sign-in");
        }
        const crash = getInjection("ICrashReporterService");
        crash.report(err);
        throw err;
      }
    }
  );
}

export async function initUploadAction(input: {
  commodity: string;
  region?: string;
  filename: string;
  contentType: string;
}) {
  const { getInjection } = await import("@/di/container");

  const instrumentation = getInjection("IInstrumentationService");

  return instrumentation.startSpan(
    { name: "upload.actions > initUploadAction", op: "function.nextjs" },
    async () => {
      try {
        const controller = getInjection("IInitUploadController");
        return await controller({
          commodity: input.commodity,
          region: input.region ?? "global",
          filename: input.filename,
          contentType: input.contentType,
        });
      } catch (err) {
        if (err instanceof UnauthenticatedError || err instanceof AuthenticationError) {
          redirect("/sign-in");
        }
        const crash = getInjection("ICrashReporterService");
        crash.report(err);
        throw err;
      }
    }
  );
}

export async function deleteUploadsAction(input: { objectNames: string[] }) {
  const { getInjection } = await import("@/di/container");

  const instrumentation = getInjection("IInstrumentationService");

  return instrumentation.startSpan(
    { name: "upload.actions > deleteUploadsAction", op: "function.nextjs" },
    async () => {
      try {
        const controller = getInjection("IDeleteUploadsController");
        return await controller({ objectNames: input.objectNames });
      } catch (err) {
        if (err instanceof UnauthenticatedError || err instanceof AuthenticationError) {
          redirect("/sign-in");
        }
        const crash = getInjection("ICrashReporterService");
        crash.report(err);
        throw err;
      }
    }
  );
}

export async function archiveUploadsAction(input: { objectNames: string[] }) {
  const { getInjection } = await import("@/di/container");

  const instrumentation = getInjection("IInstrumentationService");

  return instrumentation.startSpan(
    { name: "upload.actions > archiveUploadsAction", op: "function.nextjs" },
    async () => {
      try {
        const controller = getInjection("IArchiveUploadsController");
        return await controller({ objectNames: input.objectNames });
      } catch (err) {
        if (err instanceof UnauthenticatedError || err instanceof AuthenticationError) {
          redirect("/sign-in");
        }
        const crash = getInjection("ICrashReporterService");
        crash.report(err);
        throw err;
      }
    }
  );
}

export async function getUploadNewsDetailsAction(input: {
  commodity: string;
  sourcePath: string;
}) {
  const { getInjection } = await import("@/di/container");

  const instrumentation = getInjection("IInstrumentationService");

  return instrumentation.startSpan(
    { name: "upload.actions > getUploadNewsDetailsAction", op: "function.nextjs" },
    async () => {
      try {
        const controller = getInjection("IGetUploadNewsDetailsController");
        return await controller({
          commodity: input.commodity,
          sourcePath: input.sourcePath,
        });
      } catch (err) {
        if (err instanceof UnauthenticatedError || err instanceof AuthenticationError) {
          redirect("/sign-in");
        }
        const crash = getInjection("ICrashReporterService");
        crash.report(err);
        throw err;
      }
    }
  );
}