import type { NextFunction, Request, Response } from "express";

/** Typed application error — carries an HTTP status and a SAFE client message. */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const Errors = {
  badRequest: (msg = "Bad request", details?: unknown) => new AppError(400, "bad_request", msg, details),
  unauthorized: (msg = "Not authenticated") => new AppError(401, "unauthorized", msg),
  forbidden: (msg = "Not allowed") => new AppError(403, "forbidden", msg),
  notFound: (msg = "Not found") => new AppError(404, "not_found", msg),
  conflict: (msg = "Conflict") => new AppError(409, "conflict", msg),
};

/** Wrap async handlers so thrown/rejected errors reach the error middleware. */
export function asyncHandler<
  H extends (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
>(handler: H) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
}
