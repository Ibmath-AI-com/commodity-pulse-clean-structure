import type { IUserRepository } from "@/src/application/repositories/user.repository.interface";
import type { ISessionRepository } from "@/src/application/repositories/session.repository.interface";
import type { IPasswordHasher } from "@/src/application/services/password-hasher.service.interface";
import type { ITokenService } from "@/src/application/services/token-service.interface";
import { AuthenticationError, UserDisabledError } from "@/src/entities/errors/auth";

const SESSION_DAYS = 7;
const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

export type LoginUseCaseInput = {
  email: string;
  password: string;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type LoginUseCaseResult = {
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
  sessionToken: string;
  refreshToken: string;
  expiresAt: Date;
};

export type ILoginUseCase = (input: LoginUseCaseInput) => Promise<LoginUseCaseResult>;

export const loginUseCase =
  (
    userRepo: IUserRepository,
    sessionRepo: ISessionRepository,
    passwordHasher: IPasswordHasher,
    tokenService: ITokenService
  ): ILoginUseCase =>
  async (input) => {
    const email = input.email.trim().toLowerCase();
    const user = await userRepo.findByEmail(email);

    if (!user) throw new AuthenticationError("Invalid credentials");
    if (user.status !== "active") throw new UserDisabledError();

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AuthenticationError("Account temporarily locked");
    }

    const ok = await passwordHasher.verify(user.passwordHash, input.password);

    if (!ok) {
      const nextFailed = user.failedLoginCount + 1;
      const lockedUntil =
        nextFailed >= MAX_FAILED
          ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
          : null;

      await userRepo.incrementFailedLogin(user.id, lockedUntil);
      throw new AuthenticationError("Invalid credentials");
    }

    await userRepo.resetFailedLogin(user.id);
    await userRepo.touchLastLogin(user.id);

    const freshUser = await userRepo.findById(user.id);
    if (!freshUser) {
      throw new AuthenticationError("User no longer exists");
    }

    const sessionToken = tokenService.generateToken();
    const refreshToken = tokenService.generateToken();
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

    await sessionRepo.create({
      userId: freshUser.id,
      sessionTokenHash: tokenService.hashToken(sessionToken),
      refreshTokenHash: tokenService.hashToken(refreshToken),
      userAgent: input.userAgent ?? null,
      ipAddress: input.ipAddress ?? null,
      expiresAt,
    });

    return {
      user: userRepo.toSafeUser(freshUser),
      sessionToken,
      refreshToken,
      expiresAt,
    };
  };