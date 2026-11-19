/**
 * modules/ai/fill-form.controller.ts
 * ------------------------------------
 * Thin controller for POST /api/ai/fill-form/turn
 *
 * Flow:
 *  1. Validated body arrives (validated by fill-form.schema.ts via validate middleware)
 *  2. Call streamFillFormTurn() → get axios Readable stream from AI backend
 *  3. Pipe stream to client via pipeSseStream
 *  4. On stream end: fire analytics update (best-effort, fire-and-forget)
 */

import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { ApiError } from "../../utils/api-error";
import { pipeSseStream } from "../../utils/pipe-sse-stream";
import type { FillFormTurnInput } from "./fill-form.schema";
import {
  streamFillFormTurn,
  fireAnalyticsUpdate,
} from "./fill-form.service";

// POST /api/ai/fill-form/turn — public, no auth required
export const fillFormTurn = asyncHandler(async (req: Request, res: Response) => {
  const { formId, sessionId, messages, userMessage, filledAnswers } =
    req.body as FillFormTurnInput;

  let aiStream;
  try {
    aiStream = await streamFillFormTurn({ formId, sessionId, messages, userMessage, filledAnswers });
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw ApiError.internal("Failed to connect to AI backend");
  }

  // Fire analytics on stream end (non-blocking, must not delay response)
  aiStream.on("end", () => {
    void fireAnalyticsUpdate(formId, sessionId, Object.keys(filledAnswers).length);
  });

  pipeSseStream({ req, res, stream: aiStream, label: "fill-form" });
});
