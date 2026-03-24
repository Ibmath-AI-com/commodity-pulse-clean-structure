// scripts/verify-password.ts
import argon2 from "argon2";

async function main() {
  const plain = "Admin123456!"; // admin@yourdomain.com replace with the password you are typing
  const hash =
    "$argon2id$v=19$m=65536,t=3,p=4$z5lCjQaQGzGJmUBFF+nbzA$Gczw8xmWEQmvYtG+cyy4J9QWtLIoIX50TN3nnX+Z/Tg";

  const ok = await argon2.verify(hash, plain);
  console.log({ ok });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});