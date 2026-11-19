/**
 * lib/api/ai-fill.ts
 * -------------------
 * Client-side API helper for the AI fill-form streaming endpoint.
 *
 * SSE event format (from the Python AI backend, proxied via Express):
 *   Intermediate:  data: {"delta": "...", "extracted": {}, "done": false}
 *   Final:         data: {"delta": "", "extracted": {...}, "is_complete": bool, "done": true}
 *   Error:         data: {"error": "...", "done": true}
 */

import { ssePost, BACKEND_URL } from "./sse-reader";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface FillFormTurnPayload {
  formId: string;
  sessionId: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  userMessage: string;
  filledAnswers: Record<string, unknown>;
}

export interface SSEEvent {
  /** Next few characters of Grizzy's reply (empty on final event) */
  delta: string;
  /** Extracted answers — only populated on the final event */
  extracted: Record<string, unknown>;
  /** Whether the AI thinks all required fields are filled */
  is_complete?: boolean;
  /** True on the last event of the stream */
  done: boolean;
  /** Present only if the AI backend errored */
  error?: string;
}

// ---------------------------------------------------------------------------
// Stream function
// ---------------------------------------------------------------------------

/**
 * Sends one conversation turn to the backend and returns an async iterator
 * that yields parsed SSE events as they arrive.
 *
 * Usage:
 * ```ts
 * for await (const event of streamFillFormTurn(payload, signal)) {
 *   if (event.error) { handleError(event.error); break; }
 *   appendDelta(event.delta);
 *   if (event.done) mergeExtracted(event.extracted);
 * }
 * ```
 */
export function streamFillFormTurn(
  payload: FillFormTurnPayload,
  signal?: AbortSignal,
): AsyncGenerator<SSEEvent, void, unknown> {
  return ssePost<SSEEvent>({
    url: `${BACKEND_URL}/api/ai/fill-form/turn`,
    body: payload,
    signal,
    label: "ai-fill",
  });
}
