import type { Config } from "drizzle-kit";

export default {
  schema: "./lib/db/schema/index.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://evconn:evconn_secret@localhost:5432/evconn",
  },
} satisfies Config;
