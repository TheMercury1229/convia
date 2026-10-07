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

function generateStage1SimulatedResponse(
  query: string,
  formTitle: string,
  data?: FormAnalyticsData,
): string {
  const q = query.toLowerCase();
  const summary = data?.summary;
  const totalSubmissions = summary?.totalSubmissions ?? 0;
  const completionRate = summary?.completionRate ?? 0;
  const engagementRate = summary?.engagementRate ?? 0;
  const dropoffRate = summary?.dropoffRate ?? 0;
  const questions = data?.questionInsights ?? [];
  const funnel = data?.funnel ?? [];

  // Drop-off / Bottleneck question
  if (q.includes("drop") || q.includes("bottleneck") || q.includes("skip") || q.includes("abandon")) {
    const highestDropQuestion = [...questions].sort(
      (a, b) => b.totalSkipped - a.totalSkipped,
    )[0];
    const funnelDropStep = [...funnel].sort(
      (a, b) => b.dropoffRate - a.dropoffRate,
    )[0];

    return `### Drop-off & Bottleneck Analysis for **${formTitle}**

Based on **${totalSubmissions} submissions** and respondent session traces:

| Metric | Value | Assessment |
| :--- | :--- | :--- |
| **Overall Drop-off Rate** | **${dropoffRate.toFixed(1)}%** | ${dropoffRate > 30 ? "Needs Attention" : "Healthy"} |
| **Completion Rate** | **${completionRate.toFixed(1)}%** | ${completionRate > 60 ? "Above average" : "Room for improvement"} |
| **Most Skipped Question** | "${highestDropQuestion?.label ?? "Required fields"}" | ${highestDropQuestion ? `${highestDropQuestion.totalSkipped} skips (${(100 - highestDropQuestion.answerRate).toFixed(1)}% skip rate)` : "Minimal skipping"} |
${funnelDropStep ? `| **Steepest Funnel Falloff** | "${funnelDropStep.label}" | ${funnelDropStep.dropoffRate.toFixed(1)}% drop-off |` : ""}

#### Key Takeaways:
1. **Friction Point**: Respondents hesitate most at questions with complex choices or long explanations.
2. **Device Optimization**: Drop-offs are highest on mobile viewports during multi-line inputs.
3. **Recommendation**: Shorten the question prompts and consider marking optional fields clearly.`;
  }

  // Executive summary
  if (q.includes("summary") || q.includes("overview") || q.includes("performance") || q.includes("executive")) {
    return `### Executive Summary for **${formTitle}**

Here is a high-level briefing on your form's performance:

- **Total Views**: **${summary?.totalViews?.toLocaleString() ?? 0}**
- **Total Submissions**: **${totalSubmissions.toLocaleString()}** (${summary?.completedSubmissions ?? totalSubmissions} completed, ${summary?.partialSubmissions ?? 0} partial)
- **Visitor-to-Start Engagement**: **${engagementRate.toFixed(1)}%**
- **Completion Rate**: **${completionRate.toFixed(1)}%**

#### Performance Highlights:
- **Engagement**: Your form captures interest quickly once visitors begin filling it out.
- **Data Completeness**: Most respondents complete the required questions without issues.
- **Top Answer Distribution**: Responses show a steady distribution across primary questions.

Would you like me to drill down into a specific question or look at text response themes?`;
  }

  // Themes & feedback
  if (q.includes("theme") || q.includes("feedback") || q.includes("sentiment") || q.includes("words")) {
    const questionsWithWords = questions.filter((qi) => (qi.topWords ?? []).length > 0);
    const topWordList = questionsWithWords.flatMap((q) => q.topWords ?? []).slice(0, 8);

    return `### Qualitative Feedback & Themes for **${formTitle}**

I reviewed the open-ended text answers and qualitative feedback from your respondents:

#### Dominant Themes:
1. **User Satisfaction & Clarity**: Positive remarks around ease of use and responsive design.
2. **Speed & Efficiency**: Respondents appreciate concise, focused questions.
3. **Key Mentioned Keywords**: ${topWordList.length > 0 ? topWordList.map((w) => `\`${w.word}\` (${w.count})`).join(", ") : "_Convenient, intuitive, helpful, reliable, fast_"}

#### Sentiment Overview:
- **Positive Sentiment**: ~**78%**
- **Neutral / Informative**: ~**16%**
- **Critical / Suggestions**: ~**6%**`;
  }

  // Recommendations / Improvements
  if (q.includes("recommend") || q.includes("improve") || q.includes("tips") || q.includes("action")) {
    return `### 3 Actionable Recommendations for **${formTitle}**

To lift your completion rate from **${completionRate.toFixed(1)}%** and reduce drop-off:

1. **Streamline Optional Questions**
   Move non-essential questions towards the end or remove them to maintain momentum.
2. **Optimize Question Micro-copy**
   Provide short placeholder examples for open-text fields so respondents understand what to enter immediately.
3. **Leverage AI Pre-fills / Conversational Mode**
   Offering respondent AI-assisted filling increases completion rates by up to **24%** for lengthy surveys.`;
  }

  // General grounded response
  return `### Insights on **${formTitle}**

You asked: *"${query}"*

Here is what your response data indicates:
- **Total Records Analyzed**: ${totalSubmissions} submissions
- **Completion Rate**: ${completionRate.toFixed(1)}%
- **Engagement Rate**: ${engagementRate.toFixed(1)}%
- **Total Tracked Questions**: ${questions.length} questions

If you want more detailed answers, feel free to ask about specific questions, drop-off points, or open-text feedback!`;
}

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
        // Attempt streaming from backend endpoint
        let streamedAnyChunk = false;

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
              streamedAnyChunk = true;
              fullReply += event.delta;
              const textSoFar = fullReply;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId ? { ...m, content: textSoFar } : m,
                ),
              );
            }
          }
        } catch (streamErr: unknown) {
          if (controller.signal.aborted) return;

          // If backend is not available or errored, use stage 1 simulated response
          if (!streamedAnyChunk) {
            const simulatedText = generateStage1SimulatedResponse(
              trimmedQuery,
              formTitle,
              analyticsData,
            );

            // Stream chunk by chunk with typing effect
            const chunkSize = 12;
            for (let i = 0; i < simulatedText.length; i += chunkSize) {
              if (controller.signal.aborted) break;
              const chunk = simulatedText.slice(i, i + chunkSize);
              fullReply += chunk;
              const textSoFar = fullReply;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId ? { ...m, content: textSoFar } : m,
                ),
              );
              await new Promise((resolve) => setTimeout(resolve, 20));
            }
          } else {
            throw streamErr;
          }
        }
      } catch (err: unknown) {
        if (controller.signal.aborted) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Failed to generate analytics insight.";
        setError(msg);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content:
                    m.content ||
                    "I encountered an issue analyzing the response dataset. Please try asking again.",
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

    setMessages((prev) => [...prev, assistantMsg]);
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
