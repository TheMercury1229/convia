import axios from "axios";

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
    // Bubble up a useful error message
    const message =
      error?.response?.data?.message ?? error?.message ?? "Unknown error";
    return Promise.reject(new Error(message));
  },
);
