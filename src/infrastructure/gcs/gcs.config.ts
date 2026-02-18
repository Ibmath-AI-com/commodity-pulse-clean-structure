// E:\AI Projects\commodity-clean-structure\src\infrastructure\gcs\gcs.config.ts
import "server-only";

function opt(name: string): string | null {
  const v = process.env[name];
  const t = v?.trim();
  return t ? t : null;
}

function req(name: string): string {
  const v = opt(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function reqNumber(name: string, fallback: number): number {
  const raw = opt(name);
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`Invalid number env: ${name}`);
  return n;
}

/**
 * Non-throwing snapshot.
 */
export const gcsConfig = {
  bucket: opt("GCS_BUCKET"),
  signedUrlExpiresMin: reqNumber("GCS_SIGNED_URL_EXPIRES_MIN", 15),

  // Credentials options (all optional; strict mode decides what is required)
  serviceAccountJsonB64: opt("GOOGLE_APPLICATION_SA_JSON_B64"),
  //googleApplicationCredentials: opt("GOOGLE_APPLICATION_CREDENTIALS"),
} as const;

/**
 * Strict config for server-side GCS usage.
 */
export function requireGcsConfig() {
  return {
    bucket: req("GCS_BUCKET"),
    signedUrlExpiresMin: reqNumber("GCS_SIGNED_URL_EXPIRES_MIN", 15),

    serviceAccountJsonB64: opt("GOOGLE_APPLICATION_SA_JSON_B64"),
    //googleApplicationCredentials: opt("GOOGLE_APPLICATION_CREDENTIALS"),
  } as const;
}
