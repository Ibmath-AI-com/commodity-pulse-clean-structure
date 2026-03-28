import "server-only";
import { headers, cookies } from "next/headers";
import type { ISessionService } from "@/src/application/services/session.service.interface";

const SESSION_COOKIE = "cp_session";
const REFRESH_COOKIE = "cp_refresh";

async function isHttpsRequest(): Promise<boolean> {
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  return proto === "https";
}

export class NextSessionService implements ISessionService {
  async createSessionCookie(input: {
    sessionToken: string;
    refreshToken: string;
    expiresAt: Date;
  }): Promise<void> {
    const secure = await isHttpsRequest();
    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE, input.sessionToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      expires: input.expiresAt,
    });

    cookieStore.set(REFRESH_COOKIE, input.refreshToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      expires: input.expiresAt,
    });
  }

  async clearSessionCookie(): Promise<void> {
    const secure = await isHttpsRequest();
    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE, "", {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });

    cookieStore.set(REFRESH_COOKIE, "", {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }

  async getSessionToken(): Promise<string | null> {
    const cookieStore = await cookies();
    return cookieStore.get(SESSION_COOKIE)?.value ?? null;
  }
}