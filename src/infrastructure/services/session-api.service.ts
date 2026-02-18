// E:\AI Projects\commodity-clean-structure\src\infrastructure\services\session-api.service.ts
import "server-only";
import { cookies } from "next/headers";
import { adminAuth } from "@/src/infrastructure/firebase/firebase.admin";

export class SessionApiService {
  async createSessionCookie(input: { idToken: string }): Promise<void> {
    const expiresInMs = 60 * 60 * 24 * 5 * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(input.idToken, {
      expiresIn: expiresInMs,
    });

    const cookieStore = await cookies();
    cookieStore.set("session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.floor(expiresInMs / 1000),
    });
  }

  async clearSessionCookie(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete("session");
  }

  async validateSessionCookie(input: { sessionCookie: string }) {
    const decoded = await adminAuth.verifySessionCookie(
      input.sessionCookie,
      true
    );

    return {
      uid: decoded.uid,
      email: (decoded as any).email ?? null,
    };
  }
}
