import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";
import { Errors } from "../lib/errors.js";

/** Validate & coerce the request body against a Zod schema (rejects unknown shapes). */
export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const r = schema.safeParse(req.body);
    if (!r.success) return next(Errors.badRequest("Validation failed", r.error.flatten().fieldErrors));
    req.body = r.data;
    next();
  };
}

/** Validate & coerce the query string against a Zod schema. */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const r = schema.safeParse(req.query);
    if (!r.success) return next(Errors.badRequest("Invalid query", r.error.flatten().fieldErrors));
    (req as Request & { validatedQuery: T }).validatedQuery = r.data;
    next();
  };
}
