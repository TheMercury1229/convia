/**
 * lib/api/ai-fill.ts
 * -------------------
 * Client-side API helper for the AI fill-form streaming endpoint.
 *
 * Uses native `fetch` instead of axios because we need `ReadableStream`
 * access on the response body to parse SSE events in the browser.
 *
 * SSE event format (from the Python AI backend, proxied via Express):
 *   Intermediate:  data: {"delta": "...", "extracted": {}, "done": false}
 *   Final:         data: {"delta": "", "extracted": {...}, "is_complete": bool, "done": true}
 *   Error:         data: {"error": "...", "done": true}
 */

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

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

/** Shape of each parsed SSE event */
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
// SSE stream reader
// ---------------------------------------------------------------------------

/**
 * Sends one conversation turn to the backend and returns an async iterator
 * that yields parsed SSE events as they arrive.
 *
 * Usage:
 * ```ts
 * for await (const event of streamFillFormTurn(payload)) {
 *   if (event.error) { handleError(event.error); break; }
 *   appendDelta(event.delta);
 *   if (event.done) mergeExtracted(event.extracted);
 * }
 * ```
 *
 * Supports an `AbortSignal` so the caller can cancel mid-stream.
 */
export async function* streamFillFormTurn(
  payload: FillFormTurnPayload,
  signal?: AbortSignal,
): AsyncGenerator<SSEEvent, void, unknown> {
  const res = await fetch(`${BACKEND_URL}/api/ai/fill-form/turn`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(payload),
    credentials: "include",
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    let message = `AI request failed (${res.status})`;
    try {
      const json = JSON.parse(text) as { message?: string };
      if (json.message) message = json.message;
    } catch {
      // non-JSON error body — use the status-based message
    }
    throw new Error(message);
  }

  if (!res.body) {
    throw new Error("Response body is null — streaming not supported");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (value) {
        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by double newlines
        const parts = buffer.split("\n\n");
        // Keep the last (potentially incomplete) part in the buffer
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const trimmed = part.trim();
          if (!trimmed) continue;

          // Each SSE event starts with "data: "
          const dataLine = trimmed
            .split("\n")
            .find((l) => l.startsWith("data: "));
          if (!dataLine) continue;

          const jsonStr = dataLine.slice(6); // strip "data: "
          try {
            const event = JSON.parse(jsonStr) as SSEEvent;
            yield event;
          } catch {
            // Malformed JSON chunk — skip silently
            console.warn("[ai-fill] Skipping malformed SSE chunk:", jsonStr);
          }
        }
      }

      if (done) break;
    }

    // Process any remaining buffer
    if (buffer.trim()) {
      const dataLine = buffer
        .trim()
        .split("\n")
        .find((l) => l.startsWith("data: "));
      if (dataLine) {
        const jsonStr = dataLine.slice(6);
        try {
          const event = JSON.parse(jsonStr) as SSEEvent;
          yield event;
        } catch {
          console.warn("[ai-fill] Skipping final malformed SSE chunk:", jsonStr);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
