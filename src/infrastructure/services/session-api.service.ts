// src/infrastructure/services/session-api.service.ts
import "server-only";
import { headers, cookies } from "next/headers";
import { adminAuth } from "@/src/infrastructure/firebase/firebase.admin";

type SessionValidationResult = {
  uid: string;
  email: string | null;
};

function getEmailFromDecoded(decoded: unknown): string | null {
  if (typeof decoded !== "object" || decoded === null) return null;
  const email = (decoded as { email?: unknown }).email;
  return typeof email === "string" && email.trim() ? email : null;
}

async function isHttpsRequest(): Promise<boolean> {
  const h = await headers(); // <-- await required in your Next version
  const proto = h.get("x-forwarded-proto") ?? "http";
  return proto === "https";
}

export class SessionApiService {
  async createSessionCookie(input: { idToken: string }): Promise<void> {
    const expiresInMs = 60 * 60 * 24 * 5 * 1000;

    const sessionCookie = await adminAuth.createSessionCookie(input.idToken, {
      expiresIn: expiresInMs,
    });

    const secure = await isHttpsRequest();

    const cookieStore = await cookies(); // <-- await required in your Next version
    cookieStore.set("session", sessionCookie, {
      httpOnly: true,
      secure, // false on http ALB, true on https
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(expiresInMs / 1000),
    });
  }

  async clearSessionCookie(): Promise<void> {
    const secure = await isHttpsRequest();

    const cookieStore = await cookies();
    // delete with matching attributes (more reliable than delete("session") alone)
    cookieStore.set("session", "", {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    });
  }

  async validateSessionCookie(input: { sessionCookie: string }): Promise<SessionValidationResult> {
    const decoded = await adminAuth.verifySessionCookie(input.sessionCookie, true);

    return {
      uid: decoded.uid,
      email: getEmailFromDecoded(decoded),
    };
  }
}