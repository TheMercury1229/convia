/**
 * lib/api/ai-analytics.ts
 * -----------------------
 * Client-side API helper for the AI analyze-responses streaming endpoint.
 *
 * Calls POST /api/ai/analyze-responses/turn and consumes the SSE event stream.
 * Wire protocol:
 *   Every chunk:  data: {"delta": "...", "done": false}
 *   Final chunk:  data: {"delta": "",   "done": true}
 *   Error chunk:  data: {"error": "...", "done": true}
 */

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

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

/**
 * Sends one turn to POST /api/ai/analyze-responses/turn and yields
 * parsed SSE events.
 */
export async function* streamAnalyzeResponsesTurn(
  payload: AnalyzeResponsesTurnPayload,
  signal?: AbortSignal,
): AsyncGenerator<SSEAnalyticsEvent, void, unknown> {
  const res = await fetch(`${BACKEND_URL}/api/ai/analyze-responses/turn`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
    },
    body: JSON.stringify(payload),
    credentials: "include",
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    let message = `AI analytics request failed (${res.status})`;
    try {
      const json = JSON.parse(text) as { message?: string };
      if (json.message) message = json.message;
    } catch {
      // non-JSON error body
    }
    throw new Error(message);
  }

  if (!res.body) {
    throw new Error("Response body is null — streaming not supported");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (value) {
        buffer += decoder.decode(value, { stream: true });

        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";

        for (const part of parts) {
          const trimmed = part.trim();
          if (!trimmed) continue;

          const dataLine = trimmed
            .split("\n")
            .find((l) => l.startsWith("data: "));
          if (!dataLine) continue;

          const jsonStr = dataLine.slice(6);
          try {
            const event = JSON.parse(jsonStr) as SSEAnalyticsEvent;
            yield event;
          } catch {
            console.warn("[ai-analytics] Skipping malformed SSE chunk:", jsonStr);
          }
        }
      }

      if (done) break;
    }

    if (buffer.trim()) {
      const dataLine = buffer
        .trim()
        .split("\n")
        .find((l) => l.startsWith("data: "));
      if (dataLine) {
        const jsonStr = dataLine.slice(6);
        try {
          const event = JSON.parse(jsonStr) as SSEAnalyticsEvent;
          yield event;
        } catch {
          console.warn("[ai-analytics] Skipping final malformed SSE chunk:", jsonStr);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
