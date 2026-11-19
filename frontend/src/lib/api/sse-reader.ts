/**
 * lib/api/sse-reader.ts
 * ---------------------
 * Shared SSE stream reader for all AI streaming endpoints.
 *
 * Wire protocol (same across all three AI endpoints):
 *   Chunk:  data: {"delta": "...", "done": false}
 *   Final:  data: {"delta": "",   "done": true, ...}  (may carry extras like `actions`, `extracted`)
 *   Error:  data: {"error": "...", "done": true}
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

export { BACKEND_URL };

export interface SsePostOptions {
  url: string;
  body: unknown;
  signal?: AbortSignal;
  /** Label used in console.warn, e.g. "ai-fill" */
  label?: string;
}

/**
 * POSTs JSON `body` to `url`, reads the SSE response body, and yields
 * each parsed JSON data-event as type T.
 *
 * Usage:
 * ```ts
 * for await (const event of ssePost<SSEEvent>({ url, body, signal, label })) {
 *   if (event.error) { handleError(event.error); break; }
 *   appendDelta(event.delta);
 *   if (event.done) finalize();
 * }
 * ```
 *
 * Supports AbortSignal — the caller can cancel mid-stream.
 */
export async function* ssePost<T>(opts: SsePostOptions): AsyncGenerator<T, void, unknown> {
  const { url, body, signal, label = "sse" } = opts;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(body),
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
          const dataLine = trimmed.split("\n").find((l) => l.startsWith("data: "));
          if (!dataLine) continue;

          const jsonStr = dataLine.slice(6); // strip "data: "
          try {
            yield JSON.parse(jsonStr) as T;
          } catch {
            console.warn(`[${label}] Skipping malformed SSE chunk:`, jsonStr);
          }
        }
      }

      if (done) break;
    }

    // Flush any remaining buffered data
    if (buffer.trim()) {
      const dataLine = buffer.trim().split("\n").find((l) => l.startsWith("data: "));
      if (dataLine) {
        const jsonStr = dataLine.slice(6);
        try {
          yield JSON.parse(jsonStr) as T;
        } catch {
          console.warn(`[${label}] Skipping final malformed SSE chunk:`, jsonStr);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
