import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared conversation sub-schema
// ---------------------------------------------------------------------------

const conversationMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

// ---------------------------------------------------------------------------
// Form context sub-schemas
// ---------------------------------------------------------------------------

const questionOptionSchema = z.object({
  id: z.string(),
  label: z.string(),
});

const questionContextSchema = z.object({
  id: z.string(),
  sectionId: z.string().optional().default(""),
  type: z.string(),
  label: z.string(),
  description: z.string().optional().default(""),
  placeholder: z.string().optional().default(""),
  required: z.boolean().optional().default(false),
  position: z.number().int().optional().default(0),
  options: z.array(questionOptionSchema).optional().default([]),
  validation: z.record(z.string(), z.unknown()).optional().default({}),
});

const sectionContextSchema = z.object({
  id: z.string(),
  title: z.string().optional().default(""),
  description: z.string().optional().default(""),
  position: z.number().int().optional().default(0),
});

const selectedElementSchema = z
  .object({
    type: z.enum(["form", "section", "question"]),
    id: z.string(),
  })
  .nullable()
  .optional();

const formContextSchema = z.object({
  form: z.object({
    title: z.string().optional().default(""),
    description: z.string().optional().default(""),
  }),
  sections: z.array(sectionContextSchema).optional().default([]),
  questions: z.array(questionContextSchema).optional().default([]),
  selectedElement: selectedElementSchema.default(null),
});

// ---------------------------------------------------------------------------
// POST /api/ai/builder/turn
// ---------------------------------------------------------------------------

export const builderChatTurnSchema = z.object({
  formId: z.string().min(1, "formId is required"),
  messages: z.array(conversationMessageSchema).default([]),
  userMessage: z
    .string()
    .min(1, "userMessage is required")
    .max(4000, "userMessage must be at most 4000 characters"),
  formContext: formContextSchema,
});

export type BuilderChatTurnInput = z.infer<typeof builderChatTurnSchema>;
