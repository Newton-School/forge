import { defineConfig } from "prisma/config";

/**
 * Prisma 7 config (design artifact, Phase 1 — not run yet).
 * Connection URLs live here, not in schema.prisma.
 *  - DATABASE_URL : POOLED Neon URL for runtime (serverless-safe)
 *  - DIRECT_URL   : DIRECT Neon URL for migrations / DDL
 *
 * Phase 3 wiring: the runtime PrismaClient is constructed with a Postgres
 * adapter pointed at DATABASE_URL; `prisma migrate` uses the direct URL below.
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    // Direct (non-pooled) connection for migrations.
    // url is read at migrate-time from the environment.
  },
  // The runtime datasource URL is provided to PrismaClient via a driver adapter
  // (see lib/db/index.ts in Phase 3). DIRECT_URL is used by the migrate engine.
});
