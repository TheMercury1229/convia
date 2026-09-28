export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errors: string[];
  public readonly isOperational: boolean;

  constructor(
    statusCode: number,
    message: string,
    errors: string[] = [],
    isOperational = true,
  ) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = isOperational;

    // Maintains proper stack trace in V8
    Error.captureStackTrace(this, this.constructor);
  }

  // ─── Convenience factory methods ────────────────────────────────────────────

  static badRequest(message: string, errors: string[] = []) {
    return new ApiError(400, message, errors);
  }

  static unauthorized(message = "Unauthorized") {
    return new ApiError(401, message);
  }

  static forbidden(message = "Forbidden") {
    return new ApiError(403, message);
  }

  static notFound(message = "Resource not found") {
    return new ApiError(404, message);
  }

  static conflict(message: string, errors: string[] = []) {
    return new ApiError(409, message, errors);
  }

  static unprocessable(message: string, errors: string[] = []) {
    return new ApiError(422, message, errors);
  }

  static internal(message = "Internal server error") {
    // Not operational — treated as a crash-worthy error
    return new ApiError(500, message, [], false);
  }
}
