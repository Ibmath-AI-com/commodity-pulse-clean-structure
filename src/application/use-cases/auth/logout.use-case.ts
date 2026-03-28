import { cookies } from "next/headers";
import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { ISessionService } from "@/src/application/services/session.service.interface";
import type { ISessionRepository } from "@/src/application/repositories/session.repository.interface";
import type { ITokenService } from "@/src/application/services/token-service.interface";

export type ILogoutUseCase = () => Promise<void>;

export const logoutUseCase =
  (
    instrumentation: IInstrumentationService,
    sessionService: ISessionService,
    sessionRepo: ISessionRepository,
    tokenService: ITokenService
  ): ILogoutUseCase =>
  async () =>
    instrumentation.startSpan({ name: "logoutUseCase", op: "function" }, async () => {
      try {
        const cookieStore = await cookies();
        const sessionToken = await sessionService.getSessionToken(cookieStore);

        if (sessionToken) {
          const sessionTokenHash = tokenService.hashToken(sessionToken);
          await sessionRepo.revokeBySessionTokenHash(sessionTokenHash, "logout");
        }
      } finally {
        await sessionService.clearSessionCookie();
      }
    });