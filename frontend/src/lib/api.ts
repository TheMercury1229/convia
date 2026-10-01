import axios from "axios";

export class ApiClientError extends Error {
  readonly status?: number;
  readonly errors: string[];

  constructor(message: string, status?: number, errors: string[] = []) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.errors = errors;
  }
}

/**
 * Pre-configured Axios instance that points to the backend.
 * Credentials (cookies / session) are always sent so that
 * better-auth session cookies are forwarded automatically.
 */
export const api = axios.create({
  baseURL: `${process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000"}/api`,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// ---------------------------------------------------------------------------
// Response interceptor — unwrap the standard { data, message, success }
// envelope so callers receive the payload directly.
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error?.response?.data?.message ?? error?.message ?? "Unknown error";
    const errors = Array.isArray(error?.response?.data?.errors)
      ? error.response.data.errors
      : [];
    return Promise.reject(
      new ApiClientError(message, error?.response?.status, errors),
    );
  },
);
