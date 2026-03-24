"use server";

import { redirect } from "next/navigation";
import { AuthenticationError, UnauthenticatedError } from "@/src/entities/errors/auth";

export async function readReportAction(input: { objectName: string }) {
  const { getInjection } = await import("@/di/container");
  const instrumentation = getInjection("IInstrumentationService");

  return instrumentation.startSpan(
    { name: "report.actions > readReportAction", op: "function.nextjs" },
    async () => {
      try {
        const controller = getInjection("IReadReportController");
        return await controller({
          objectName: input.objectName,
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