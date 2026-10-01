import { z } from "zod";

export const recordViewSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
});

export const startSessionSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
});

export const updateSessionSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  lastQuestionIndex: z.number().int().min(0, "lastQuestionIndex must be >= 0"),
});

export const completeSessionSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  responseId: z.string().optional(),
});

export type RecordViewInput = z.infer<typeof recordViewSchema>;
export type StartSessionInput = z.infer<typeof startSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type CompleteSessionInput = z.infer<typeof completeSessionSchema>;
