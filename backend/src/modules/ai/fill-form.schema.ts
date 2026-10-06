import { z } from "zod";

// ---------------------------------------------------------------------------
// Zod schema for the conversation message
// ---------------------------------------------------------------------------

const conversationMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

// ---------------------------------------------------------------------------
// POST /api/ai/fill-form/turn
// ---------------------------------------------------------------------------

export const fillFormTurnSchema = z.object({
  formId: z.string().min(1, "formId is required"),
  sessionId: z.string().min(1, "sessionId is required"),
  messages: z.array(conversationMessageSchema).default([]),
  userMessage: z
    .string()
    .min(1, "userMessage is required")
    .max(4000, "userMessage must be at most 4000 characters"),
  /**
   * The accumulated extracted answers held by the frontend from prior turns.
   * Shape: { [questionId]: value | null }
   * null = user deliberately skipped an optional field
   */
  filledAnswers: z.record(z.string(), z.unknown()).default({}),
});

export type FillFormTurnInput = z.infer<typeof fillFormTurnSchema>;
