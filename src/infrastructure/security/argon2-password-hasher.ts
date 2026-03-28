import "server-only";
import argon2 from "argon2";
import type { IPasswordHasher } from "@/src/application/services/password-hasher.service.interface";

export class Argon2PasswordHasher implements IPasswordHasher {
  async hash(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });
  }

  async verify(passwordHash: string, password: string): Promise<boolean> {
    return argon2.verify(passwordHash, password);
  }
}