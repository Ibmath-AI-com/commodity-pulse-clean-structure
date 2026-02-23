import "server-only";
import admin from "firebase-admin";
import { readFileSync } from "node:fs";
import type { ServiceAccount } from "firebase-admin";

function init() {
  if (admin.apps.length) return admin.app();

  const b64 = process.env.FIREBASE_ADMIN_JSON_BASE64;
  if (b64 && b64.trim()) {
    const jsonStr = Buffer.from(b64, "base64").toString("utf8");
    const json = JSON.parse(jsonStr) as ServiceAccount;

    return admin.initializeApp({
      credential: admin.credential.cert(json),
    });
  }

  const gCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (gCreds && gCreds.trim()) {
    return admin.initializeApp({
      credential: admin.credential.applicationDefault(),
    });
  }

  const keyPath = process.env.FIREBASE_ADMIN_KEY_PATH;
  if (keyPath && keyPath.trim()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "FIREBASE_ADMIN_KEY_PATH is not allowed in production. Use FIREBASE_ADMIN_JSON_BASE64 instead."
      );
    }

    const json = JSON.parse(readFileSync(keyPath, "utf8")) as ServiceAccount;

    return admin.initializeApp({
      credential: admin.credential.cert(json),
    });
  }

  throw new Error(
    "Missing Firebase Admin credentials. Set FIREBASE_ADMIN_JSON_BASE64 (recommended) or GOOGLE_APPLICATION_CREDENTIALS."
  );
}

export const adminApp = init();
export const adminDb = admin.firestore(adminApp);
export const adminAuth = admin.auth(adminApp);
export { admin };