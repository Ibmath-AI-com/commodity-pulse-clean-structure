import fs from "fs";
import path from "path";
import { postgres } from "../src/infrastructure/db/postgres.client.js";

async function run() {
  const schemaPath = path.resolve(
    process.cwd(),
    "src/infrastructure/database/schema.sql"
  );

  const sql = fs.readFileSync(schemaPath, "utf8");

  await postgres.query(sql);

  console.log("Database schema initialized");

  process.exit(0);
}

run();