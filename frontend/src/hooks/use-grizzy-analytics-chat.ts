"use client";

import * as React from "react";
import type { FormAnalyticsData } from "@/lib/api/analytics";
import {
  streamAnalyzeResponsesTurn,
  type AnalyzeResponsesTurnPayload,
  type ConversationMessage,
  type QuestionContextItem,
  type QuestionInsightContext,
  type RawResponseContext,
} from "@/lib/api/ai-analytics";

export interface GrizzyChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
  isError?: boolean;
  errorMessage?: string;
}

export interface QuestionSuggestion {
  id: string;
  title: string;
  query: string;
  iconType: "dropoff" | "summary" | "feedback" | "trend" | "recommendation";
}

export interface UseGrizzyAnalyticsChatProps {
  formId: string;
  formTitle: string;
  analyticsData?: FormAnalyticsData;
  recentResponses?: RawResponseContext[];
}

export interface UseGrizzyAnalyticsChatReturn {
  messages: GrizzyChatMessage[];
  isStreaming: boolean;
  error: string | null;
  suggestions: QuestionSuggestion[];
  sendMessage: (query: string) => void;
  retryLastMessage: () => void;
  clearChat: () => void;
}

export const DEFAULT_SUGGESTIONS: QuestionSuggestion[] = [
  {
    id: "dropoff",
    title: "Drop-off points",
    query: "Where are respondents dropping off the most?",
    iconType: "dropoff",
  },
  {
    id: "summary",
    title: "Executive summary",
    query: "Give me an executive summary of this form's performance.",
    iconType: "summary",
  },
  {
    id: "feedback",
    title: "Response themes",
    query: "Summarize the key themes and patterns from response feedback.",
    iconType: "feedback",
  },
  {
    id: "recommendations",
    title: "Recommendations",
    query: "What recommendations do you have to improve completion rate?",
    iconType: "recommendation",
  },
];

export function useGrizzyAnalyticsChat({
  formId,
  formTitle,
  analyticsData,
  recentResponses = [],
}: UseGrizzyAnalyticsChatProps): UseGrizzyAnalyticsChatReturn {
  const initialWelcomeText = React.useMemo(() => {
    const totalSubmissions = analyticsData?.summary?.totalSubmissions ?? 0;
    const completionRate = analyticsData?.summary?.completionRate ?? 0;
    const questionsCount = analyticsData?.questionInsights?.length ?? 0;

    return `Hi! I'm Grizzy, your analytics assistant for **${formTitle || "this form"}**.

I've analyzed your **${totalSubmissions} response${totalSubmissions === 1 ? "" : "s"}**${questionsCount > 0 ? ` across **${questionsCount} questions**` : ""}${completionRate > 0 ? ` (${completionRate.toFixed(1)}% completion rate)` : ""}.

You can ask me to analyze drop-offs, summarize responses, or identify feedback themes. Choose a suggestion below or ask any question.`;
  }, [formTitle, analyticsData]);

  const [messages, setMessages] = React.useState<GrizzyChatMessage[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content: initialWelcomeText,
      timestamp: new Date(),
    },
  ]);

  const [isStreaming, setIsStreaming] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const lastUserMessageRef = React.useRef<string | null>(null);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  // Revalidate & reset chat whenever the active form changes
  const prevFormIdRef = React.useRef(formId);
  React.useEffect(() => {
    if (prevFormIdRef.current !== formId) {
      prevFormIdRef.current = formId;
      abortControllerRef.current?.abort();
      setIsStreaming(false);
      setError(null);
      setMessages([
        {
          id: `welcome-${Date.now()}`,
          role: "assistant",
          content: initialWelcomeText,
          timestamp: new Date(),
        },
      ]);
    } else {
      // If same formId but welcome text updated as analytics data loaded
      setMessages((prev) => {
        if (prev.length === 1 && prev[0].id.startsWith("welcome")) {
          return [
            {
              id: prev[0].id,
              role: "assistant",
              content: initialWelcomeText,
              timestamp: new Date(),
            },
          ];
        }
        return prev;
      });
    }
  }, [formId, initialWelcomeText]);

  // Clean up on unmount
  React.useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  const executeTurn = React.useCallback(
    async (trimmedQuery: string, assistantMsgId: string) => {
      lastUserMessageRef.current = trimmedQuery;
      setError(null);
      setIsStreaming(true);

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Prepare context for backend
      const questionContext: QuestionContextItem[] = (
        analyticsData?.questionInsights ?? []
      ).map((q) => ({
        id: q.questionId,
        label: q.label,
        type: q.type,
        isRequired: q.isRequired ?? false,
      }));

      const statsContext = {
        totalViews: analyticsData?.summary?.totalViews ?? 0,
        totalSubmissions: analyticsData?.summary?.totalSubmissions ?? 0,
        completedSubmissions:
          analyticsData?.summary?.completedSubmissions ??
          analyticsData?.summary?.totalSubmissions ??
          0,
        partialSubmissions: analyticsData?.summary?.partialSubmissions ?? 0,
        completionRate: analyticsData?.summary?.completionRate ?? 0,
        engagementRate: analyticsData?.summary?.engagementRate ?? 0,
        dropoffRate: analyticsData?.summary?.dropoffRate ?? 0,
        lastSubmissionAt: analyticsData?.summary?.lastSubmissionAt ?? null,
        questionInsights: (analyticsData?.questionInsights ?? []).map(
          (qi): QuestionInsightContext => ({
            questionId: qi.questionId,
            label: qi.label,
            type: qi.type,
            totalAnswered: qi.totalAnswered,
            totalSkipped: qi.totalSkipped,
            answerRate: qi.answerRate,
            distribution: qi.distribution,
            averageScore: qi.averageScore,
            topWords: qi.topWords,
          }),
        ),
      };

      const historyMessages: ConversationMessage[] = messages
        .filter((m) => m.id !== "welcome-1")
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const payload: AnalyzeResponsesTurnPayload = {
        formId,
        messages: historyMessages,
        userMessage: trimmedQuery,
        analyticsContext: {
          formTitle: formTitle || "Untitled Form",
          formDescription: "",
          questions: questionContext,
          stats: statsContext,
          recentResponses,
        },
      };

      let fullReply = "";

      try {
        for await (const event of streamAnalyzeResponsesTurn(
          payload,
          controller.signal,
        )) {
          if (controller.signal.aborted) break;

          if (event.error) {
            throw new Error(event.error);
          }

          if (event.delta) {
            fullReply += event.delta;
            const textSoFar = fullReply;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, content: textSoFar } : m,
              ),
            );
          }
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        const rawMsg =
          err instanceof Error
            ? err.message
            : "Failed to generate analytics insight.";
        const msg =
          rawMsg === "Failed to fetch"
            ? "Unable to reach server. Please check your connection and try again."
            : rawMsg;

        setError(msg);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  isError: true,
                  errorMessage: msg,
                  content: fullReply,
                }
              : m,
          ),
        );
      } finally {
        setIsStreaming(false);
      }
    },
    [formId, formTitle, analyticsData, recentResponses, messages],
  );

  const sendMessage = React.useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (!trimmed || isStreaming) return;

      const userMsg: GrizzyChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: trimmed,
        timestamp: new Date(),
      };

      const assistantMsgId = `ai-${Date.now()}`;
      const assistantMsg: GrizzyChatMessage = {
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

  const retryLastMessage = React.useCallback(() => {
    if (!lastUserMessageRef.current || isStreaming) return;
    const query = lastUserMessageRef.current;
    const assistantMsgId = `ai-${Date.now()}`;
    const assistantMsg: GrizzyChatMessage = {
      id: assistantMsgId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant" && last.isError) {
        return [...prev.slice(0, -1), assistantMsg];
      }
      return [...prev, assistantMsg];
    });
    executeTurn(query, assistantMsgId);
  }, [isStreaming, executeTurn]);

  const clearChat = React.useCallback(() => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setError(null);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: "assistant",
        content: initialWelcomeText,
        timestamp: new Date(),
      },
    ]);
  }, [initialWelcomeText]);

  return {
    messages,
    isStreaming,
    error,
    suggestions: DEFAULT_SUGGESTIONS,
    sendMessage,
    retryLastMessage,
    clearChat,
  };
}
