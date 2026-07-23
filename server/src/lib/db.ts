import pkg from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { env, isProd } from "../config/env.js";

// @prisma/client is CommonJS (prisma-client-js generator); under NodeNext ESM a named
// import fails at runtime ("Named export 'PrismaClient' not found"). Default-import the
// module and destructure — works under Node's CJS/ESM interop.
const { PrismaClient } = pkg;

/**
 * Prisma 7 connects through a driver adapter (no built-in query engine).
 * Runtime uses the pooled DATABASE_URL; Migrate uses the direct URL via
 * prisma.config.ts.
 */
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

/** Single Prisma client for the process (avoids exhausting DB connections). */
export const prisma = new PrismaClient({
  adapter,
  log: isProd ? ["warn", "error"] : ["query", "warn", "error"],
});

export type Db = typeof prisma;
