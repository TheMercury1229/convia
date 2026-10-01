"use client";

import * as React from "react";
import { ChevronDown, ChevronUp, Eye, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FormLoadingScreen } from "./form-loading-screen";
import { ViewerCompletion } from "./viewer-completion";
import { ViewerQuestion } from "./viewer-question";
import { ViewerWelcome } from "./viewer-welcome";
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

  const flatQuestions = React.useMemo<FlatQuestionItem[]>(() => {
    const sections = [...(form.sections || [])].sort((a, b) => a.position - b.position);
    const items: FlatQuestionItem[] = [];
    let questionIndex = 0;

    for (const [sectionIndex, section] of sections.entries()) {
      const questions = [...(section.questions || [])].sort((a, b) => a.position - b.position);
      for (const [index, question] of questions.entries()) {
        items.push({
          question: apiQuestionToClientQuestion(question, false),
          sectionTitle: section.title,
          sectionDescription: section.description,
          questionIndex: questionIndex++,
          sectionIndex,
          isFirstQuestionOfSection: index === 0,
          totalQuestions: 0,
          totalSections: sections.length,
        });
      }
    }

    return items.map((item) => ({ ...item, totalQuestions: items.length }));
  }, [form.sections]);

  const totalQuestions = flatQuestions.length;
  const currentItem = flatQuestions[currentIndex];
  const isHeading = currentItem?.question.type === "heading";
  const isMultiline = currentItem?.question.type === "textarea" || currentItem?.question.type === "paragraph";
  const firstSection = [...(form.sections || [])].sort((a, b) => a.position - b.position)[0];
  const firstSectionInfo = firstSection && (firstSection.title?.trim() || firstSection.description?.trim())
    ? { title: firstSection.title?.trim() || null, description: firstSection.description?.trim() || null }
    : null;

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
    startSession();
  };

  const handleAnswerChange = (value: unknown) => {
    if (!currentItem) return;
    answersRef.current = { ...answersRef.current, [currentItem.question.id]: value };
    setAnswers((previous) => ({ ...previous, [currentItem.question.id]: value }));
    setCurrentError(null);
  };

  const submitCurrentResponse = async () => {
    setIsSubmitting(true);
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
      setIsSubmitting(false);
      setIsCompleted(true);
    } catch (error) {
      setIsSubmitting(false);
      triggerShake(error instanceof Error ? error.message : "Failed to submit response. Please try again.");
    }
  };

  const handleNext = (explicitAnswer?: unknown) => {
    if (!currentItem) return;

    if (!isHeading) {
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
      <div className="flex min-h-screen items-center justify-center p-6 text-center" style={{ backgroundColor: theme.colors.canvasBg, color: theme.colors.canvasText }}>
        <div className="w-full max-w-md rounded-2xl border p-8 shadow-xs" style={{ backgroundColor: theme.colors.cardBg, borderColor: theme.colors.cardBorder }}>
          <h1 className="font-heading text-2xl font-bold tracking-tight">{form.title || "Form"}</h1>
          <p className="mt-2 text-sm leading-relaxed" style={{ color: theme.colors.cardMuted }}>{form.description || "This form does not contain any questions yet."}</p>
        </div>
      </div>
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
          setIsCompleted(false);
          setIsWelcomeScreen(true);
          setCurrentIndex(0);
          setCurrentError(null);
          setAnswers({});
        }}
      />
    );
  }

  const progressPercent = isWelcomeScreen ? 0 : Math.round(((currentIndex + (isCompleted ? 1 : 0)) / totalQuestions) * 100);
  const isLastQuestion = currentIndex === totalQuestions - 1;

  return (
    <div className="relative flex min-h-screen flex-col select-none transition-colors duration-300" style={{ backgroundColor: theme.colors.canvasBg, color: theme.colors.cardText, colorScheme: isDark ? "dark" : "light" }}>
      <div className="fixed left-0 right-0 top-0 z-50 h-0.75 bg-black/5 dark:bg-white/5"><div className="h-full transition-all duration-300 ease-out" style={{ width: `${progressPercent}%`, backgroundColor: theme.colors.primary }} /></div>
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between px-4 backdrop-blur-md sm:px-8" style={{ backgroundColor: `color-mix(in oklch, ${theme.colors.canvasBg} 85%, transparent)` }}>
        <div>{isPreview && <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium" style={{ backgroundColor: `color-mix(in oklch, ${theme.colors.primary} 12%, transparent)`, color: theme.colors.primary }}><Eye className="size-3" />Preview</span>}</div>
        <div className="flex items-center gap-3">
          {!isWelcomeScreen && currentItem && <span className="text-xs font-mono font-medium" style={{ color: theme.colors.cardMuted }}>Question {currentIndex + 1} / {totalQuestions}</span>}
          <Button variant="ghost" size="icon-sm" onClick={() => setIsDark((dark) => !dark)} className="size-8 rounded-lg" style={{ color: theme.colors.cardText }} aria-label="Toggle dark/light mode">{isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}</Button>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-8 sm:px-8 sm:py-12">
        <div className="mx-auto w-full max-w-2xl">
          {isWelcomeScreen ? (
            <ViewerWelcome form={form} theme={theme} isPreview={isPreview} firstSectionInfo={firstSectionInfo} onStart={handleStartForm} />
          ) : currentItem ? (
            <ViewerQuestion item={currentItem} theme={theme} isDark={isDark} currentIndex={currentIndex} isLastQuestion={isLastQuestion} isMultiline={Boolean(isMultiline)} value={answers[currentItem.question.id]} error={currentError} shake={shake} onAnswerChange={handleAnswerChange} onNext={handleNext} />
          ) : null}
        </div>
      </main>
      <footer className="w-full px-6 py-4 text-center"><span className="text-xs font-medium tracking-wide" style={{ color: theme.colors.cardMuted }}>powered by <strong style={{ color: theme.colors.cardText }}>convia</strong></span></footer>
      <div className="fixed bottom-6 right-6 z-40 inline-flex items-center rounded-xl border p-1 shadow-sm backdrop-blur-md" style={{ backgroundColor: `color-mix(in oklch, ${theme.colors.cardBg} 92%, transparent)`, borderColor: theme.colors.cardBorder }}>
        <Button variant="ghost" size="icon-sm" onClick={handlePrevious} disabled={isWelcomeScreen} className="size-8 rounded-lg" style={{ color: theme.colors.cardText }} aria-label="Previous question"><ChevronUp className="size-4" /></Button>
        <div className="mx-0.5 h-3.5 w-px" style={{ backgroundColor: theme.colors.cardBorder }} />
        <Button variant="ghost" size="icon-sm" onClick={() => (isWelcomeScreen ? handleStartForm() : handleNext())} disabled={!isWelcomeScreen && isLastQuestion} className="size-8 rounded-lg" style={{ color: theme.colors.cardText }} aria-label="Next question"><ChevronDown className="size-4" /></Button>
      </div>
    </div>
  );
}
