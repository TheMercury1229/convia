/**
 * lib/api/ai-builder.ts
 * ---------------------
 * Client-side API helper for the Grizzy Builder Chat streaming endpoint.
 *
 * Calls POST /api/ai/builder/turn and consumes the SSE event stream.
 * Wire protocol:
 *   Every chunk:  data: {"delta": "...", "done": false}
 *   Final chunk:  data: {"delta": "",   "done": true, "actions": [...]}
 *   Error chunk:  data: {"error": "...", "done": true, "actions": []}
 */

import type {
  BuilderForm,
  Question,
  QuestionType,
  QuestionValidation,
  Section,
} from "@/types/builder";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

export type BuilderAction =
  | {
      type: "updateQuestion";
      id?: string;
      patch?: Partial<Question> & Record<string, any>;
      validation?: Record<string, any>;
    }
  | {
      type: "updateValidation";
      id?: string;
      patch?: Partial<QuestionValidation> & Record<string, any>;
      validation?: Record<string, any>;
    }
  | { type: "updateSection"; id?: string; patch?: Partial<Section> & Record<string, any> }
  | { type: "updateForm"; patch?: Partial<BuilderForm> & Record<string, any> }
  | {
      type: "addQuestion";
      sectionId?: string;
      questionType: QuestionType;
      label?: string;
      description?: string;
      placeholder?: string;
      required?: boolean;
      options?: Array<{ id: string; label: string }>;
      validation?: Record<string, any>;
      patch?: Record<string, any>;
    }
  | { type: "deleteQuestion"; id?: string }
  | { type: "addSection"; title?: string; description?: string }
  | { type: "deleteSection"; id?: string };

export interface BuilderChatPayload {
  formId: string;
  messages: ConversationMessage[];
  userMessage: string;
  formContext: {
    form: {
      title: string;
      description?: string;
    };
    sections: Array<{
      id: string;
      title?: string;
      description?: string;
      position: number;
    }>;
    questions: Array<{
      id: string;
      sectionId: string;
      type: string;
      label: string;
      description?: string;
      placeholder?: string;
      required: boolean;
      position: number;
      options?: Array<{ id: string; label: string }>;
      validation?: Record<string, unknown>;
    }>;
    selectedElement?: {
      type: "form" | "section" | "question";
      id: string;
    } | null;
  };
}

export interface SSEBuilderEvent {
  delta: string;
  done: boolean;
  actions?: BuilderAction[];
  error?: string;
}

/**
 * Sends one turn to POST /api/ai/builder/turn and yields
 * parsed SSE events.
 */
export async function* streamBuilderChatTurn(
  payload: BuilderChatPayload,
  signal?: AbortSignal,
): AsyncGenerator<SSEBuilderEvent, void, unknown> {
  const res = await fetch(`${BACKEND_URL}/api/ai/builder/turn`, {
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
    let message = `AI builder request failed (${res.status})`;
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
            const event = JSON.parse(jsonStr) as SSEBuilderEvent;
            yield event;
          } catch {
            console.warn("[ai-builder] Skipping malformed SSE chunk:", jsonStr);
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
          const event = JSON.parse(jsonStr) as SSEBuilderEvent;
          yield event;
        } catch {
          console.warn("[ai-builder] Skipping final malformed SSE chunk:", jsonStr);
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
