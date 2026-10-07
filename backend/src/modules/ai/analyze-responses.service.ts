/**
 * modules/ai/analyze-responses.service.ts
 * -----------------------------------------
 * Business logic for the AI analyze-responses feature.
 *
 * Responsibilities:
 *  1. Build the system prompt from the analytics context sent by the frontend
 *     (no DB queries — the frontend already holds this data from the initial
 *      page load and sends it along with every turn)
 *  2. Call the AI backend via the existing aiClient (axios, responseType:"stream")
 *  3. Return the raw Readable stream to the controller for piping to the client
 *
 * The SSE wire format (delta/done events) is identical to fill_form,
 * so the frontend can reuse the same streaming hook.
 */

import type { Readable } from "stream";

import { ApiError } from "../../utils/api-error";
import aiClient from "../../lib/ai-client";
import type { AnalyzeResponsesTurnInput } from "./analyze-responses.schema";

// How many raw responses to include in the prompt at most.
// The Zod schema already caps the array at 50 — this is a secondary safety guard.
const MAX_RECENT_RESPONSES = 50;

// ---------------------------------------------------------------------------
// System prompt builder
// ---------------------------------------------------------------------------

/**
 * Serialise per-question aggregate insight into a compact prompt block.
 */
function serializeQuestionInsight(
  insight: AnalyzeResponsesTurnInput["analyticsContext"]["stats"]["questionInsights"][number],
): string {
  const lines: string[] = [
    `  - **${insight.label}** (${insight.type})`,
    `    Answer rate: ${insight.answerRate.toFixed(1)}%  |  Answered: ${insight.totalAnswered}  |  Skipped: ${insight.totalSkipped}`,
  ];

  if (insight.distribution && insight.distribution.length > 0) {
    const distStr = insight.distribution
      .slice(0, 8) // cap to top-8 to keep prompt concise
      .map((d) => `'${d.label}' ${d.count} (${d.percent.toFixed(1)}%)`)
      .join(", ");
    lines.push(`    Distribution: ${distStr}`);
  }

  if (insight.averageScore !== null && insight.averageScore !== undefined) {
    lines.push(`    Average score: ${insight.averageScore.toFixed(2)}`);
  }

  if (insight.topWords && insight.topWords.length > 0) {
    const words = insight.topWords
      .slice(0, 10)
      .map((w) => `'${w.word}' (${w.count})`)
      .join(", ");
    lines.push(`    Top words: ${words}`);
  }

  return lines.join("\n");
}

/**
 * Serialise one raw response into a compact single-line prompt entry.
 * Uses question labels from the context to make the output readable.
 */
function serializeRawResponse(
  response: AnalyzeResponsesTurnInput["analyticsContext"]["recentResponses"][number],
  questions: AnalyzeResponsesTurnInput["analyticsContext"]["questions"],
  index: number,
): string {
  const labelMap = new Map(questions.map((q) => [q.id, q.label]));
  const date = new Date(response.submittedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const answerParts = Object.entries(response.answers)
    .filter(([, val]) => val !== null && val !== undefined && val !== "")
    .map(([qId, val]) => {
      const label = labelMap.get(qId) ?? qId;
      const display =
        typeof val === "object" ? JSON.stringify(val) : String(val);
      return `${label}: ${display}`;
    })
    .join(" | ");

  return `  ${index + 1}. [${date}] ${answerParts || "(no answers)"}`;
}

/**
 * Build the full system prompt for one analyze-responses turn.
 * Called on every request — pure CPU work, no DB access.
 */
export function buildAnalyzeSystemPrompt(
  context: AnalyzeResponsesTurnInput["analyticsContext"],
): string {
  const { formTitle, formDescription, questions, stats, recentResponses } =
    context;

  // ── Description block ──────────────────────────────────────────────────
  const descriptionBlock = formDescription
    ? `Description: ${formDescription}`
    : "";

  // ── Questions block ─────────────────────────────────────────────────────
  const questionsBlock =
    questions.length > 0
      ? questions
          .map(
            (q) =>
              `  - [${q.id}] ${q.label} (${q.type}${q.isRequired ? ", required" : ", optional"})`,
          )
          .join("\n")
      : "  (no questions defined)";

  // ── Aggregate stats block ───────────────────────────────────────────────
  const lastSub = stats.lastSubmissionAt
    ? new Date(stats.lastSubmissionAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";

  const insightsBlock =
    stats.questionInsights.length > 0
      ? stats.questionInsights
          .map((qi) => serializeQuestionInsight(qi))
          .join("\n")
      : "  (no per-question data available)";

  const aggregateBlock = `
Total Views: ${stats.totalViews}
Total Submissions: ${stats.totalSubmissions}  |  Completed: ${stats.completedSubmissions}  |  Partial: ${stats.partialSubmissions}
Overall Completion Rate: ${stats.completionRate.toFixed(1)}%
Engagement Rate: ${stats.engagementRate.toFixed(1)}%
Drop-off Rate: ${stats.dropoffRate.toFixed(1)}%
Last Submission: ${lastSub}

Per-question breakdown:
${insightsBlock}`.trim();

  // ── Recent raw responses block ──────────────────────────────────────────
  const capped = recentResponses.slice(0, MAX_RECENT_RESPONSES);
  const recentBlock =
    capped.length > 0
      ? capped
          .map((r, i) => serializeRawResponse(r, questions, i))
          .join("\n")
      : "  (no responses yet)";

  return `\
You are **Grizzy**, a warm and insightful AI analytics assistant for Convia \
— a form-intelligence platform.
Your job is to help the **form owner** understand their form's response data \
through natural conversation.

## Form Overview
Form: ${formTitle}${descriptionBlock ? `\n${descriptionBlock}` : ""}

## Questions / Fields
${questionsBlock}

## Aggregate Statistics (full dataset — ${stats.totalSubmissions} total submissions)
${aggregateBlock}

## Recent Responses (last ${capped.length} submissions — raw answers)
${recentBlock}

## Your Capabilities & Rules
1. **Data-grounded answers only**: Base every answer strictly on the statistics \
and raw responses provided above. Never invent data, percentages, or trends \
that are not present in the context.
2. **Acknowledge limitations**: If the user asks something you cannot answer \
from the given data (e.g. future predictions, data outside this form), say so \
honestly and explain what would be needed.
3. **Qualitative + quantitative**: Summarise open-text answers, identify \
sentiment themes, or spot patterns in the raw responses. For numeric questions, \
cite exact figures from the stats block.
4. **Markdown output**: Use markdown tables, bullet lists, or bold text where \
it improves readability. Keep replies concise unless depth is requested.
5. **Scope**: Only discuss this form's response data. Politely decline \
unrelated questions and redirect to the data.
6. **Tone**: Warm, professional, and analytical — like a knowledgeable \
colleague reviewing data together.

## Output Format
Return ONLY valid JSON: { "reply": "<your markdown-formatted answer>" }
No markdown fences, no extra commentary outside the JSON.`;
}

// ---------------------------------------------------------------------------
// SSE proxy — stream the AI backend response
// ---------------------------------------------------------------------------

export interface StreamAnalyzeResponsesOptions {
  messages: AnalyzeResponsesTurnInput["messages"];
  userMessage: string;
  analyticsContext: AnalyzeResponsesTurnInput["analyticsContext"];
}

/**
 * Builds the system prompt and calls the AI backend using the existing
 * aiClient (axios singleton) with responseType:"stream".
 *
 * Returns a Node.js Readable stream that the controller can pipe directly
 * to the Express response — same pattern as streamFillFormTurn.
 */
export async function streamAnalyzeResponsesTurn(
  options: StreamAnalyzeResponsesOptions,
): Promise<Readable> {
  const { messages, userMessage, analyticsContext } = options;

  // Build system prompt — pure CPU, no DB
  const systemPrompt = buildAnalyzeSystemPrompt(analyticsContext);

  // Call AI backend — SSE stream
  const aiResponse = await aiClient.post<Readable>(
    "/api/analyze-responses/turn",
    {
      system_prompt: systemPrompt,
      messages,
      user_message: userMessage,
    },
    {
      responseType: "stream",
      headers: { Accept: "text/event-stream" },
      // Override default timeout — SSE streams can be long-lived
      timeout: 120_000,
    },
  );

  return aiResponse.data;
}
