import { pino } from "pino";
import { env, isProd } from "../config/env.js";

/** Structured JSON logger (CloudWatch-friendly). */
export const logger = pino({
  level: env.NODE_ENV === "test" ? "silent" : isProd ? "info" : "debug",
  redact: ["req.headers.authorization", "req.headers.cookie", "*.password", "*.secret"],
});
