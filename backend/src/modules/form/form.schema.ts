
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
    .preprocess((val) => {
      if (val === undefined) return undefined;
      if (val === "" || val === null) return null;
      if (typeof val === "string") {
        const d = new Date(val);
        if (!isNaN(d.getTime())) {
          return d.toISOString();
        }
      }
      return val;
    }, z.string().datetime({ offset: true, message: "deadline must be a valid UTC datetime string" }).nullable())
    .optional(),
  maxResponses: z.preprocess((val) => {
    if (val === undefined) return undefined;
    if (val === "" || val === null) return null;
    const num = Number(val);
    return isNaN(num) ? val : num;
  }, z.number().int().min(1, "Max responses must be at least 1").nullable().optional()),
  redirectUrl: z
    .string()
    .url("Must be a valid URL")
    .or(z.literal(""))
    .nullable()
    .optional(),
  completionTitle: z.string().max(255, "Title too long").nullable().optional(),
  completionMessage: z.string().max(2000, "Message too long").nullable().optional(),
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
