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

type FirebaseErrorResponse = {
  error?: {
    message?: string;
    errors?: Array<{ message?: string }>;
  };
};

function isSignInOk(x: unknown): x is SignInWithPasswordResponse {
  return (
    typeof x === "object" &&
    x !== null &&
    "localId" in x &&
    "email" in x &&
    "idToken" in x
  );
}

export class FirebaseAuthServerService implements IAuthServerService {
  async authenticate(input: { email: string; password: string }): Promise<AuthCredential> {
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) throw new Error("Missing NEXT_PUBLIC_FIREBASE_API_KEY");

    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: input.email,
          password: input.password,
          returnSecureToken: true,
        }),
        cache: "no-store",
      }
    );

    const data: unknown = await res.json();

    if (!res.ok) {
      const err = data as FirebaseErrorResponse;
      const msg =
        err?.error?.message ||
        err?.error?.errors?.[0]?.message ||
        "Firebase auth failed";
      throw new Error(msg);
    }

    if (!isSignInOk(data)) {
      throw new Error("Invalid Firebase auth response");
    }

    return {
      uid: data.localId,
      email: data.email,
      getIdToken: async () => data.idToken,
    };
  }

  async logout(): Promise<void> {
    // Server-side: nothing to do here.
  }
}