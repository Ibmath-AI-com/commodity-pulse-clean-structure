import { createModule } from "@evyweb/ioctopus";
import type { Pool } from "pg";
import { DI_SYMBOLS } from "@/di/types";

import { NoopInstrumentationService } from "@/src/infrastructure/services/instrumentation.service.noop";
import { NoopCrashReporterService } from "@/src/infrastructure/services/crash-reporter.service.noop";

import { postgres } from "@/src/infrastructure/db/postgres.client";
import { PostgresUserRepository } from "@/src/infrastructure/repositories/postgres-user.repository";
import { PostgresSessionRepository } from "@/src/infrastructure/repositories/postgres-session.repository";
import { NextSessionService } from "@/src/infrastructure/services/next-session.service";
import { Argon2PasswordHasher } from "@/src/infrastructure/security/argon2-password-hasher";
import { CryptoTokenService } from "@/src/infrastructure/security/crypto-token.service";

import { loginUseCase } from "@/src/application/use-cases/auth/login.use-case";
import { logoutUseCase } from "@/src/application/use-cases/auth/logout.use-case";
import { getCurrentUserUseCase } from "@/src/application/use-cases/auth/get-current-user.use-case";

import { loginController } from "@/src/interface-adapters/controllers/auth/login.controller";
import { logoutController } from "@/src/interface-adapters/controllers/auth/logout.controller";

export function createAuthModule() {
  const m = createModule();

  m.bind(DI_SYMBOLS.IInstrumentationService).toClass(NoopInstrumentationService);
  m.bind(DI_SYMBOLS.ICrashReporterService).toClass(NoopCrashReporterService);

  m.bind(DI_SYMBOLS.IPostgresPool).toValue(postgres);

  m.bind(DI_SYMBOLS.IUserRepository).toHigherOrderFunction(
    (pool: Pool) => new PostgresUserRepository(pool),
    [DI_SYMBOLS.IPostgresPool]
  );

  m.bind(DI_SYMBOLS.ISessionRepository).toHigherOrderFunction(
    (pool: Pool) => new PostgresSessionRepository(pool),
    [DI_SYMBOLS.IPostgresPool]
  );

  m.bind(DI_SYMBOLS.ISessionService).toClass(NextSessionService);
  m.bind(DI_SYMBOLS.IPasswordHasher).toClass(Argon2PasswordHasher);
  m.bind(DI_SYMBOLS.ITokenService).toClass(CryptoTokenService);

  m.bind(DI_SYMBOLS.ILoginUseCase).toHigherOrderFunction(loginUseCase, [
    DI_SYMBOLS.IUserRepository,
    DI_SYMBOLS.ISessionRepository,
    DI_SYMBOLS.IPasswordHasher,
    DI_SYMBOLS.ITokenService,
  ]);

  m.bind(DI_SYMBOLS.ILogoutUseCase).toHigherOrderFunction(logoutUseCase, [
    DI_SYMBOLS.IInstrumentationService,
    DI_SYMBOLS.ISessionService,
    DI_SYMBOLS.ISessionRepository,
    DI_SYMBOLS.ITokenService,
  ]);

  m.bind(DI_SYMBOLS.IGetCurrentUserUseCase).toHigherOrderFunction(getCurrentUserUseCase, [
    DI_SYMBOLS.IUserRepository,
    DI_SYMBOLS.ISessionRepository,
    DI_SYMBOLS.ITokenService,
  ]);

  m.bind(DI_SYMBOLS.ILoginController).toHigherOrderFunction(loginController, [
    DI_SYMBOLS.IInstrumentationService,
    DI_SYMBOLS.ILoginUseCase,
    DI_SYMBOLS.ISessionService,
  ]);

  m.bind(DI_SYMBOLS.ILogoutController).toHigherOrderFunction(logoutController, [
    DI_SYMBOLS.IInstrumentationService,
    DI_SYMBOLS.ILogoutUseCase,
  ]);

  return m;
}