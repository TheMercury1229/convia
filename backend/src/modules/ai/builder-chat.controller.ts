/**
 * modules/ai/builder-chat.controller.ts
 * --------------------------------------
 * Controller for POST /api/ai/builder/turn
 *
 * Flow:
 *  1. Validated body arrives (via validate(builderChatTurnSchema))
 *  2. Call streamBuilderChatTurn() → gets axios Readable stream from AI backend
 *  3. Set SSE response headers, pipe stream → client
 *  4. Handle client disconnection and upstream errors
 */

import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { ApiError } from "../../utils/api-error";
import type { BuilderChatTurnInput } from "./builder-chat.schema";
import { streamBuilderChatTurn } from "./builder-chat.service";

// ---------------------------------------------------------------------------
// POST /api/ai/builder/turn
// Auth required (org members only)
// ---------------------------------------------------------------------------

export const builderChatTurn = asyncHandler(
  async (req: Request, res: Response) => {
    const { messages, userMessage, formContext } =
      req.body as BuilderChatTurnInput;

    let aiStream;
    try {
      aiStream = await streamBuilderChatTurn({
        messages,
        userMessage,
        formContext,
      });
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw ApiError.internal("Failed to connect to AI backend");
    }

    // -------------------------------------------------------------------------
    // Set SSE headers
    // -------------------------------------------------------------------------
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    // -------------------------------------------------------------------------
    // Pipe the AI backend SSE stream to the client
    // -------------------------------------------------------------------------
    aiStream.pipe(res);

    // -------------------------------------------------------------------------
    // Handle upstream errors mid-stream
    // -------------------------------------------------------------------------
    aiStream.on("error", (err) => {
      console.error("[builder-chat] AI stream error:", err.message);
      if (!res.writableEnded) {
        const errorEvent = `data: ${JSON.stringify({
          error: "AI stream interrupted",
          done: true,
          actions: [],
        })}\n\n`;
        res.write(errorEvent);
        res.end();
      }
    });

    // Clean up if client aborts connection early
    req.on("close", () => {
      if (!aiStream.destroyed) {
        aiStream.destroy();
      }
    });
  },
);
