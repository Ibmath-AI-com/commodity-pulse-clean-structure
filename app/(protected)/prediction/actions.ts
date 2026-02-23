// FILE: app/(protected)/prediction/actions.ts
"use server";

import { redirect } from "next/navigation";
import { AuthenticationError, UnauthenticatedError } from "@/src/entities/errors/auth";

export async function runPredictionAction(input: {
  commodity: string;
  futureDate: string;
  basisKeys: string[];
  basisLabels: string[];
  basePrices: number[];
  region?: string;
}) {
  const { getInjection } = await import("@/di/container");

  const instrumentation = getInjection("IInstrumentationService");

  return instrumentation.startSpan(
    { name: "prediction.actions > runPredictionAction", op: "function.nextjs" },
    async () => {
      try {
        const controller = getInjection("IExecutePredictionController");
        return await controller({
          commodity: input.commodity,
          futureDate: input.futureDate,
          basisKeys: input.basisKeys,
          basisLabels: input.basisLabels,
          basePrices: input.basePrices,
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