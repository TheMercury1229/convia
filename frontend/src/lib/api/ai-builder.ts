/**
 * lib/api/ai-builder.ts
 * ---------------------
 * Client-side API helper for the Grizzy Builder Chat streaming endpoint.
 *
 * SSE wire protocol:
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
import { ssePost, BACKEND_URL } from "./sse-reader";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Stream function
// ---------------------------------------------------------------------------

/**
 * Sends one turn to POST /api/ai/builder/turn and yields parsed SSE events.
 */
export function streamBuilderChatTurn(
  payload: BuilderChatPayload,
  signal?: AbortSignal,
): AsyncGenerator<SSEBuilderEvent, void, unknown> {
  return ssePost<SSEBuilderEvent>({
    url: `${BACKEND_URL}/api/ai/builder/turn`,
    body: payload,
    signal,
    label: "ai-builder",
  });
}
