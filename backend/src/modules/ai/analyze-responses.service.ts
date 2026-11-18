/**
 * modules/ai/analyze-responses.service.ts
 * -----------------------------------------
 * Business logic for the AI analyze-responses feature.
 *
 * Responsibilities:
 *  1. Proxy the streaming request with structured analyticsContext to the AI backend
 *     (the AI backend builds the prompt via ChatPromptTemplate)
 *  2. Return the raw Readable stream to the controller for piping to the client
 */

import type { Readable } from "stream";
import aiClient from "../../lib/ai-client";
import type { AnalyzeResponsesTurnInput } from "./analyze-responses.schema";

export interface StreamAnalyzeResponsesOptions {
  messages: AnalyzeResponsesTurnInput["messages"];
  userMessage: string;
  analyticsContext: AnalyzeResponsesTurnInput["analyticsContext"];
}

/**
 * Streams the AI backend SSE response by forwarding raw analyticsContext.
 * Returns a Node.js Readable stream that the controller can pipe directly
 * to the Express response.
 */
export async function streamAnalyzeResponsesTurn(
  options: StreamAnalyzeResponsesOptions,
): Promise<Readable> {
  const { messages, userMessage, analyticsContext } = options;

  // Call AI backend — SSE stream forwarding structured analytics_context
  const aiResponse = await aiClient.post<Readable>(
    "/api/analyze-responses/turn",
    {
      analytics_context: analyticsContext,
      messages,
      user_message: userMessage,
    },
    {
      responseType: "stream",
      headers: { Accept: "text/event-stream" },
      timeout: 120_000,
    },
  );

  return aiResponse.data;
}
