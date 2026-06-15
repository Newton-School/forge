import type { NextFunction, Request, Response } from "express";
import { AppError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import { isProd } from "../config/env.js";

export function notFound(_req: Request, res: Response): void {
  res.status(404).json({ error: { code: "not_found", message: "Not found" } });
}

/** Central error handler — typed AppErrors map to their status; everything else is 500 (no leakage). */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
    return;
  }
  logger.error({ err }, "unhandled error");
  const message = isProd ? "Internal error" : err instanceof Error ? err.message : String(err);
  res.status(500).json({ error: { code: "internal", message } });
}
