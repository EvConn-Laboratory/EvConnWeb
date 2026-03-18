import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://evconn:evconn_secret@localhost:5432/evconn";

const isServerless = process.env.NETLIFY || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

const client = postgres(connectionString, {
  max: isServerless ? 1 : 10,
  idle_timeout: isServerless ? 0 : 20,
  connect_timeout: 10,
  ssl: connectionString.includes("neon.tech") ? "require" : false,
});

export const db = drizzle(client, { schema });
export type DB = typeof db;
