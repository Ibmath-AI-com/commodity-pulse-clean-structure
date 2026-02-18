// E:\AI Projects\commodity-clean-structure\src\interface-adapters\controllers\auth\login.controller.ts
import { z } from "zod";
import { InputParseError, AuthenticationError } from "@/src/entities/errors/auth";
import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { ILoginUseCase } from "@/src/application/use-cases/auth/login.use-case";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export type ILoginController = (input: unknown) => Promise<{ uid: string }>;

export const loginController =
  (instrumentation: IInstrumentationService, login: ILoginUseCase): ILoginController =>
  async (input) =>
    instrumentation.startSpan({ name: "loginController", op: "function" }, async () => {
      const parsed = schema.safeParse(input);
      if (!parsed.success) throw new InputParseError("Invalid login payload", { cause: parsed.error });

      try {
        return await login(parsed.data);
      } catch (err: any) {
        throw new AuthenticationError(err?.message || err?.code || "Login failed.", { cause: err });
      }
    });
