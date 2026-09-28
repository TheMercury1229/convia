import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/api-error";

interface ErrorResponse {
  success: false;
  message: string;
  errors: string[];
  stack?: string;
}

/**
 * Global error handler middleware — must be registered LAST in server.ts.
 * Catches all errors forwarded via next(err) including ApiError instances.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void => {
  // Known, operational API error
  if (err instanceof ApiError) {
    const payload: ErrorResponse = {
      success: false,
      message: err.message,
      errors: err.errors,
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    };
    res.status(err.statusCode).json(payload);
    return;
  }

  // Unknown / programming error — log it, send a generic 500
  console.error("[Unhandled Error]", err);

  const payload: ErrorResponse = {
    success: false,
    message: "Internal server error",
    errors: [],
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  };

  res.status(500).json(payload);
};
