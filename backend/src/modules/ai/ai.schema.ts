import { z } from "zod";

// ---------------------------------------------------------------------------
// POST /api/ai/generate-form
// ---------------------------------------------------------------------------

export const generateFormSchema = z.object({
  user_query: z
    .string()
    .min(5, "Query must be at least 5 characters")
    .max(2000, "Query must be at most 2000 characters"),
});

export type GenerateFormInput = z.infer<typeof generateFormSchema>;
