//E:\AI Projects\commodity-clean-structure\di\modules\auth.module.ts
import { createModule } from "@evyweb/ioctopus";
import { DI_SYMBOLS } from "@/di/types";

import { FirebaseAuthServerService } from "@/src/infrastructure/services/firebase-auth.server.service"
import { FirestoreUserProfilesRepository } from "@/src/infrastructure/repositories/user-profiles.repository.firestore";
import { SessionApiService } from "@/src/infrastructure/services/session-api.service";
import { NoopInstrumentationService } from "@/src/infrastructure/services/instrumentation.service.noop";
import { NoopCrashReporterService } from "@/src/infrastructure/services/crash-reporter.service.noop";

import { loginUseCase } from "@/src/application/use-cases/auth/login.use-case";
import { logoutUseCase } from "@/src/application/use-cases/auth/logout.use-case";
import { loginController } from "@/src/interface-adapters/controllers/auth/login.controller";
import { logoutController } from "@/src/interface-adapters/controllers/auth/logout.controller";

export function createAuthModule() {
  const m = createModule();

  m.bind(DI_SYMBOLS.IAuthServerService).toClass(FirebaseAuthServerService);
  m.bind(DI_SYMBOLS.IUserProfilesRepository).toClass(FirestoreUserProfilesRepository);
  m.bind(DI_SYMBOLS.ISessionService).toClass(SessionApiService);

  m.bind(DI_SYMBOLS.IInstrumentationService).toClass(NoopInstrumentationService);
  m.bind(DI_SYMBOLS.ICrashReporterService).toClass(NoopCrashReporterService);

  m.bind(DI_SYMBOLS.ILoginUseCase).toHigherOrderFunction(loginUseCase, [
    DI_SYMBOLS.IInstrumentationService,
    DI_SYMBOLS.IAuthServerService,
    DI_SYMBOLS.IUserProfilesRepository,
    DI_SYMBOLS.ISessionService,
  ]);

  m.bind(DI_SYMBOLS.ILogoutUseCase).toHigherOrderFunction(logoutUseCase, [
    DI_SYMBOLS.IInstrumentationService,
    DI_SYMBOLS.IAuthServerService,
    DI_SYMBOLS.ISessionService,
  ]);

  m.bind(DI_SYMBOLS.ILoginController).toHigherOrderFunction(loginController, [
    DI_SYMBOLS.IInstrumentationService,
    DI_SYMBOLS.ILoginUseCase,
  ]);

  m.bind(DI_SYMBOLS.ILogoutController).toHigherOrderFunction(logoutController, [
    DI_SYMBOLS.IInstrumentationService,
    DI_SYMBOLS.ILogoutUseCase,
  ]);

  return m;
}
