// FILE: app/(auth)/actions.ts
"use server";

import { redirect } from "next/navigation";

import { InputParseError } from "@/src/entities/errors/common";
import { AuthenticationError } from "@/src/entities/errors/auth";
import { getInjection } from "@/di/container";

export async function logIn(formData: FormData) {
  const instrumentationService = getInjection("IInstrumentationService");

  return instrumentationService.instrumentServerAction(
    "logIn",
    { recordResponse: true },
    async () => {
      console.log("LOGIN ACTION START");

      const email = String(formData.get("email") ?? "");
      const password = String(formData.get("password") ?? "");

      console.log("LOGIN ACTION INPUT", { email });

      try {
        console.log("BEFORE GET LOGIN CONTROLLER");
        const loginController = getInjection("ILoginController");

        console.log("BEFORE LOGIN CONTROLLER CALL");
        await loginController({ email, password });
        console.log("AFTER LOGIN CONTROLLER CALL");
      } catch (err) {
        console.log("LOGIN ACTION ERROR", err);

        if (err instanceof InputParseError || err instanceof AuthenticationError) {
          return { error: "Invalid email or password" };
        }

        const crashReporterService = getInjection("ICrashReporterService");
        crashReporterService.report(err);
        return { error: "Internal error. Please try again later." };
      }

      console.log("BEFORE REDIRECT");
      redirect("/dashboard");
    }
  );
}

export async function logOut() {
  const instrumentationService = getInjection("IInstrumentationService");

  return instrumentationService.instrumentServerAction(
    "logOut",
    { recordResponse: true },
    async () => {
      const logoutController = getInjection("ILogoutController");
      await logoutController();

      redirect("/login");
    }
  );
}