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
    console.log("LOGIN USE CASE START");

    const email = input.email.trim().toLowerCase();
    console.log("LOGIN USE CASE EMAIL", { email });

    console.log("BEFORE FIND BY EMAIL");
    const user = await userRepo.findByEmail(email);
    console.log("AFTER FIND BY EMAIL", { found: !!user });

    if (!user) throw new AuthenticationError("Invalid credentials");
    if (user.status !== "active") throw new UserDisabledError();

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AuthenticationError("Account temporarily locked");
    }

    console.log("BEFORE PASSWORD VERIFY");
    const ok = await passwordHasher.verify(user.passwordHash, input.password);
    console.log("AFTER PASSWORD VERIFY", { ok });

    if (!ok) {
      const nextFailed = user.failedLoginCount + 1;
      const lockedUntil =
        nextFailed >= MAX_FAILED
          ? new Date(Date.now() + LOCK_MINUTES * 60 * 1000)
          : null;

      console.log("BEFORE INCREMENT FAILED LOGIN");
      await userRepo.incrementFailedLogin(user.id, lockedUntil);
      console.log("AFTER INCREMENT FAILED LOGIN");

      throw new AuthenticationError("Invalid credentials");
    }

    console.log("BEFORE RESET FAILED LOGIN");
    await userRepo.resetFailedLogin(user.id);
    console.log("AFTER RESET FAILED LOGIN");

    console.log("BEFORE TOUCH LAST LOGIN");
    await userRepo.touchLastLogin(user.id);
    console.log("AFTER TOUCH LAST LOGIN");

    console.log("BEFORE FIND BY ID");
    const freshUser = await userRepo.findById(user.id);
    console.log("AFTER FIND BY ID", { found: !!freshUser });

    if (!freshUser) {
      throw new AuthenticationError("User no longer exists");
    }

    const sessionToken = tokenService.generateToken();
    const refreshToken = tokenService.generateToken();
    const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

    console.log("BEFORE SESSION CREATE");
    await sessionRepo.create({
      userId: freshUser.id,
      sessionTokenHash: tokenService.hashToken(sessionToken),
      refreshTokenHash: tokenService.hashToken(refreshToken),
      userAgent: input.userAgent ?? null,
      ipAddress: input.ipAddress ?? null,
      expiresAt,
    });
    console.log("AFTER SESSION CREATE");

    return {
      user: userRepo.toSafeUser(freshUser),
      sessionToken,
      refreshToken,
      expiresAt,
    };
  };