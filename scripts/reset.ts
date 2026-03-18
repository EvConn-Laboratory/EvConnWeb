/**
 * Wipes the entire database by dropping the public schema and recreating it.
 * Run `npm run db:push` afterwards to recreate all tables.
 *
 * Usage:
 *   npm run db:reset
 *   DATABASE_URL=postgresql://... npm run db:reset
 */

import postgres from "postgres";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://neondb_owner:npg_cHE4AyibU9WZ@ep-proud-mode-anl0t6d0-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const sql = postgres(connectionString, { max: 1 });

async function reset() {
  console.log("⚠️  Wiping database...");
  console.log(`   URL: ${connectionString.replace(/:([^:@]+)@/, ":****@")}\n`);

  await sql`DROP SCHEMA public CASCADE`;
  await sql`CREATE SCHEMA public`;
  await sql`GRANT ALL ON SCHEMA public TO public`;

  console.log("✅ Database wiped successfully.");
  console.log("   Run  npm run db:push  to recreate the schema.");
  console.log("   Then run  npm run db:seed  to create the admin account.\n");

  await sql.end();
}

reset().catch((err) => {
  console.error("❌ Reset failed:", err.message ?? err);
  process.exit(1);
});
