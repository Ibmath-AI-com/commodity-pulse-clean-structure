import { z } from "zod";
import { InputParseError, AuthenticationError } from "@/src/entities/errors/auth";
import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { ILoginUseCase } from "@/src/application/use-cases/auth/login.use-case";
import type { ISessionService } from "@/src/application/services/session.service.interface";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  ipAddress: z.string().optional().nullable(),
  userAgent: z.string().optional().nullable(),
});

export type LoginControllerResult = {
  user: {
    id: string;
    name: string;
    email: string;
    isAdmin: boolean;
    status: "active" | "disabled";
    mustChangePassword: boolean;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  };
};

export type ILoginController = (input: unknown) => Promise<LoginControllerResult>;

function errorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  if (typeof err === "number") return String(err);

  if (typeof err === "object" && err !== null) {
    const maybeMsg = (err as { message?: unknown }).message;
    if (typeof maybeMsg === "string" && maybeMsg.trim()) return maybeMsg;

    const maybeCode = (err as { code?: unknown }).code;
    if (typeof maybeCode === "string" && maybeCode.trim()) return maybeCode;
  }

  return "Login failed.";
}

export const loginController =
  (
    instrumentation: IInstrumentationService,
    login: ILoginUseCase,
    sessionService: ISessionService
  ): ILoginController =>
  async (input) =>
    instrumentation.startSpan({ name: "loginController", op: "function" }, async () => {
      console.log("LOGIN CONTROLLER START");

      const parsed = schema.safeParse(input);
      if (!parsed.success) {
        console.log("LOGIN CONTROLLER PARSE FAILED");
        throw new InputParseError("Invalid login payload", { cause: parsed.error });
      }

      console.log("LOGIN CONTROLLER PARSE OK", { email: parsed.data.email });

      try {
        console.log("BEFORE LOGIN USE CASE");
        const result = await login(parsed.data);
        console.log("AFTER LOGIN USE CASE");

        console.log("BEFORE CREATE SESSION COOKIE");
        await sessionService.createSessionCookie({
          sessionToken: result.sessionToken,
          refreshToken: result.refreshToken,
          expiresAt: result.expiresAt,
        });
        console.log("AFTER CREATE SESSION COOKIE");

        return {
          user: result.user,
        };
      } catch (err: unknown) {
        console.log("LOGIN CONTROLLER ERROR", err);
        throw new AuthenticationError(errorMessage(err), { cause: err });
      }
    });