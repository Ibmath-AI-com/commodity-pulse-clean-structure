import "server-only";
import crypto from "crypto";
import type { ITokenService } from "@/src/application/services/token-service.interface";

export class CryptoTokenService implements ITokenService {
  generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  hashToken(token: unknown): string {
    if (typeof token !== "string" || token.trim().length === 0) {
      throw new TypeError(
        `hashToken expected a non-empty string, received ${token === null ? "null" : typeof token}`
      );
    }

    return crypto.createHash("sha256").update(token, "utf8").digest("hex");
  }
}