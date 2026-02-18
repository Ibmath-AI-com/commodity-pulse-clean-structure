import "server-only";
import type {
  IAuthServerService,
  AuthCredential,
} from "@/src/application/services/auth-server.service.interface";

type SignInWithPasswordResponse = {
  localId: string;
  email: string;
  idToken: string;
};

export class FirebaseAuthServerService implements IAuthServerService {
  async authenticate(input: { email: string; password: string }): Promise<AuthCredential> {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) throw new Error("Missing NEXT_PUBLIC_FIREBASE_API_KEY");

    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Firebase REST expects password auth payload
        body: JSON.stringify({
          email: input.email,
          password: input.password,
          returnSecureToken: true,
        }),
        cache: "no-store",
      }
    );

    const data = (await res.json()) as any;

    if (!res.ok) {
      // Keep error message deterministic but useful
      const msg =
        data?.error?.message ||
        data?.error?.errors?.[0]?.message ||
        "Firebase auth failed";
      throw new Error(msg);
    }

    const ok = data as SignInWithPasswordResponse;

    return {
      uid: ok.localId,
      email: ok.email,
      getIdToken: async () => ok.idToken,
    };
  }

  async logout(): Promise<void> {
    // Server-side: nothing to do here. Cookie clearing is handled by SessionService (/api/session/logout)
  }
}
