// Minimal environment so modules that import `config/env` can load under test.
// These are only the schema-required vars (everything else has a default); no test
// reads real values — they just let `loadEnv()` succeed.
process.env.DATABASE_URL ??= "postgresql://forge:forge@localhost:5432/forge?schema=public";
process.env.SESSION_SECRET ??= "test-session-secret-0123456789";
