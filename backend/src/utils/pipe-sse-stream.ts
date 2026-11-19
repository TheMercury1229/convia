/**
 * utils/pipe-sse-stream.ts
 * ------------------------
 * Shared helper that sets SSE response headers, pipes an upstream
 * Readable to the Express response, and handles both upstream errors
 * and early client disconnects.
 *
 * Used by all three AI streaming controllers:
 *   - fill-form.controller.ts
 *   - builder-chat.controller.ts
 *   - analyze-responses.controller.ts
 */

import type { Request, Response } from "express";
import type { Readable } from "stream";

export interface PipeSseOptions {
  req: Request;
  res: Response;
  stream: Readable;
  /**
   * Extra fields merged into the error SSE event JSON on upstream failure.
   * e.g. `{ actions: [] }` for builder-chat so the client shape stays consistent.
   */
  errorPayloadExtras?: Record<string, unknown>;
  /** Label for console.error messages, e.g. "fill-form" */
  label?: string;
}

/**
 * Sets the four standard SSE response headers, flushes them, then
 * pipes `stream` to `res`. Attaches error and close handlers.
 */
export function pipeSseStream(opts: PipeSseOptions): void {
  const { req, res, stream, errorPayloadExtras = {}, label = "sse" } = opts;

  // Must be set before any write
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering

  res.flushHeaders();

  stream.pipe(res);

  // Upstream AI backend error mid-stream
  stream.on("error", (err) => {
    console.error(`[${label}] AI stream error:`, err.message);
    if (!res.writableEnded) {
      const errorEvent = `data: ${JSON.stringify({
        error: "AI stream interrupted",
        done: true,
        ...errorPayloadExtras,
      })}\n\n`;
      res.write(errorEvent);
      res.end();
    }
  });

  // Client disconnects early — tear down the upstream connection
  req.on("close", () => {
    if (!stream.destroyed) {
      stream.destroy();
    }
  });
}
