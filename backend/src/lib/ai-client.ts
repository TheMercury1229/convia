/**
 * lib/ai-client.ts
 * ----------------
 * Singleton Axios instance pre-configured to talk to the Python AI backend.
 * Import `aiClient` wherever you need to call the AI service — never
 * construct raw Axios instances outside this file.
 */

import axios from "axios";
import ENV_CONFIG from "../config/env.config";

const aiClient = axios.create({
  baseURL: ENV_CONFIG.AI_BACKEND_URL,
  timeout: 60_000, // 60 s — AI generation can take up to ~20 s; leave headroom
  headers: {
    "Content-Type": "application/json",
  },
});

// ---------------------------------------------------------------------------
// Response interceptor — normalise upstream errors into a consistent shape
// so callers don't have to unwrap AxiosError manually.
// ---------------------------------------------------------------------------
aiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status: number = error.response?.status ?? 502;
    const detail: string =
      error.response?.data?.detail ??
      error.response?.data?.message ??
      error.message ??
      "AI backend unreachable";

    // Attach a friendly summary to the error so service layer can re-throw it
    error.aiDetail = detail;
    error.aiStatus = status;

    return Promise.reject(error);
  },
);

export default aiClient;
