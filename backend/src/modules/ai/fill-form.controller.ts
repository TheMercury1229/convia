/**
 * modules/ai/fill-form.controller.ts
 * ------------------------------------
 * Thin controller for POST /api/ai/fill-form/turn
 *
 * Flow:
 *  1. Validated body arrives (validated by fill-form.schema.ts via validate middleware)
 *  2. Call streamFillFormTurn() → get axios Readable stream from AI backend
 *  3. Set SSE response headers, pipe stream → client
 *  4. On stream end: fire analytics update (best-effort, fire-and-forget)
 */

import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { ApiError } from "../../utils/api-error";
import type { FillFormTurnInput } from "./fill-form.schema";
import {
  streamFillFormTurn,
  fireAnalyticsUpdate,
} from "./fill-form.service";

// ---------------------------------------------------------------------------
// POST /api/ai/fill-form/turn
// Public — no auth required (respondents are anonymous)
// ---------------------------------------------------------------------------

export const fillFormTurn = asyncHandler(async (req: Request, res: Response) => {
  const {
    formId,
    sessionId,
    messages,
    userMessage,
    filledAnswers,
  } = req.body as FillFormTurnInput;

  // Get the raw streaming response from the AI backend
  let aiStream;
  try {
    aiStream = await streamFillFormTurn({
      formId,
      sessionId,
      messages,
      userMessage,
      filledAnswers,
    });
  } catch (err) {
    // ApiErrors propagate cleanly; unknown errors become 502
    if (err instanceof ApiError) throw err;
    throw ApiError.internal("Failed to connect to AI backend");
  }

  // ---------------------------------------------------------------------------
  // Set SSE headers — must be done before any write
  // ---------------------------------------------------------------------------
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering
  res.flushHeaders();

  // ---------------------------------------------------------------------------
  // Pipe the AI backend SSE stream directly to the client
  // ---------------------------------------------------------------------------
  aiStream.pipe(res);

  // ---------------------------------------------------------------------------
  // On stream end: fire analytics update (non-blocking)
  // ---------------------------------------------------------------------------
  aiStream.on("end", () => {
    const filledCount = Object.keys(filledAnswers).length;
    // Don't await — analytics must never delay the response
    void fireAnalyticsUpdate(formId, sessionId, filledCount);
  });

  // ---------------------------------------------------------------------------
  // Handle upstream errors mid-stream
  // If the AI backend disconnects after we've started streaming, we close
  // the client connection and emit a final error SSE event if possible.
  // ---------------------------------------------------------------------------
  aiStream.on("error", (err) => {
    console.error("[fill-form] AI stream error:", err.message);
    if (!res.writableEnded) {
      const errorEvent = `data: ${JSON.stringify({
        error: "AI stream interrupted",
        done: true,
      })}\n\n`;
      res.write(errorEvent);
      res.end();
    }
  });

  // If the client disconnects early, destroy the AI backend connection
  req.on("close", () => {
    if (!aiStream.destroyed) {
      aiStream.destroy();
    }
  });
});
