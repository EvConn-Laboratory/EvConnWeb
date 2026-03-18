/**
 * Seeds the database with an administrator account.
 * Credentials can be overridden via environment variables.
 *
 * Usage:
 *   npm run db:seed
 *   ADMIN_USERNAME=admin ADMIN_PASSWORD=secret npm run db:seed
 *
 * Environment variables:
 *   DATABASE_URL     PostgreSQL connection string
 *   ADMIN_NAME       Display name           (default: "Administrator")
 *   ADMIN_USERNAME   Login username         (default: "admin")
 *   ADMIN_EMAIL      Email address          (default: none)
 *   ADMIN_PASSWORD   Plain-text password    (default: "admin123")
 */

import postgres from "postgres";
import bcrypt from "bcryptjs";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://neondb_owner:npg_cHE4AyibU9WZ@ep-proud-mode-anl0t6d0-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const ADMIN_NAME     = process.env.ADMIN_NAME     ?? "Administrator";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? "admin";
const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    ?? null;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "admin123";

const sql = postgres(connectionString, { max: 1 });

async function seed() {
  console.log("🌱 Seeding administrator account...\n");

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  await sql`
    INSERT INTO users (
      id,
      name,
      username,
      email,
      password_hash,
      role,
      must_change_password,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      ${ADMIN_NAME},
      ${ADMIN_USERNAME},
      ${ADMIN_EMAIL},
      ${passwordHash},
      'super_admin',
      false,
      NOW(),
      NOW()
    )
    ON CONFLICT (username) DO UPDATE SET
      name          = EXCLUDED.name,
      email         = EXCLUDED.email,
      password_hash = EXCLUDED.password_hash,
      role          = 'super_admin',
      deleted_at    = NULL,
      updated_at    = NOW()
  `;

  console.log("✅ Admin account ready:");
  console.log(`   Username : ${ADMIN_USERNAME}`);
  console.log(`   Password : ${ADMIN_PASSWORD}`);
  if (ADMIN_EMAIL) console.log(`   Email    : ${ADMIN_EMAIL}`);
  console.log(`   Role     : super_admin\n`);

  await sql.end();
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message ?? err);
  process.exit(1);
});
