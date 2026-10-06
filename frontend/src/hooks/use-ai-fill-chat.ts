"use client";

/**
 * hooks/use-ai-fill-chat.ts
 * ---------------------------
 * Custom hook that manages the full lifecycle of the AI fill-form chat:
 *
 *  1. Chat message state (messages array)
 *  2. SSE streaming — calls the backend, accumulates deltas into an
 *     assistant message that updates in real-time ("typing" effect)
 *  3. Answer extraction — merges extracted answers from each turn
 *  4. Conversation history — maintains the `messages` array sent to
 *     the backend on every turn so the LLM has full context
 *  5. Abort support — cancels in-flight streams when unmounting or
 *     when a new message is sent before the prior stream finishes
 */

import * as React from "react";
import {
  streamFillFormTurn,
  type FillFormTurnPayload,
} from "@/lib/api/ai-fill";
import { getOrCreateSessionId } from "@/lib/api/analytics";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
}

export interface UseAiFillChatOptions {
  formId: string;
  isPreview?: boolean;
  initialAnswers?: Record<string, unknown>;
  initialMessages?: ChatMessage[];
  onExtractedAnswers?: (answers: Record<string, unknown>) => void;
  onComplete?: (filledAnswers: Record<string, unknown>) => void;
}

export interface UseAiFillChatReturn {
  messages: ChatMessage[];
  isStreaming: boolean;
  isComplete: boolean;
  error: string | null;
  filledAnswers: Record<string, unknown>;
  sendMessage: (text: string) => void;
  retryLastMessage: () => void;
  clearError: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAiFillChat({
  formId,
  isPreview = false,
  initialAnswers,
  initialMessages,
  onExtractedAnswers,
  onComplete,
}: UseAiFillChatOptions): UseAiFillChatReturn {
  // All accumulated answers across turns
  const filledAnswersRef = React.useRef<Record<string, unknown>>(initialAnswers ?? {});
  const [filledAnswers, setFilledAnswers] = React.useState<Record<string, unknown>>(
    initialAnswers ?? {},
  );

  // Keep filledAnswers in sync if initialAnswers changes from outside
  React.useEffect(() => {
    if (initialAnswers) {
      filledAnswersRef.current = {
        ...initialAnswers,
        ...filledAnswersRef.current,
      };
      setFilledAnswers((prev) => ({
        ...initialAnswers,
        ...prev,
      }));
    }
  }, [initialAnswers]);

  // Conversation history sent to backend (role + content only, no IDs)
  const historyRef = React.useRef<
    Array<{ role: "user" | "assistant"; content: string }>
  >(
    initialMessages && initialMessages.length > 0
      ? initialMessages.map((m) => ({ role: m.role, content: m.content }))
      : [],
  );

  // Session ID for analytics
  const sessionIdRef = React.useRef("");

  // Chat UI state
  const [messages, setMessages] = React.useState<ChatMessage[]>(
    initialMessages ?? [],
  );
  const [isStreaming, setIsStreaming] = React.useState(false);
  const [isComplete, setIsComplete] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Track the last user message for easy retry
  const lastUserMessageRef = React.useRef<string | null>(null);

  // AbortController for cancelling in-flight streams
  const abortRef = React.useRef<AbortController | null>(null);

  // Ensure session ID is ready
  React.useEffect(() => {
    if (!isPreview && typeof window !== "undefined") {
      sessionIdRef.current = getOrCreateSessionId(formId);
    }
  }, [formId, isPreview]);

  // Cleanup on unmount — abort any active stream
  React.useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // executeTurn (internal helper)
  // ---------------------------------------------------------------------------
  const executeTurn = React.useCallback(
    (trimmed: string, assistantMsgId: string) => {
      lastUserMessageRef.current = trimmed;
      setError(null);

      // Abort any prior in-flight stream
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setIsStreaming(true);

      const payload: FillFormTurnPayload = {
        formId,
        sessionId: sessionIdRef.current,
        messages: historyRef.current,
        userMessage: trimmed,
        filledAnswers: filledAnswersRef.current,
      };

      (async () => {
        let fullReply = "";

        try {
          if (isPreview) {
            // In preview mode, simulate a helpful mock response
            const mockReply =
              "I'm currently in preview mode, so I can't save your responses to the database. Feel free to test chatting with me or switch to the Standard Form view! 🐻";
            fullReply = mockReply;

            for (let i = 0; i < mockReply.length; i += 4) {
              if (controller.signal.aborted) break;
              const chunk = mockReply.slice(i, i + 4);
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: m.content + chunk }
                    : m,
                ),
              );
              await new Promise((r) => setTimeout(r, 15));
            }
          } else {
            for await (const event of streamFillFormTurn(
              payload,
              controller.signal,
            )) {
              if (controller.signal.aborted) break;

              // Handle error events from the AI backend
              if (event.error) {
                setError(event.error);
                setMessages((prev) =>
                  prev.filter((m) => m.id !== assistantMsgId),
                );
                break;
              }

              // Append delta to the streaming assistant message
              if (event.delta) {
                fullReply += event.delta;
                const updatedReply = fullReply;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId
                      ? { ...m, content: updatedReply }
                      : m,
                  ),
                );
              }

              // On the final event, merge extracted answers
              if (event.done && !event.error) {
                if (
                  event.extracted &&
                  Object.keys(event.extracted).length > 0
                ) {
                  const newAnswers = {
                    ...filledAnswersRef.current,
                    ...event.extracted,
                  };
                  filledAnswersRef.current = newAnswers;
                  setFilledAnswers(newAnswers);
                  onExtractedAnswers?.(newAnswers);
                }

                if (typeof event.is_complete === "boolean") {
                  setIsComplete(event.is_complete);
                  if (event.is_complete) {
                    onComplete?.(filledAnswersRef.current);
                  }
                }
              }
            }
          }

          // Update conversation history for the next turn
          if (fullReply && !controller.signal.aborted) {
            historyRef.current = [
              ...historyRef.current,
              { role: "user" as const, content: trimmed },
              { role: "assistant" as const, content: fullReply },
            ];
          }
        } catch (err: unknown) {
          if (err instanceof Error && err.name === "AbortError") {
            return;
          }
          const msg =
            err instanceof Error ? err.message : "Something went wrong";
          setError(msg);

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? {
                    ...m,
                    content:
                      m.content ||
                      "Sorry, I had trouble reaching the AI server. Please check your connection and try again.",
                  }
                : m,
            ),
          );
        } finally {
          setIsStreaming(false);
        }
      })();
    },
    [formId, isPreview, onExtractedAnswers, onComplete],
  );

  // ---------------------------------------------------------------------------
  // sendMessage
  // ---------------------------------------------------------------------------
  const sendMessage = React.useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      // 1. Add user message
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };

      // 2. Add assistant placeholder
      const assistantMsgId = `ai-${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantMsgId,
        role: "assistant",
        content: "",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      executeTurn(trimmed, assistantMsgId);
    },
    [isStreaming, executeTurn],
  );

  // ---------------------------------------------------------------------------
  // retryLastMessage
  // ---------------------------------------------------------------------------
  const retryLastMessage = React.useCallback(() => {
    if (!lastUserMessageRef.current || isStreaming) return;
    const trimmed = lastUserMessageRef.current;

    const assistantMsgId = `ai-${Date.now()}`;
    const assistantMsg: ChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMsg]);
    executeTurn(trimmed, assistantMsgId);
  }, [isStreaming, executeTurn]);

  const clearError = React.useCallback(() => setError(null), []);

  return {
    messages,
    isStreaming,
    isComplete,
    error,
    filledAnswers,
    sendMessage,
    retryLastMessage,
    clearError,
  };
}
