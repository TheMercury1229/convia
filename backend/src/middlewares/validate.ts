import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";
import { ApiError } from "../utils/api-error";

/**
 * Zod validation middleware.
 * Validates req.body against the provided schema.
 * On failure — forwards a 400 ApiError with field-level messages to the error handler.
 * On success — replaces req.body with the parsed (coerced + stripped) data.
 *
 * Usage:
 *   router.post("/", validate(createFormSchema), asyncHandler(controller.create));
 */
export const validate =
  (schema: ZodSchema) =>
    (req: Request, _res: Response, next: NextFunction): void => {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.issues.map(
          (issue) => `${issue.path.join(".")}: ${issue.message}`,
        );
        return next(ApiError.badRequest("Validation failed", errors));
      }
      req.body = result.data;
      next();
    };
