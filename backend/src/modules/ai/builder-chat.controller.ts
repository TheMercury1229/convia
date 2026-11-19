/**
 * modules/ai/builder-chat.controller.ts
 * --------------------------------------
 * Controller for POST /api/ai/builder/turn
 *
 * Flow:
 *  1. Validated body arrives (via validate(builderChatTurnSchema))
 *  2. Call streamBuilderChatTurn() → gets axios Readable stream from AI backend
 *  3. Attach usage logger (non-blocking)
 *  4. Pipe stream to client via pipeSseStream
 */

import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { ApiError } from "../../utils/api-error";
import { pipeSseStream } from "../../utils/pipe-sse-stream";
import type { AuthenticatedRequest } from "../../types/index";
import type { BuilderChatTurnInput } from "./builder-chat.schema";
import { streamBuilderChatTurn } from "./builder-chat.service";
import { attachStreamUsageLogger } from "./ai-usage-log.repository";

// POST /api/ai/builder/turn — auth required (org members only)
export const builderChatTurn = asyncHandler(
  async (req: Request, res: Response) => {
    const authReq = req as AuthenticatedRequest;
    const { formId, messages, userMessage, formContext } =
      req.body as BuilderChatTurnInput;

    let aiStream;
    try {
      aiStream = await streamBuilderChatTurn({ messages, userMessage, formContext });
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
        feature: "builder_chat",
        userMessage,
        turnIndex: messages.length,
      });
    }

    // Builder error events include `actions: []` to keep the client shape consistent
    pipeSseStream({ req, res, stream: aiStream, errorPayloadExtras: { actions: [] }, label: "builder-chat" });
  },
);
