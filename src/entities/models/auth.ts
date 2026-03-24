export type UserStatus = "active" | "disabled";

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  isAdmin: boolean;
  status: UserStatus;
  mustChangePassword: boolean;
  failedLoginCount: number;
  lockedUntil: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SafeUser = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  status: UserStatus;
  mustChangePassword: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Session = {
  id: string;
  userId: string;
  sessionTokenHash: string;
  refreshTokenHash: string;
  userAgent: string | null;
  ipAddress: string | null;
  expiresAt: Date;
  lastSeenAt: Date | null;
  revokedAt: Date | null;
  revokeReason: string | null;
  createdAt: Date;
};