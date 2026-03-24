// E:\AI Projects\commodity-pulse-clean-structure\src\infrastructure\db\postgres.client.ts
import { Pool } from "pg";

export const postgres = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: Number(process.env.DB_MAX || 10),
});

// To connect to the database using psql, use the following command:
// docker exec -it postgres psql -U appuser -d appdb