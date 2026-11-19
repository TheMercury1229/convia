/**
 * lib/api/ai-analytics.ts
 * -----------------------
 * Client-side API helper for the AI analyze-responses streaming endpoint.
 *
 * SSE wire protocol:
 *   Every chunk:  data: {"delta": "...", "done": false}
 *   Final chunk:  data: {"delta": "",   "done": true}
 *   Error chunk:  data: {"error": "...", "done": true}
 */

import { ssePost, BACKEND_URL } from "./sse-reader";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export interface QuestionContextItem {
  id: string;
  label: string;
  type: string;
  isRequired: boolean;
  options?: Array<{ id: string; label: string }>;
}

export interface DistributionItem {
  label: string;
  count: number;
  percent: number;
}

export interface QuestionInsightContext {
  questionId: string;
  label: string;
  type: string;
  totalAnswered: number;
  totalSkipped: number;
  answerRate: number;
  distribution?: DistributionItem[];
  averageScore?: number | null;
  topWords?: Array<{ word: string; count: number }>;
}

export interface AggregateStatsContext {
  totalViews: number;
  totalSubmissions: number;
  completedSubmissions: number;
  partialSubmissions: number;
  completionRate: number;
  engagementRate: number;
  dropoffRate: number;
  lastSubmissionAt: string | null;
  questionInsights: QuestionInsightContext[];
}

export interface RawResponseContext {
  submittedAt: string;
  answers: Record<string, unknown>;
}

export interface AnalyzeResponsesTurnPayload {
  formId: string;
  messages: ConversationMessage[];
  userMessage: string;
  analyticsContext: {
    formTitle: string;
    formDescription?: string;
    questions: QuestionContextItem[];
    stats: AggregateStatsContext;
    recentResponses: RawResponseContext[];
  };
}

export interface SSEAnalyticsEvent {
  delta: string;
  done: boolean;
  error?: string;
}

// ---------------------------------------------------------------------------
// Stream function
// ---------------------------------------------------------------------------

/**
 * Sends one turn to POST /api/ai/analyze-responses/turn and yields parsed SSE events.
 */
export function streamAnalyzeResponsesTurn(
  payload: AnalyzeResponsesTurnPayload,
  signal?: AbortSignal,
): AsyncGenerator<SSEAnalyticsEvent, void, unknown> {
  return ssePost<SSEAnalyticsEvent>({
    url: `${BACKEND_URL}/api/ai/analyze-responses/turn`,
    body: payload,
    signal,
    label: "ai-analytics",
  });
}
