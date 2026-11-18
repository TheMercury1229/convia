/**
 * modules/ai/fill-form.service.ts
 * ---------------------------------
 * Business logic for the AI fill-form feature.
 *
 * Responsibilities:
 *  1. Fetch the form schema from DB (via form.repository)
 *  2. Proxy the streaming request with structured form_context to the AI backend
 *     (the AI backend builds the prompt via ChatPromptTemplate)
 *  3. Return the raw Readable stream to the controller for piping to the client
 *  4. Fire analytics updateSession on turn completion (best-effort, non-blocking)
 */

import type { Readable } from "stream";

import { ApiError } from "../../utils/api-error";
import aiClient from "../../lib/ai-client";
import * as formRepo from "../form/form.repository";
import * as analyticsService from "../analytics/analytics.service";

// ---------------------------------------------------------------------------
// SSE proxy — stream the AI backend response using axios responseType:"stream"
// ---------------------------------------------------------------------------

export interface StreamFillFormOptions {
  formId: string;
  sessionId: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  userMessage: string;
  filledAnswers: Record<string, unknown>;
}

/**
 * Fetches the form, extracts structured form_context, and calls the AI backend using
 * the existing `aiClient` (axios singleton) with responseType:"stream".
 *
 * Returns a Node.js Readable stream that the controller can pipe directly
 * to the Express response — no manual socket management required.
 */
export async function streamFillFormTurn(
  options: StreamFillFormOptions,
): Promise<Readable> {
  const { formId, messages, userMessage, filledAnswers } = options;

  // 1. Fetch form schema from DB
  const form = await formRepo.findFullFormById(formId);
  if (!form) throw ApiError.notFound("Form not found");
  if (!form.isPublished) throw ApiError.badRequest("Form is not published");

  // 2. Prepare structured form context for the AI backend
  const formContext = {
    title: form.title,
    description: form.description ?? "",
    sections: form.sections.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      questions: s.questions.map((q) => ({
        id: q.id,
        label: q.label,
        type: q.type,
        isRequired: q.isRequired,
        description: q.description,
        placeholder: q.placeholder,
        options: q.options,
        validation: q.validation,
      })),
    })),
    filled_answers: filledAnswers,
  };

  // 3. Call AI backend — passes structured context, AI backend compiles prompt
  const aiResponse = await aiClient.post<Readable>(
    "/api/fill-form/turn",
    {
      form_context: formContext,
      messages,
      user_message: userMessage,
    },
    {
      responseType: "stream",
      headers: {
        Accept: "text/event-stream",
      },
      // Override the default 60s timeout — SSE streams can be long-lived
      timeout: 120_000,
    },
  );

  return aiResponse.data;
}

// ---------------------------------------------------------------------------
// Analytics helper — fire-and-forget, never blocks the response
// ---------------------------------------------------------------------------

/**
 * Update analytics session progress after a turn completes.
 * Uses `filledAnswers` count as a proxy for `lastQuestionIndex`.
 * Errors are swallowed — analytics must never affect the user-facing flow.
 */
export async function fireAnalyticsUpdate(
  formId: string,
  sessionId: string,
  filledAnswersCount: number,
): Promise<void> {
  try {
    await analyticsService.updateSession(formId, {
      sessionId,
      lastQuestionIndex: filledAnswersCount,
    });
  } catch {
    // Non-critical — do not propagate
  }
}
