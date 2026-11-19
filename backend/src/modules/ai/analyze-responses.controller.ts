/**
 * modules/ai/analyze-responses.controller.ts
 * --------------------------------------------
 * Thin controller for POST /api/ai/analyze-responses/turn
 *
 * Flow:
 *  1. Validated body arrives (validated by analyze-responses.schema.ts via validate middleware)
 *  2. Call streamAnalyzeResponsesTurn() → get axios Readable stream from AI backend
 *  3. Attach usage logger (non-blocking)
 *  4. Pipe stream to client via pipeSseStream
 *
 * Requires auth (requireAuth + requireOrgMember) — org members only.
 */

import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { ApiError } from "../../utils/api-error";
import { pipeSseStream } from "../../utils/pipe-sse-stream";
import type { AuthenticatedRequest } from "../../types/index";
import type { AnalyzeResponsesTurnInput } from "./analyze-responses.schema";
import { streamAnalyzeResponsesTurn } from "./analyze-responses.service";
import { attachStreamUsageLogger } from "./ai-usage-log.repository";

// POST /api/ai/analyze-responses/turn — auth required, org members only
export const analyzeResponsesTurn = asyncHandler(
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const { formId, messages, userMessage, analyticsContext } =
      req.body as AnalyzeResponsesTurnInput;

    let aiStream;
    try {
      aiStream = await streamAnalyzeResponsesTurn({ messages, userMessage, analyticsContext });
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw ApiError.internal("Failed to connect to AI backend");
    }

    if (authReq.orgId) {
      attachStreamUsageLogger({
        stream: aiStream,
        orgId: authReq.orgId,
        userId: authReq.user?.id,
        formId,
        feature: "analyze_responses",
        userMessage,
        turnIndex: messages.length,
      });
    }

    pipeSseStream({ req, res, stream: aiStream, label: "analyze-responses" });
  },
);
