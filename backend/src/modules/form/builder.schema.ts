import { z } from "zod";

// ---------------------------------------------------------------------------
// Option — { id, label } pairs for choice questions
// ---------------------------------------------------------------------------

const optionSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
});

// ---------------------------------------------------------------------------
// Validation rules — loose, type-specific, all optional
// ---------------------------------------------------------------------------

const validationSchema = z.record(z.string(), z.unknown()).nullable().optional();

// ---------------------------------------------------------------------------
// Question
// ---------------------------------------------------------------------------

const questionSchema = z.object({
  id: z.string().min(1),
  sectionId: z.string().min(1),
  fieldName: z.string().min(1).max(100),
  label: z.string().min(1).max(500),
  description: z.string().max(1000).optional().nullable(),
  placeholder: z.string().max(500).optional().nullable(),
  type: z.enum([
    "text",
    "textarea",
    "paragraph",
    "number",
    "email",
    "phone",
    "date",
    "select",
    "multi_select",
    "radio",
    "checkbox",
    "rating",
    "file",
    "url",
    "time",
    "datetime",
    "yes_no",
    "scale",
    "heading",
  ]),
  isRequired: z.boolean(),
  position: z.number().int().min(0),
  options: z.array(optionSchema).optional().nullable(),
  validation: validationSchema,
});

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

const sectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().max(500).optional().nullable(),
  description: z.string().max(1000).optional().nullable(),
  position: z.number().int().min(0),
});

// ---------------------------------------------------------------------------
// Builder save payload
// ---------------------------------------------------------------------------

export const saveBuilderSchema = z.object({
  sections: z.array(sectionSchema),
  questions: z.array(questionSchema),
});

export type SaveBuilderInput = z.infer<typeof saveBuilderSchema>;
