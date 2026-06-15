import "dotenv/config";
import { defineConfig, env } from "prisma/config";

/**
 * Prisma 7 config. Connection URLs no longer live in schema.prisma:
 *  - Prisma Migrate / CLI use the datasource URL below (direct, non-pooled).
 *  - The runtime client connects via the driver adapter in src/lib/db.ts
 *    (pooled DATABASE_URL).
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Migrations want the DIRECT (non-pooled) connection; fall back to DATABASE_URL.
    url: env("DIRECT_URL") ?? env("DATABASE_URL"),
  },
});
