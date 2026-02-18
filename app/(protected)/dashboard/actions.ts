//E:\AI Projects\commodity-clean-structure\app\(protected)\dashboard\actions.ts
"use server";

import { redirect } from "next/navigation";

import { getInjection } from "@/di/container";
import { AuthenticationError, UnauthenticatedError } from "@/src/entities/errors/auth";

export async function getDashboardAction() {
  const instrumentation = getInjection("IInstrumentationService");

  return instrumentation.startSpan(
    { name: "dashboard.actions > getDashboardAction", op: "function.nextjs" },
    async () => {
      try {
        const controller = getInjection("IGetDashboardController");
        return await controller();
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

export async function refreshDashboardAction() {
  const instrumentation = getInjection("IInstrumentationService");

  return instrumentation.startSpan(
    { name: "dashboard.actions > refreshDashboardAction", op: "function.nextjs" },
    async () => {
      try {
        const controller = getInjection("IGetDashboardController");
        return await controller();
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


export async function logoutAction() {
  const instrumentation = getInjection("IInstrumentationService");

  return instrumentation.startSpan(
    { name: "dashboard.actions > logoutAction", op: "function.nextjs" },
    async () => {
      try {
        const controller = getInjection("ILogoutController");
        await controller();
      } catch (err) {
        const crash = getInjection("ICrashReporterService");
        crash.report(err);
        throw err;
      } finally {
        redirect("/sign-in");
      }
    }
  );
}
