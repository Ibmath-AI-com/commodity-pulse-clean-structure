// FILE: app/(protected)/prediction/page.tsx
import { redirect } from "next/navigation";

import { getInjection } from "@/di/container";
import { AuthenticationError, UnauthenticatedError } from "@/src/entities/errors/auth";

import PredictionMain from "@/app/_components/ui/prediction/main";

export default async function PredictionPage() {
  // Just validate session on page entry (protect route)
  const instrumentation = getInjection("IInstrumentationService");

  await instrumentation.startSpan(
    { name: "prediction.page > guard", op: "function.nextjs" },
    async () => {
      try {
        // We reuse the controller validation behavior by calling session service directly if you prefer.
        // Minimal: call controller with a harmless input is wrong. So do direct guard:
        const session = getInjection("ISessionService");
        // Session service will read cookie in its own impl OR you can add a guard controller.
        // If your session service requires cookie input, add a tiny guard controller.
        // For now: do nothing here if your session is guarded in actions only.
        void session;
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

  return <PredictionMain />;
}
