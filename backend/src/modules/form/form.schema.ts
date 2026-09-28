
import { z } from "zod";

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export const createFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  description: z.string().max(1000, "Description too long").optional(),
  // If not provided, API auto-generates from title
  slug: z
    .string()
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens",
    )
    .min(2)
    .max(100)
    .optional(),
  themeId: z.string().optional(),
  deadline: z
    .string()
    .datetime({ offset: true, message: "deadline must be a valid UTC datetime string" })
    .nullable()
    .optional(),
});

// ---------------------------------------------------------------------------
// Update — all fields optional, same rules apply
// ---------------------------------------------------------------------------

export const updateFormSchema = createFormSchema.partial();

// ---------------------------------------------------------------------------
// Inferred types
// ---------------------------------------------------------------------------

export type CreateFormInput = z.infer<typeof createFormSchema>;
export type UpdateFormInput = z.infer<typeof updateFormSchema>;
