// E:\AI Projects\commodity-clean-structure\src\application\use-cases\auth\login.use-case.ts
import type { IInstrumentationService } from "@/src/application/services/instrumentation.service.interface";
import type { IAuthServerService } from "@/src/application/services/auth-server.service.interface";
import type { IUserProfilesRepository } from "@/src/application/repositories/user-profiles.repository.interface";
import type { ISessionService } from "@/src/application/services/session.service.interface";
import { AuthenticationError } from "@/src/entities/errors/auth";

export type LoginInput = { email: string; password: string };
export type ILoginUseCase = (input: LoginInput) => Promise<{ uid: string }>;

export const loginUseCase =
  (
    instrumentation: IInstrumentationService,
    authClient: IAuthServerService,
    usersRepo: IUserProfilesRepository,
    sessionService: ISessionService
  ): ILoginUseCase =>
  async (input) =>
    instrumentation.startSpan({ name: "loginUseCase", op: "function" }, async () => {
      const cred = await authClient.authenticate(input);
      if (!cred?.uid) throw new AuthenticationError("Authentication failed");

      const email = cred.email ?? input.email;

      // best effort
      usersRepo.upsertUserProfile({ uid: cred.uid, email }).catch(() => {});

      const idToken = await cred.getIdToken();
      await sessionService.createSessionCookie({ idToken });

      return { uid: cred.uid };
    });
