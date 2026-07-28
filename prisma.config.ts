import path from "node:path";
import { defineConfig, env } from "prisma/config";

// Prisma 7 no longer auto-loads .env for the CLI; load it via Node's built-in
// env file loader so the CLI (migrate/generate) can read DATABASE_URL.
try {
  process.loadEnvFile();
} catch {
  // .env may not exist (e.g. CI with env vars already set) — ignore.
}

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  migrations: {
    path: path.join("prisma", "migrations"),
  },
  // The connection URL used by the Prisma CLI for migrations. At runtime the app
  // connects via the @prisma/adapter-better-sqlite3 driver adapter (see
  // src/lib/prisma.ts). On Render this must point inside the mounted disk —
  // a repo-relative path is wiped on every deploy (silent data loss, not a crash).
  datasource: {
    url: env("DATABASE_URL"),
  },
});
