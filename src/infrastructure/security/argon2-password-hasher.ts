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

 async verify(hashedValue: string, plainValue: string): Promise<boolean> {
    console.log("VERIFY INPUT", {
      hashPrefix: hashedValue?.slice(0, 20),
      plainLength: plainValue?.length,
    });

    const ok = await argon2.verify(hashedValue, plainValue);

    console.log("VERIFY RESULT", { ok });

    return ok;
  }
}