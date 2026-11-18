/**
 * modules/ai/builder-chat.service.ts
 * -----------------------------------
 * Business logic for the Grizzy Builder Chat co-pilot feature.
 *
 * Responsibilities:
 *  1. Proxy the streaming request with structured formContext to the AI backend
 *     (the AI backend builds the prompt via ChatPromptTemplate)
 *  2. Return the raw Readable stream to the controller for piping to the client
 */

import type { Readable } from "stream";
import aiClient from "../../lib/ai-client";
import type { BuilderChatTurnInput } from "./builder-chat.schema";

export interface StreamBuilderChatOptions {
  messages: BuilderChatTurnInput["messages"];
  userMessage: string;
  formContext: BuilderChatTurnInput["formContext"];
}

/**
 * Streams the AI backend SSE response by forwarding raw formContext.
 * Returns a Node.js Readable stream to pipe to the Express response.
 */
export async function streamBuilderChatTurn(
  options: StreamBuilderChatOptions,
): Promise<Readable> {
  const { messages, userMessage, formContext } = options;

  // Call the AI backend SSE endpoint forwarding structured form_context
  const aiResponse = await aiClient.post<Readable>(
    "/api/builder/turn",
    {
      form_context: formContext,
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
