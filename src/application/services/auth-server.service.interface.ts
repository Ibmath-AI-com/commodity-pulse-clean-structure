// FILE: src/application/services/auth.service.interface.ts

export type AuthenticatedUser = {
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

export type LoginAuthResult = {
  user: AuthenticatedUser;
  sessionToken: string;
  refreshToken: string;
  expiresAt: Date;
};

export interface IAuthServerService {
  login(input: {
    email: string;
    password: string;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<LoginAuthResult>;

  logout(input: {
    sessionToken: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  }): Promise<void>;

  getCurrentUser(sessionToken: string | null): Promise<AuthenticatedUser>;
}