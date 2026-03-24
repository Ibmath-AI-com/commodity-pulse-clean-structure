// FILE: src/application/services/session.service.interface.ts
import type { ReadonlyRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";


export type SessionUser = {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  status: "active" | "disabled";
  mustChangePassword: boolean;
};

export interface ISessionService {
  createSessionCookie(input: {
    sessionToken: string;
    refreshToken: string;
    expiresAt: Date;
  }): Promise<void>;

  clearSessionCookie(): Promise<void>;

   getSessionToken(cookieStore: ReadonlyRequestCookies): Promise<string | null>;

}