import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { IAuthServerService } from "@/src/application/services/auth-server.service.interface";
import type { ISessionService } from "@/src/application/services/session.service.interface";

export type ILogoutUseCase = () => Promise<void>;

export const logoutUseCase =
  (
    instrumentation: IInstrumentationService,
    authClient: IAuthServerService,
    sessionService: ISessionService
  ): ILogoutUseCase =>
  async () =>
    instrumentation.startSpan({ name: "logoutUseCase", op: "function" }, async () => {
      // clear server session first (httpOnly cookie)
      await sessionService.clearSessionCookie().catch(() => {});
      // clear firebase client session
      await authClient.logout().catch(() => {});
    });
