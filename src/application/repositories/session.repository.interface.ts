import type { Session } from "@/src/entities/models/auth";

export interface ISessionRepository {
  create(input: {
    userId: string;
    sessionTokenHash: string;
    refreshTokenHash: string;
    userAgent: string | null;
    ipAddress: string | null;
    expiresAt: Date;
  }): Promise<Session>;

  findActiveBySessionTokenHash(sessionTokenHash: string): Promise<Session | null>;
  revokeBySessionTokenHash(sessionTokenHash: string, reason: string): Promise<void>;
  revokeAllByUserId(userId: string, reason: string): Promise<void>;
}