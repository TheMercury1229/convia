"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, Eye, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormLoadingScreen } from "./form-loading-screen";
import { ViewerCompletion } from "./viewer-completion";
import { ViewerQuestion } from "./viewer-question";
import { ViewerWelcome } from "./viewer-welcome";
import { FormUnavailableState } from "./form-unavailable-state";
import { AiFillChat } from "./ai-fill-chat";
import type { FormWithSections } from "@/lib/api/forms";
import type { Question } from "@/types/builder";
import { getFormTheme, type FormThemeResolved } from "@/lib/builder-themes";
import { apiQuestionToClientQuestion } from "@/lib/form-model";
import { validateQuestionAnswer } from "@/lib/validations/question-validator";
import { submitResponse } from "@/lib/api/responses";
import { useFormAnalyticsSession } from "@/hooks/use-form-analytics-session";
import type { FlatQuestionItem } from "./viewer-types";

interface FormViewerProps {
  form: FormWithSections;
  isPreview?: boolean;
}

export function FormViewer({ form, isPreview = false }: FormViewerProps) {
  const [isDark, setIsDark] = React.useState(false);
  const [isWelcomeScreen, setIsWelcomeScreen] = React.useState(true);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, unknown>>({});
  const answersRef = React.useRef<Record<string, unknown>>({});
  const [currentError, setCurrentError] = React.useState<string | null>(null);
  const [isCompleted, setIsCompleted] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [shake, setShake] = React.useState(false);
  const [submissionError, setSubmissionError] = React.useState<string | null>(null);
  const [mode, setMode] = React.useState<"normal" | "ai" | "review">("normal");

  answersRef.current = answers;

  React.useEffect(() => {
    setIsDark(window.matchMedia("(prefers-color-scheme: dark)").matches);
  }, []);

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    return () => {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "";
    };
  }, [isDark]);

  const theme = React.useMemo<FormThemeResolved>(
    () => getFormTheme(form.themeId ?? "nova", isDark),
    [form.themeId, isDark],
  );

  const rootStyle = React.useMemo<React.CSSProperties>(() => {
    return {
      "--background": theme.colors.canvasBg,
      "--foreground": theme.colors.cardText,
      "--card": theme.colors.cardBg,
      "--card-foreground": theme.colors.cardText,
      "--popover": theme.colors.cardBg,
      "--popover-foreground": theme.colors.cardText,
      "--primary": theme.colors.primary,
      "--primary-foreground": theme.colors.primaryForeground,
      "--secondary": theme.colors.cardInputBg,
      "--secondary-foreground": theme.colors.cardText,
      "--muted": theme.colors.cardInputBg,
      "--muted-foreground": theme.colors.cardMuted,
      "--accent": `color-mix(in oklch, ${theme.colors.primary} 12%, transparent)`,
      "--accent-foreground": theme.colors.cardText,
      "--border": theme.colors.cardBorder,
      "--input": theme.colors.cardInputBorder,
      "--ring": theme.colors.cardRingSelected || theme.colors.primary,
      backgroundColor: theme.colors.canvasBg,
      color: theme.colors.cardText,
      colorScheme: isDark ? "dark" : "light",
    } as React.CSSProperties;
  }, [theme, isDark]);

  const flatQuestions = React.useMemo<FlatQuestionItem[]>(() => {
    const sections = [...(form.sections || [])].sort((a, b) => a.position - b.position);
    const items: FlatQuestionItem[] = [];
    let questionIndex = 0;

    for (const [sectionIndex, section] of sections.entries()) {
      const questions = [...(section.questions || [])].sort((a, b) => a.position - b.position);
      let pendingHeadings: { id: string; label: string; description?: string | null }[] = [];
      let isFirstActualQuestion = true;

      for (const question of questions) {
        const clientQ = apiQuestionToClientQuestion(question, false);
        if (clientQ.type === "heading") {
          pendingHeadings.push({
            id: clientQ.id,
            label: clientQ.label || "",
            description: clientQ.description || null,
          });
        } else {
          items.push({
            question: clientQ,
            sectionTitle: section.title,
            sectionDescription: section.description,
            questionIndex: questionIndex++,
            sectionIndex,
            isFirstQuestionOfSection: isFirstActualQuestion,
            totalQuestions: 0,
            totalSections: sections.length,
            attachedHeadings: pendingHeadings.length > 0 ? [...pendingHeadings] : undefined,
          });
          pendingHeadings = [];
          isFirstActualQuestion = false;
        }
      }

      if (pendingHeadings.length > 0 && items.length > 0) {
        const lastItem = items[items.length - 1];
        lastItem.attachedHeadings = [
          ...(lastItem.attachedHeadings || []),
          ...pendingHeadings,
        ];
      }
    }

    return items.map((item) => ({ ...item, totalQuestions: items.length }));
  }, [form.sections]);

  const totalQuestions = flatQuestions.length;
  const currentItem = flatQuestions[currentIndex];
  const isMultiline = currentItem?.question.type === "textarea" || currentItem?.question.type === "paragraph";

  const { sessionIdRef, startSession } = useFormAnalyticsSession({
    formId: form.id,
    isPreview,
    currentIndex,
    isWelcomeScreen,
    isCompleted,
  });

  const triggerShake = (message: string) => {
    setCurrentError(message);
    setShake(true);
    window.setTimeout(() => setShake(false), 500);
  };

  const handleStartForm = () => {
    setIsWelcomeScreen(false);
    setMode("normal");
    startSession();
  };

  const handleStartAi = () => {
    if (isPreview) return;
    setIsWelcomeScreen(false);
    setMode("ai");
    startSession();
  };

  const handleSwitchToManual = () => {
    setMode("normal");
    setIsWelcomeScreen(false);
  };

  const handleAnswerChangeById = (questionId: string, value: unknown) => {
    answersRef.current = { ...answersRef.current, [questionId]: value };
    setAnswers((previous) => ({ ...previous, [questionId]: value }));
    setCurrentError(null);
  };

  const handleAnswerChange = (value: unknown) => {
    if (!currentItem) return;
    handleAnswerChangeById(currentItem.question.id, value);
  };

  const submitCurrentResponse = async () => {
    // Validate all required fields
    for (const item of flatQuestions) {
      const val = answersRef.current[item.question.id];
      const validation = validateQuestionAnswer(item.question, val);
      if (!validation.isValid) {
        const errorMsg = validation.error || `Please answer "${item.question.label}" to proceed.`;
        triggerShake(errorMsg);
        return;
      }
    }

    setIsSubmitting(true);
    setSubmissionError(null);
    if (isPreview) {
      window.setTimeout(() => {
        setIsSubmitting(false);
        setIsCompleted(true);
      }, 1200);
      return;
    }

    try {
      const response = Object.entries(answersRef.current).map(([questionId, value]) => ({ questionId, value }));
      await submitResponse(form.id, { answers: response, sessionId: sessionIdRef.current });
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(`convia_session_${form.id}`);
      }
      setIsSubmitting(false);
      setIsCompleted(true);
    } catch (error) {
      setIsSubmitting(false);
      const errorMessage = error instanceof Error ? error.message : "Failed to submit response. Please try again.";
      setSubmissionError(errorMessage);
      triggerShake(errorMessage);
    }
  };

  const handleNext = (explicitAnswer?: unknown) => {
    if (!currentItem) return;

    const isEvent = Boolean(
      explicitAnswer &&
        typeof explicitAnswer === "object" &&
        ("nativeEvent" in explicitAnswer || "preventDefault" in explicitAnswer || "_reactName" in explicitAnswer || "target" in explicitAnswer),
    );
    const hasExplicitAnswer = explicitAnswer !== undefined && !isEvent;
    const answer = hasExplicitAnswer ? explicitAnswer : answersRef.current[currentItem.question.id];

    if (hasExplicitAnswer) handleAnswerChange(explicitAnswer);

    const validation = validateQuestionAnswer(currentItem.question, answer);
    if (!validation.isValid) {
      triggerShake(validation.error || "Please answer this question to proceed.");
      return;
    }

    setCurrentError(null);
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((index) => index + 1);
    } else {
      void submitCurrentResponse();
    }
  };

  const handlePrevious = () => {
    setCurrentError(null);
    if (currentIndex > 0) {
      setCurrentIndex((index) => index - 1);
    } else if (!isWelcomeScreen) {
      setIsWelcomeScreen(true);
    }
  };

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (mode === "ai") return;
      const target = event.target as HTMLElement;
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);

      if ((event.key === "d" || event.key === "D") && !isInput) {
        event.preventDefault();
        setIsDark((dark) => !dark);
        return;
      }
      if (isWelcomeScreen) {
        if (event.key === "Enter" || event.key === "ArrowDown") {
          event.preventDefault();
          handleStartForm();
        }
        return;
      }
      if (event.key === "ArrowDown" && target.tagName !== "TEXTAREA") {
        event.preventDefault();
        handleNext();
      } else if (event.key === "ArrowUp" && target.tagName !== "TEXTAREA") {
        event.preventDefault();
        handlePrevious();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  if (totalQuestions === 0) {
    return (
      <FormUnavailableState
        reason="empty"
        formTitle={form.title}
        formDescription={form.description}
        formId={form.id}
        theme={theme}
        isPreview={isPreview}
        isDark={isDark}
        onToggleDark={() => setIsDark((dark) => !dark)}
      />
    );
  }

  if (submissionError) {
    return (
      <FormUnavailableState
        reason="submission-failed"
        formTitle={form.title}
        errorMessage={submissionError}
        formId={form.id}
        theme={theme}
        isPreview={isPreview}
        isDark={isDark}
        onToggleDark={() => setIsDark((dark) => !dark)}
        onRetry={() => {
          setSubmissionError(null);
          void submitCurrentResponse();
        }}
        onReviewAnswers={() => {
          setSubmissionError(null);
          setMode("normal");
          setCurrentIndex(Math.max(0, totalQuestions - 1));
        }}
      />
    );
  }

  if (isSubmitting) {
    return <FormLoadingScreen backgroundColor={theme.colors.canvasBg} textColor={theme.colors.cardText} isDark={isDark} />;
  }

  if (isCompleted) {
    return (
      <ViewerCompletion
        form={form}
        theme={theme}
        isPreview={isPreview}
        isDark={isDark}
        onRestart={() => {
          if (typeof window !== "undefined") {
            sessionStorage.removeItem(`convia_session_${form.id}`);
          }
          setIsCompleted(false);
          setIsWelcomeScreen(true);
          setMode("normal");
          setCurrentIndex(0);
          setCurrentError(null);
          setAnswers({});
        }}
      />
    );
  }

  if (mode === "ai") {
    return (
      <div style={rootStyle} className="h-screen w-full">
        <AiFillChat
          form={form}
          theme={theme}
          isDark={isDark}
          onToggleDark={() => setIsDark((dark) => !dark)}
          onSwitchToManual={handleSwitchToManual}
          isPreview={isPreview}
          initialAnswers={answers}
          onAnswersUpdate={(newAnswers) => {
            answersRef.current = newAnswers;
            setAnswers(newAnswers);
          }}
          onSubmitResponse={async (finalAnswers) => {
            if (finalAnswers) {
              answersRef.current = { ...answersRef.current, ...finalAnswers };
              setAnswers(answersRef.current);
            }
            await submitCurrentResponse();
          }}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  }

  const progressPercent = isWelcomeScreen ? 0 : Math.round(((currentIndex + (isCompleted ? 1 : 0)) / totalQuestions) * 100);
  const isLastQuestion = currentIndex === totalQuestions - 1;

  return (
    <div
      className="relative flex min-h-screen flex-col select-none transition-colors duration-300 overflow-x-hidden min-w-0"
      style={rootStyle}
    >
      {/* Top Progress Bar */}
      <div
        className="fixed left-0 right-0 top-0 z-50 h-1 transition-colors duration-300"
        style={{
          backgroundColor: `color-mix(in oklch, ${theme.colors.cardBorder} 40%, transparent)`,
        }}
      >
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: theme.colors.primary,
          }}
        />
      </div>

      {/* Header */}
      <header
        className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between border-b px-4 backdrop-blur-md transition-colors duration-300 sm:px-8"
        style={{
          backgroundColor: `color-mix(in oklch, ${theme.colors.canvasBg} 85%, transparent)`,
          borderBottomColor: `color-mix(in oklch, ${theme.colors.cardBorder} 60%, transparent)`,
        }}
      >
        <div>
          {isPreview && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium shadow-2xs"
              style={{
                backgroundColor: theme.colors.badgeBg,
                color: theme.colors.badgeText,
                borderColor: theme.colors.cardInputBorder,
              }}
            >
              <Eye className="size-3" />
              Preview
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {!isWelcomeScreen && !isPreview && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMode("ai")}
              className="hidden sm:inline-flex items-center rounded-full px-3 py-1 text-xs font-medium shadow-2xs transition-all hover:scale-[1.02]"
              style={{
                backgroundColor: theme.colors.cardInputBg,
                borderColor: theme.colors.cardInputBorder,
                color: theme.colors.cardText,
              }}
              title="Switch to Fill with Grizzy"
            >
              Fill with AI
            </Button>
          )}
          {!isWelcomeScreen && currentItem && (
            <span
              className="text-xs font-mono font-medium"
              style={{ color: theme.colors.cardMuted }}
            >
              Question {currentIndex + 1} / {totalQuestions}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsDark((dark) => !dark)}
            className="size-8 rounded-lg transition-colors hover:opacity-80"
            style={{
              color: theme.colors.cardText,
              backgroundColor: "transparent",
            }}
            aria-label="Toggle dark/light mode"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8 sm:py-12 min-w-0 max-w-full overflow-hidden">
        <div className="mx-auto w-full max-w-2xl min-w-0">
          {isWelcomeScreen ? (
            <ViewerWelcome
              form={form}
              theme={theme}
              isPreview={isPreview}
              onStart={handleStartForm}
              onFillWithAi={isPreview ? undefined : handleStartAi}
            />
          ) : currentItem ? (
            <ViewerQuestion
              item={currentItem}
              theme={theme}
              isDark={isDark}
              currentIndex={currentIndex}
              isLastQuestion={isLastQuestion}
              isMultiline={Boolean(isMultiline)}
              value={answers[currentItem.question.id]}
              error={currentError}
              shake={shake}
              onAnswerChange={handleAnswerChange}
              onNext={handleNext}
            />
          ) : null}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-6 py-4 text-center">
        <span
          className="text-xs font-medium tracking-wide transition-colors"
          style={{ color: theme.colors.cardMuted }}
        >
          powered by{" "}
          <strong style={{ color: theme.colors.cardText }}>convia</strong>
        </span>
      </footer>

      {/* Floating Bottom-Right Question Navigators */}
      <div
        className="fixed bottom-6 right-6 z-40 inline-flex items-center rounded-xl border p-1 shadow-sm backdrop-blur-md transition-colors duration-200"
        style={{
          backgroundColor: `color-mix(in oklch, ${theme.colors.cardBg} 94%, transparent)`,
          borderColor: theme.colors.cardBorder,
        }}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handlePrevious}
          disabled={isWelcomeScreen}
          className="size-8 rounded-lg transition-colors disabled:opacity-30"
          style={{ color: theme.colors.cardText }}
          aria-label="Previous question"
        >
          <ChevronUp className="size-4" />
        </Button>
        <div
          className="mx-0.5 h-3.5 w-px"
          style={{ backgroundColor: theme.colors.cardBorder }}
        />
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => (isWelcomeScreen ? handleStartForm() : handleNext())}
          disabled={!isWelcomeScreen && isLastQuestion}
          className="size-8 rounded-lg transition-colors disabled:opacity-30"
          style={{ color: theme.colors.cardText }}
          aria-label="Next question"
        >
          <ChevronDown className="size-4" />
        </Button>
      </div>
    </div>
  );
}
