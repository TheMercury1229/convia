import { z } from "zod";

// ---------------------------------------------------------------------------
// Submit response — body payload
// ---------------------------------------------------------------------------

/**
 * An individual answer item when passed in array format.
 * `fieldName` is optional because the backend can auto-resolve it from the form questions.
 * `value` is unknown to accept any answer type (string, number, array, boolean, etc.).
 */
export const answerItemSchema = z.object({
  questionId: z.string().min(1, "questionId is required"),
  fieldName: z.string().optional(),
  value: z.unknown().optional(),
});

/**
 * Accepts answers either as:
 * 1. Array of items: [{ questionId: "...", fieldName: "...", value: "..." }]
 * 2. Key-value dictionary: { [questionId]: value }
 */
export const submitResponseSchema = z.object({
  answers: z.union([
    z.array(answerItemSchema),
    z.record(z.string(), z.unknown()),
  ]),
  sessionId: z.string().optional(),
});

export type SubmitResponseInput = z.infer<typeof submitResponseSchema>;
