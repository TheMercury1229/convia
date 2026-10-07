/**
 * modules/ai/analyze-responses.controller.ts
 * --------------------------------------------
 * Thin controller for POST /api/ai/analyze-responses/turn
 *
 * Flow:
 *  1. Validated body arrives (validated by analyze-responses.schema.ts via validate middleware)
 *  2. Call streamAnalyzeResponsesTurn() → get axios Readable stream from AI backend
 *  3. Set SSE response headers, pipe stream → client
 *
 * This route requires auth (requireAuth + requireOrgMember) — only form owners
 * can access their form's response analytics.
 */

import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { ApiError } from "../../utils/api-error";
import type { AnalyzeResponsesTurnInput } from "./analyze-responses.schema";
import { streamAnalyzeResponsesTurn } from "./analyze-responses.service";

// ---------------------------------------------------------------------------
// POST /api/ai/analyze-responses/turn
// Auth required — org members only
// ---------------------------------------------------------------------------

export const analyzeResponsesTurn = asyncHandler(
  async (req: Request, res: Response) => {
    const { messages, userMessage, analyticsContext } =
      req.body as AnalyzeResponsesTurnInput;

    // Get the raw streaming response from the AI backend
    let aiStream;
    try {
      aiStream = await streamAnalyzeResponsesTurn({
        messages,
        userMessage,
        analyticsContext,
      });
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw ApiError.internal("Failed to connect to AI backend");
    }

    // -------------------------------------------------------------------------
    // Set SSE headers — must be done before any write
    // -------------------------------------------------------------------------
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering
    res.flushHeaders();

    // -------------------------------------------------------------------------
    // Pipe the AI backend SSE stream directly to the client
    // -------------------------------------------------------------------------
    aiStream.pipe(res);

    // -------------------------------------------------------------------------
    // Handle upstream errors mid-stream
    // -------------------------------------------------------------------------
    aiStream.on("error", (err) => {
      console.error("[analyze-responses] AI stream error:", err.message);
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
  },
);
