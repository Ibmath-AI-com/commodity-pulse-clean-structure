// src/infrastructure/db/postgres.client.ts
import { Pool } from "pg";

console.log("DB ENV CHECK", {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  passwordExists: !!process.env.DB_PASSWORD,
  max: process.env.DB_MAX,
});

export const postgres = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: Number(process.env.DB_MAX || 10),
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});