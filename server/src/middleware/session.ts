import RedisStore from "connect-redis";
import session from "express-session";
import { Redis } from "ioredis";
import { env, isProd } from "../config/env.js";
import { logger } from "../lib/logger.js";

/**
 * Server-side sessions backed by Redis. The browser only holds an opaque session
 * id in a Secure, HttpOnly, SameSite=Lax cookie (no JWT/tokens in the browser).
 */
export function buildSession(): ReturnType<typeof session> {
  const redis = new Redis(env.REDIS_URL, { lazyConnect: false, maxRetriesPerRequest: 3 });
  redis.on("error", (err) => logger.error({ err }, "redis error"));

  return session({
    name: "forge.sid",
    store: new RedisStore({ client: redis, prefix: "forge:sess:" }),
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    rolling: true, // refresh the idle window on activity
    cookie: {
      httpOnly: true,
      secure: isProd,
      // Frontend (forge.taj.works) and API (forge.server.taj.works) are subdomains of
      // the same registrable site (taj.works), so requests between them are SAME-site:
      // SameSite=Lax IS sent on the SPA's cross-origin API calls and keeps CSRF
      // protection. (Only truly cross-site domains would need "none".)
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 8, // 8h absolute
      path: "/",
    },
  });
}
