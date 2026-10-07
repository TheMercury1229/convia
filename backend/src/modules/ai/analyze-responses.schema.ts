import { z } from "zod";

// ---------------------------------------------------------------------------
// Shared sub-schemas
// ---------------------------------------------------------------------------

const conversationMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1),
});

/** Slim question descriptor — only what the LLM needs for context. */
const questionContextSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.string(),
  isRequired: z.boolean(),
  options: z
    .array(z.object({ id: z.string(), label: z.string() }))
    .optional()
    .default([]),
});

/** Per-question answer distribution entry. */
const distributionItemSchema = z.object({
  label: z.string(),
  count: z.number().int().min(0),
  percent: z.number().min(0),
});

/** Per-question aggregate insight — mirrors QuestionInsight in the frontend. */
const questionInsightSchema = z.object({
  questionId: z.string(),
  label: z.string(),
  type: z.string(),
  totalAnswered: z.number().int().min(0),
  totalSkipped: z.number().int().min(0),
  answerRate: z.number().min(0),
  distribution: z.array(distributionItemSchema).default([]),
  averageScore: z.number().nullable().optional(),
  topWords: z
    .array(z.object({ word: z.string(), count: z.number().int().min(0) }))
    .optional()
    .default([]),
});

/** Aggregate summary stats — mirrors FormAnalyticsSummary in the frontend. */
const aggregateStatsSchema = z.object({
  totalViews: z.number().int().min(0),
  totalSubmissions: z.number().int().min(0),
  completedSubmissions: z.number().int().min(0),
  partialSubmissions: z.number().int().min(0),
  completionRate: z.number().min(0),
  engagementRate: z.number().min(0),
  dropoffRate: z.number().min(0),
  lastSubmissionAt: z.string().nullable(),
  questionInsights: z.array(questionInsightSchema).default([]),
});

/** One raw response entry (answers keyed by questionId for compact serialisation). */
const rawResponseSchema = z.object({
  submittedAt: z.string(),
  /** Map of questionId → raw answer value (already resolved by the frontend). */
  answers: z.record(z.string(), z.unknown()),
});

// ---------------------------------------------------------------------------
// POST /api/ai/analyze-responses/turn
// ---------------------------------------------------------------------------

export const analyzeResponsesTurnSchema = z.object({
  /** The form being analysed (used to fetch metadata for the system prompt). */
  formId: z.string().min(1, "formId is required"),

  /** Conversation history from prior turns (client-held, stateless). */
  messages: z.array(conversationMessageSchema).default([]),

  /** The analyst's latest question. */
  userMessage: z
    .string()
    .min(1, "userMessage is required")
    .max(4000, "userMessage must be at most 4000 characters"),

  /**
   * Analytics context already loaded by the frontend on page load.
   * Sent on every turn so the Express backend can build the system prompt
   * without any additional DB queries.
   */
  analyticsContext: z.object({
    /** High-level form metadata. */
    formTitle: z.string(),
    formDescription: z.string().optional().default(""),

    /** Slim question list — labels + types for the LLM to reference. */
    questions: z.array(questionContextSchema).default([]),

    /** Full aggregate stats and per-question distributions. */
    stats: aggregateStatsSchema,

    /**
     * Most recent raw responses (up to 50, newest first).
     * The frontend slices its response list before sending.
     * Answers are keyed by questionId for compact prompt serialisation.
     */
    recentResponses: z.array(rawResponseSchema).max(50).default([]),
  }),
});

export type AnalyzeResponsesTurnInput = z.infer<
  typeof analyzeResponsesTurnSchema
>;
