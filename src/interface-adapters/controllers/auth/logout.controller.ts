import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { ILogoutUseCase } from "@/src/application/use-cases/auth/logout.use-case";

export type ILogoutController = () => Promise<void>;

export const logoutController =
  (instrumentation: IInstrumentationService, logout: ILogoutUseCase): ILogoutController =>
  async () =>
    instrumentation.startSpan({ name: "logoutController", op: "function" }, async () => {
      await logout();
    });
