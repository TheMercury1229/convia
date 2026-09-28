import type { Request, Response, NextFunction, RequestHandler } from "express";

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void | Response>;

/**
 * Wraps an async route handler so that any thrown error (including ApiError)
 * is forwarded to the global error handler via next(err) instead of crashing.
 *
 * Usage:
 *   router.get("/", asyncHandler(async (req, res) => { ... }));
 */
export const asyncHandler = (fn: AsyncRequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
