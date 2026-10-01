"use client";

import * as React from "react";
import {
  ChevronUp,
  ChevronDown,
  AlertCircle,
  Sun,
  Moon,
  ArrowRight,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FormWithSections } from "@/lib/api/forms";
import type { Question, QuestionType, QuestionOption, QuestionValidation } from "@/types/builder";
import { getFormTheme, type FormThemeResolved } from "@/lib/builder-themes";
import { TypeformInput } from "./typeform-input";
import { FormLoadingScreen } from "./form-loading-screen";
import { validateQuestionAnswer } from "@/lib/validations/question-validator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/kbd";
import { submitResponse } from "@/lib/api/responses";
import {
  getOrCreateSessionId,
  trackFormView,
  trackFormStart,
  trackFormProgress,
} from "@/lib/api/analytics";

interface FormViewerProps {
  form: FormWithSections;
  isPreview?: boolean;
}

interface FlatQuestionItem {
  question: Question;
  sectionTitle?: string | null;
  sectionDescription?: string | null;
  questionIndex: number;
  sectionIndex: number;
  isFirstQuestionOfSection: boolean;
  totalQuestions: number;
  totalSections: number;
}

export function FormViewer({ form, isPreview = false }: FormViewerProps) {
  // Theme mode toggle (Light / Dark)
  const [isDark, setIsDark] = React.useState(false);

  // Sync initial mode with user system preference
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setIsDark(prefersDark);
    }
  }, []);

  // Sync document root class and color-scheme for native widgets (calendars, clocks, inputs)
  React.useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("dark", isDark);
      document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    }
    return () => {
      if (typeof document !== "undefined") {
        document.documentElement.style.colorScheme = "";
      }
    };
  }, [isDark]);

  // Resolve active theme with dark mode support
  const theme = React.useMemo<FormThemeResolved>(() => {
    return getFormTheme(form.themeId ?? "nova", isDark);
  }, [form.themeId, isDark]);

  // Flatten sections and questions in position order
  const flatQuestions = React.useMemo<FlatQuestionItem[]>(() => {
    const sortedSections = [...(form.sections || [])].sort((a, b) => a.position - b.position);
    const items: FlatQuestionItem[] = [];
    let qCounter = 0;

    sortedSections.forEach((sec, sIdx) => {
      const sortedQuestions = [...(sec.questions || [])].sort((a, b) => a.position - b.position);
      sortedQuestions.forEach((q, qIdxInSec) => {
        // Robust parsing of validation
        let parsedValidation: QuestionValidation = {};
        if (typeof q.validation === "string") {
          try {
            parsedValidation = JSON.parse(q.validation);
          } catch {
            parsedValidation = {};
          }
        } else if (q.validation && typeof q.validation === "object") {
          parsedValidation = q.validation as QuestionValidation;
        }

        // Robust parsing of options
        let parsedOptions: QuestionOption[] = [];
        if (typeof q.options === "string") {
          try {
            const parsed = JSON.parse(q.options);
            parsedOptions = Array.isArray(parsed) ? parsed : [];
          } catch {
            parsedOptions = [];
          }
        } else if (Array.isArray(q.options)) {
          parsedOptions = q.options as QuestionOption[];
        }

        // Defensively resolve required flag across all possible naming conventions & shapes
        const isRequired = Boolean(
          q.isRequired === true ||
          (q as any).isRequired === 1 ||
          (q as any).isRequired === "true" ||
          (q as any).required === true ||
          (q as any).required === 1 ||
          (q as any).required === "true" ||
          (parsedValidation as any).required === true
        );

        const questionObj: Question = {
          id: q.id,
          sectionId: q.sectionId,
          fieldName: q.fieldName,
          label: q.label,
          description: q.description ?? "",
          placeholder: q.placeholder ?? "",
          type: q.type as QuestionType,
          required: isRequired,
          position: q.position,
          options: parsedOptions,
          validation: parsedValidation,
        };

        items.push({
          question: questionObj,
          sectionTitle: sec.title,
          sectionDescription: sec.description,
          questionIndex: qCounter++,
          sectionIndex: sIdx,
          isFirstQuestionOfSection: qIdxInSec === 0,
          totalQuestions: 0,
          totalSections: sortedSections.length,
        });
      });
    });

    return items.map((item) => ({ ...item, totalQuestions: items.length }));
  }, [form.sections]);

  const totalQuestions = flatQuestions.length;

  // Resolve first section title & description for the welcome screen
  const firstSectionInfo = React.useMemo(() => {
    const sorted = [...(form.sections || [])].sort((a, b) => a.position - b.position);
    const sec = sorted[0];
    if (!sec) return null;

    const rawTitle = sec.title?.trim() || "";
    const rawDesc = sec.description?.trim() || "";

    if (!rawTitle && !rawDesc) return null;

    return {
      title: rawTitle || null,
      description: rawDesc || null,
    };
  }, [form.sections]);

  // State
  const [isWelcomeScreen, setIsWelcomeScreen] = React.useState(true);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, unknown>>({});
  const answersRef = React.useRef<Record<string, unknown>>({});
  answersRef.current = answers;
  const [currentError, setCurrentError] = React.useState<string | null>(null);
  const [isCompleted, setIsCompleted] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [shake, setShake] = React.useState(false);

  // ── Analytics Session & Telemetry Tracking ────────────────────
  const sessionIdRef = React.useRef<string>("");
  const hasStartedRef = React.useRef(false);

  // 1. Silent Beacon: Track form page view on mount
  React.useEffect(() => {
    if (isPreview || typeof window === "undefined") return;
    const sid = getOrCreateSessionId(form.id);
    sessionIdRef.current = sid;
    trackFormView(form.id, sid);
  }, [form.id, isPreview]);

  // 2. Silent Beacon: Track start session when user enters the form
  const handleStartForm = React.useCallback(() => {
    setIsWelcomeScreen(false);
    if (!isPreview) {
      if (!hasStartedRef.current) {
        hasStartedRef.current = true;
        const sid = sessionIdRef.current || getOrCreateSessionId(form.id);
        sessionIdRef.current = sid;
        trackFormStart(form.id, sid);
        trackFormProgress(form.id, sid, 0);
      }
    }
  }, [form.id, isPreview]);

  // 3. Silent Beacon: Track question advance via sendBeacon / keepalive fetch
  React.useEffect(() => {
    if (isPreview || isWelcomeScreen || !hasStartedRef.current) return;
    const sid = sessionIdRef.current || getOrCreateSessionId(form.id);
    trackFormProgress(form.id, sid, currentIndex);
  }, [currentIndex, isPreview, isWelcomeScreen, form.id]);

  // Track unload / drop-off on tab close
  React.useEffect(() => {
    if (isPreview || typeof window === "undefined") return;
    const handleUnload = () => {
      if (hasStartedRef.current && !isCompleted) {
        const sid = sessionIdRef.current || getOrCreateSessionId(form.id);
        trackFormProgress(form.id, sid, currentIndex);
      }
    };
    window.addEventListener("pagehide", handleUnload);
    window.addEventListener("beforeunload", handleUnload);
    return () => {
      window.removeEventListener("pagehide", handleUnload);
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [currentIndex, isCompleted, isPreview, form.id]);

  const currentItem = flatQuestions[currentIndex];
  const isHeading = currentItem?.question.type === "heading";
  const isMultiline =
    currentItem?.question.type === "textarea" || currentItem?.question.type === "paragraph";

  // Submission trigger with smooth animation timing
  const startSubmission = async () => {
    setIsSubmitting(true);

    if (isPreview) {
      setTimeout(() => {
        setIsSubmitting(false);
        setIsCompleted(true);
      }, 1200);
      return;
    }

    try {
      const answersPayload = Object.entries(answersRef.current).map(([questionId, value]) => ({
        questionId,
        value,
      }));

      await submitResponse(form.id, {
        answers: answersPayload,
        sessionId: sessionIdRef.current,
      });
      setIsSubmitting(false);
      setIsCompleted(true);
    } catch (err: any) {
      setIsSubmitting(false);
      triggerShake(err?.message || "Failed to submit response. Please try again.");
    }
  };

  // Helper to trigger gentle shake animation on validation error
  const triggerShake = (errMsg: string) => {
    setCurrentError(errMsg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  // Answer handler
  const handleAnswerChange = (val: unknown) => {
    if (!currentItem) return;
    answersRef.current = { ...answersRef.current, [currentItem.question.id]: val };
    setAnswers((prev) => ({ ...prev, [currentItem.question.id]: val }));
    if (currentError) setCurrentError(null);
  };

  // Validate and advance to next question
  const handleNext = (explicitAnswer?: unknown) => {
    if (!currentItem) return;

    // Headings are informational and never fail validation
    if (!isHeading) {
      // Discard DOM or React synthetic event objects accidentally passed into onClick
      const isEvent = Boolean(
        explicitAnswer &&
        typeof explicitAnswer === "object" &&
        ("nativeEvent" in explicitAnswer ||
          "preventDefault" in explicitAnswer ||
          "_reactName" in explicitAnswer ||
          "target" in explicitAnswer)
      );

      const hasExplicit = explicitAnswer !== undefined && !isEvent;

      const answer = hasExplicit
        ? explicitAnswer
        : answersRef.current[currentItem.question.id];

      if (hasExplicit) {
        answersRef.current = {
          ...answersRef.current,
          [currentItem.question.id]: explicitAnswer,
        };
        setAnswers((prev) => ({
          ...prev,
          [currentItem.question.id]: explicitAnswer,
        }));
      }

      const validation = validateQuestionAnswer(currentItem.question, answer);

      if (!validation.isValid) {
        triggerShake(validation.error || "Please answer this question to proceed.");
        return;
      }
    }

    setCurrentError(null);

    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      startSubmission();
    }
  };

  // Navigate to previous question
  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentError(null);
      setCurrentIndex((prev) => prev - 1);
    } else if (currentIndex === 0 && !isWelcomeScreen) {
      setCurrentError(null);
      setIsWelcomeScreen(true);
    }
  };

  // Keyboard navigation:
  // - 'D' or 'd' toggles light/dark mode (when not in an input/textarea)
  // - Enter / Down arrow on welcome screen begins the form
  // - Up / Down arrows navigate questions
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT";

      // 'D' key shortcut for mode toggle
      if ((e.key === "d" || e.key === "D") && !isInput) {
        e.preventDefault();
        setIsDark((prev) => !prev);
        return;
      }

      // Welcome screen keyboard navigation
      if (isWelcomeScreen) {
        if (e.key === "Enter" || e.key === "ArrowDown") {
          e.preventDefault();
          handleStartForm();
        }
        return;
      }

      // Up and Down arrows
      if (e.key === "ArrowDown" && target.tagName !== "TEXTAREA") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowUp" && target.tagName !== "TEXTAREA") {
        e.preventDefault();
        handlePrevious();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isWelcomeScreen, currentIndex, totalQuestions, currentItem, answers]);

  // Calculate overall progress percentage
  const progressPercent = isWelcomeScreen
    ? 0
    : totalQuestions > 0
      ? Math.round(((currentIndex + (isCompleted ? 1 : 0)) / totalQuestions) * 100)
      : 0;


  // Render Empty State if no questions
  if (totalQuestions === 0) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center p-6 text-center"
        style={{
          backgroundColor: theme.colors.canvasBg,
          color: theme.colors.canvasText,
        }}
      >
        <div
          className="max-w-md w-full rounded-2xl border p-8 text-center shadow-xs"
          style={{
            backgroundColor: theme.colors.cardBg,
            borderColor: theme.colors.cardBorder,
          }}
        >
          <h1 className="font-heading text-2xl font-bold tracking-tight">{form.title || "Form"}</h1>
          <p
            className="mt-2 text-sm leading-relaxed"
            style={{ color: theme.colors.cardMuted }}
          >
            {form.description || "This form does not contain any questions yet."}
          </p>
          {isPreview && (
            <Badge
              variant="secondary"
              className="mt-6 gap-1.5 font-medium text-xs rounded-full px-3 py-1"
              style={{
                backgroundColor: `color-mix(in oklch, ${theme.colors.primary} 12%, transparent)`,
                borderColor: `color-mix(in oklch, ${theme.colors.primary} 25%, transparent)`,
                color: theme.colors.primary,
              }}
            >
              <Eye className="size-3" />
              Preview Mode
            </Badge>
          )}
        </div>
      </div>
    );
  }

  // ── Render Loading Screen during submission ───────────────────
  if (isSubmitting) {
    return (
      <FormLoadingScreen
        backgroundColor={theme.colors.canvasBg}
        textColor={theme.colors.cardText}
        isDark={isDark}
      />
    );
  }

  // ── Render Professional Form Completion Screen ───────────────
  if (isCompleted) {
    return (
      <div
        className="relative flex min-h-screen flex-col items-center justify-center p-6 text-center select-none transition-colors duration-300 animate-in fade-in duration-400"
        style={{
          backgroundColor: theme.colors.canvasBg,
          color: theme.colors.cardText,
          colorScheme: isDark ? "dark" : "light",
        }}
      >
        <div className="w-full max-w-lg flex flex-col items-center my-auto py-12 px-6">
          {/* Headline */}
          <h2
            className="font-heading text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight"
            style={{ color: theme.colors.cardText }}
          >
            {isPreview ? "Preview Completed" : "Thank you!"}
          </h2>

          {/* Reassuring description */}
          <p
            className="mt-3 text-base sm:text-lg leading-relaxed max-w-md font-normal"
            style={{ color: theme.colors.cardMuted }}
          >
            {isPreview
              ? "You have completed all questions in preview mode."
              : form.title
                ? `Your response for "${form.title}" has been recorded.`
                : "Your response has been recorded."}
          </p>

          {/* Primary Action Button */}
          <Button
            onClick={() => {
              setIsCompleted(false);
              setIsSubmitting(false);
              setIsWelcomeScreen(true);
              setCurrentIndex(0);
              setCurrentError(null);
              setAnswers({});
            }}
            className="mt-8 px-6 h-10 rounded-xl text-sm font-semibold cursor-pointer transition-all duration-150 hover:opacity-90 active:scale-[0.98] shadow-xs"
            style={{
              backgroundColor: theme.colors.primary,
              color: theme.colors.primaryForeground,
            }}
          >
            {isPreview ? "Restart Preview" : "Submit another response"}
          </Button>
        </div>

        {/* Footer subtle brand */}
        <footer className="fixed bottom-6 left-0 right-0 text-center pointer-events-none select-none">
          <span
            className="text-xs font-medium tracking-wide"
            style={{ color: theme.colors.cardMuted }}
          >
            powered by{" "}
            <strong
              className="font-semibold tracking-tight"
              style={{ color: theme.colors.cardText }}
            >
              convia
            </strong>
          </span>
        </footer>
      </div>
    );
  }

  const isFirstPage = currentIndex === 0;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  return (
    <div
      className={cn(
        "relative flex min-h-screen flex-col transition-colors duration-300 select-none",
        isDark ? "dark" : ""
      )}
      style={{
        backgroundColor: theme.colors.canvasBg,
        color: theme.colors.cardText,
        colorScheme: isDark ? "dark" : "light",
        backgroundImage: isDark
          ? `radial-gradient(ellipse 80% 50% at 50% -20%, color-mix(in oklch, ${theme.colors.primary} 12%, transparent), transparent 70%)`
          : `radial-gradient(ellipse 80% 50% at 50% -20%, color-mix(in oklch, ${theme.colors.primary} 6%, transparent), transparent 70%)`,
      }}
    >
      {/* ── 1. Top Global Progress Bar ────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-black/5 dark:bg-white/5">
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: theme.colors.primary,
          }}
        />
      </div>

      {/* ── 2. Top Header Bar (Clean, Borderless, Seamless) ────────────── */}
      <header
        className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between px-4 sm:px-8 backdrop-blur-md transition-colors"
        style={{
          backgroundColor: `color-mix(in oklch, ${theme.colors.canvasBg} 85%, transparent)`,
        }}
      >
        {/* Left: Preview Indicator if applicable */}
        <div className="flex items-center gap-3">
          {isPreview && (
            <Badge
              variant="secondary"
              className="gap-1.5 font-medium text-xs rounded-full px-2.5 py-0.5"
              style={{
                backgroundColor: `color-mix(in oklch, ${theme.colors.primary} 12%, transparent)`,
                borderColor: `color-mix(in oklch, ${theme.colors.primary} 25%, transparent)`,
                color: theme.colors.primary,
              }}
            >
              <Eye className="size-3" />
              Preview
            </Badge>
          )}
        </div>

        {/* Right: Section & Question Indicator + Theme Mode Toggle */}
        <div className="flex items-center gap-3">
          {!isWelcomeScreen && (
            <div
              className="flex items-center gap-2 text-xs font-mono font-medium select-none"
              style={{ color: theme.colors.cardMuted }}
            >
              {currentItem.totalSections > 1 && (
                <>
                  <span>
                    Section{" "}
                    <strong className="font-semibold" style={{ color: theme.colors.cardText }}>
                      {currentItem.sectionIndex + 1}
                    </strong>
                    <span className="mx-0.5 opacity-40">/</span>
                    {currentItem.totalSections}
                  </span>
                  <span className="opacity-40">•</span>
                </>
              )}
              <span>
                Question{" "}
                <strong className="font-semibold" style={{ color: theme.colors.cardText }}>
                  {currentIndex + 1}
                </strong>
                <span className="mx-0.5 opacity-40">/</span>
                {totalQuestions}
              </span>
            </div>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsDark((prev) => !prev)}
            className="size-8 rounded-lg cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            style={{
              color: theme.colors.cardText,
            }}
            aria-label="Toggle dark/light mode"
            title="Toggle theme (D)"
          >
            {isDark ? (
              <Sun className="size-4" />
            ) : (
              <Moon className="size-4" />
            )}
          </Button>
        </div>
      </header>

      {/* ── 3. Main Stage (Centered Content, High Typography) ──────── */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 sm:px-8 py-8 sm:py-12">
        <div className="w-full max-w-2xl mx-auto">
          {/* ────────────────────────────────────────────────────────── */}
          {/* WELCOME / INTRO SCREEN: Title & Section Title/Description  */}
          {/* ────────────────────────────────────────────────────────── */}
          {isWelcomeScreen ? (
            <div className="w-full text-left">
              {/* Form Heading */}
              <h1
                className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-left leading-tight"
                style={{ color: theme.colors.cardText }}
              >
                {form.title || "Untitled Form"}
              </h1>

              {/* Form Description */}
              {form.description && (
                <p
                  className="mt-3 text-base sm:text-lg leading-relaxed text-left font-normal"
                  style={{ color: theme.colors.cardMuted }}
                >
                  {form.description}
                </p>
              )}

              {/* Section Title & Description */}
              {firstSectionInfo && (
                <div className="mt-6 text-left">
                  {firstSectionInfo.title && (
                    <h2
                      className="font-heading text-lg sm:text-xl font-bold tracking-tight"
                      style={{ color: theme.colors.cardText }}
                    >
                      {firstSectionInfo.title}
                    </h2>
                  )}
                  {firstSectionInfo.description && (
                    <p
                      className="mt-1 text-sm sm:text-base leading-relaxed font-normal"
                      style={{ color: theme.colors.cardMuted }}
                    >
                      {firstSectionInfo.description}
                    </p>
                  )}
                </div>
              )}

              {/* Action Button: Start Form */}
              <div className="mt-8 flex items-center gap-4">
                <Button
                  onClick={handleStartForm}
                  size="default"
                  className="font-semibold text-sm sm:text-base px-6 h-11 rounded-xl cursor-pointer transition-all duration-150 hover:opacity-90 active:scale-[0.98] flex items-center gap-2"
                  style={{
                    backgroundColor: theme.colors.primary,
                    color: theme.colors.primaryForeground,
                  }}
                  id="typeform-start-btn"
                >
                  <span>Start</span>
                  <ArrowRight className="size-4" />
                </Button>
              </div>
            </div>
          ) : (
            /* ────────────────────────────────────────────────────────── */
            /* QUESTION CARD (Clean, Confident, Cinematic)                */
            /* ────────────────────────────────────────────────────────── */
            <div
              className={cn(
                "w-full transition-all duration-200 animate-in fade-in duration-300",
                shake && "animate-shake"
              )}
            >
              {/* Section Heading — Shown on subsequent sections (Section 2, 3, etc.) */}
              {(() => {
                if (!currentItem.isFirstQuestionOfSection) return null;
                // If Section 1, it was already shown on the welcome screen
                if (currentItem.sectionIndex === 0) return null;

                const rawTitle = currentItem.sectionTitle?.trim() || "";
                const hasRealTitle = rawTitle !== "" && rawTitle.toLowerCase() !== "untitled section";
                const rawDesc = currentItem.sectionDescription?.trim() || "";
                const hasDesc = rawDesc !== "";

                if (!hasRealTitle && !hasDesc) return null;

                return (
                  <div className="mb-6 text-left">
                    {currentItem.totalSections > 1 && (
                      <span
                        className="text-xs font-mono font-semibold uppercase tracking-wider block mb-1.5"
                        style={{ color: theme.colors.primary }}
                      >
                        Section {currentItem.sectionIndex + 1}
                      </span>
                    )}
                    {hasRealTitle && (
                      <h3
                        className="font-heading text-lg sm:text-xl font-bold tracking-tight mt-1"
                        style={{ color: theme.colors.cardText }}
                      >
                        {rawTitle}
                      </h3>
                    )}
                    {hasDesc && (
                      <p
                        className="mt-1 text-xs sm:text-sm leading-relaxed font-normal"
                        style={{ color: theme.colors.cardMuted }}
                      >
                        {rawDesc}
                      </p>
                    )}
                  </div>
                );
              })()}

              {/* HEADING TYPE vs QUESTION TYPE */}
              {isHeading ? (
                <div className="mb-6 text-left">
                  <h2
                    className="font-heading text-xl sm:text-2xl md:text-3xl font-bold tracking-tight"
                    style={{ color: theme.colors.cardText }}
                  >
                    {currentItem.question.label || "Untitled Section"}
                  </h2>
                  {currentItem.question.description && (
                    <p
                      className="mt-2 text-sm sm:text-base leading-relaxed font-normal"
                      style={{ color: theme.colors.cardMuted }}
                    >
                      {currentItem.question.description}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mb-4 text-left">
                  {/* Question Title */}
                  <h2
                    className="font-heading text-xl sm:text-2xl md:text-3xl font-semibold tracking-tight leading-snug flex items-start gap-3"
                    style={{ color: theme.colors.cardText }}
                  >
                    <span
                      className="font-mono text-base sm:text-lg pt-0.5 shrink-0 font-semibold select-none"
                      style={{ color: theme.colors.primary }}
                    >
                      {currentIndex + 1} ➔
                    </span>
                    <span>
                      {currentItem.question.label || "Untitled Question"}
                      {currentItem.question.required && (
                        <span className="ml-1 text-destructive font-bold" title="Required">
                          *
                        </span>
                      )}
                    </span>
                  </h2>

                  {/* Question Description */}
                  {currentItem.question.description && (
                    <p
                      className="mt-1.5 text-sm sm:text-base pl-7 leading-relaxed font-normal"
                      style={{ color: theme.colors.cardMuted }}
                    >
                      {currentItem.question.description}
                    </p>
                  )}
                </div>
              )}

              {/* Input Component (null for headings) */}
              {!isHeading && (
                <div className="mt-6 sm:mt-7 pl-0 sm:pl-7">
                  <TypeformInput
                    key={currentItem.question.id}
                    question={currentItem.question}
                    theme={theme}
                    value={answers[currentItem.question.id]}
                    onChange={handleAnswerChange}
                    onSubmit={(val) => handleNext(val)}
                    hasError={Boolean(currentError)}
                    isDark={isDark}
                  />

                  {/* Validation Error Message */}
                  {currentError && (
                    <div
                      className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs sm:text-sm font-medium text-destructive"
                      role="alert"
                    >
                      <AlertCircle className="size-4 shrink-0" />
                      <span>{currentError}</span>
                    </div>
                  )}
                </div>
              )}

              {/* ── Action Row (Directly below input, clean & natural) ── */}
              <div className="mt-7 sm:mt-8 flex items-center gap-4 pl-0 sm:pl-7">
                <Button
                  onClick={() => handleNext()}
                  size="default"
                  className="font-medium text-sm sm:text-base px-5 h-10 shadow-xs rounded-xl cursor-pointer transition-all duration-150 hover:opacity-90 active:scale-[0.98] flex items-center gap-2"
                  style={{
                    backgroundColor: theme.colors.primary,
                    color: theme.colors.primaryForeground,
                  }}
                  id="typeform-next-btn"
                >
                  <span>
                    {isHeading
                      ? "Continue"
                      : isLastQuestion
                        ? "Submit Form"
                        : "Next"}
                  </span>
                  <ArrowRight className="size-4" />
                </Button>

                <div
                  className="flex items-center gap-1.5 text-xs select-none"
                  style={{ color: theme.colors.cardMuted }}
                >
                  <span>press</span>
                  {isMultiline ? (
                    <span className="flex items-center gap-1">
                      <Kbd className="text-[10px] px-1.5 py-0.5">Ctrl</Kbd>
                      <span>+</span>
                      <Kbd className="text-[10px] px-1.5 py-0.5">Enter</Kbd>
                    </span>
                  ) : (
                    <Kbd className="text-[10px] px-1.5 py-0.5">Enter ↵</Kbd>
                  )}
                </div>
              </div>
            </div>)}

        </div>
      </main>

      {/* ── 4. Bottom Subtle Branding ─────────────────────────────── */}
      <footer className="w-full py-4 px-6 text-center pointer-events-none select-none">
        <span
          className="text-xs font-medium tracking-wide"
          style={{ color: theme.colors.cardMuted }}
        >
          powered by{" "}
          <strong
            className="font-semibold tracking-tight"
            style={{ color: theme.colors.cardText }}
          >
            convia
          </strong>
        </span>
      </footer>

      {/* ── 5. Bottom-Right Floating Navigation Dock ─ */}
      <div
        className="fixed bottom-6 right-6 z-40 inline-flex items-center rounded-xl border p-1 shadow-sm backdrop-blur-md transition-colors"
        style={{
          backgroundColor: `color-mix(in oklch, ${theme.colors.cardBg} 92%, transparent)`,
          borderColor: theme.colors.cardBorder,
        }}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handlePrevious}
          disabled={isWelcomeScreen}
          className="size-8 rounded-lg cursor-pointer transition-colors disabled:opacity-25 disabled:pointer-events-none hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center p-0"
          style={{ color: theme.colors.cardText }}
          aria-label="Previous question"
          title="Previous question (↑)"
        >
          <ChevronUp className="size-4 shrink-0 stroke-[2.5]" />
        </Button>

        <div
          className="h-3.5 w-px mx-0.5 shrink-0 self-center"
          style={{
            backgroundColor: `color-mix(in oklch, ${theme.colors.cardBorder} 80%, transparent)`,
          }}
          aria-hidden="true"
        />

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => {
            if (isWelcomeScreen) {
              setIsWelcomeScreen(false);
            } else {
              handleNext();
            }
          }}
          disabled={!isWelcomeScreen && currentIndex === totalQuestions - 1}
          className="size-8 rounded-lg cursor-pointer transition-colors disabled:opacity-25 disabled:pointer-events-none hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center p-0"
          style={{ color: theme.colors.cardText }}
          aria-label="Next question"
          title="Next question (↓)"
        >
          <ChevronDown className="size-4 shrink-0 stroke-[2.5]" />
        </Button>
      </div>
    </div>
  );
}
