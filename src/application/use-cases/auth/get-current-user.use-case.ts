import type { IUserRepository } from "@/src/application/repositories/user.repository.interface";
import type { ISessionRepository } from "@/src/application/repositories/session.repository.interface";
import type { ITokenService } from "@/src/application/services/token-service.interface";
import { UnauthenticatedError, UserDisabledError } from "@/src/entities/errors/auth";

export type GetCurrentUserUseCaseResult = {
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

export type IGetCurrentUserUseCase = (
  sessionToken: string | null
) => Promise<GetCurrentUserUseCaseResult>;

export const getCurrentUserUseCase =
  (
    userRepo: IUserRepository,
    sessionRepo: ISessionRepository,
    tokenService: ITokenService
  ): IGetCurrentUserUseCase =>
  async (sessionToken) => {
    if (!sessionToken) {
      throw new UnauthenticatedError("Must be logged in");
    }

    const sessionTokenHash = tokenService.hashToken(sessionToken);

    const session = await sessionRepo.findActiveBySessionTokenHash(sessionTokenHash);

    if (!session) {
      throw new UnauthenticatedError("Invalid or expired session");
    }

    const user = await userRepo.findById(session.userId);

    if (!user) {
      throw new UnauthenticatedError("User not found");
    }

    if (user.status !== "active") {
      throw new UserDisabledError("User is disabled");
    }

    return userRepo.toSafeUser(user);
  };