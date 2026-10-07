"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Eye,
  Home,
  Moon,
  PenSquare,
  RefreshCw,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FormThemeResolved } from "@/lib/builder-themes";

export type FormUnavailableReason =
  | "not-found"
  | "closed"
  | "unpublished"
  | "empty"
  | "submission-failed"
  | "error";

export interface FormUnavailableStateProps {
  reason?: FormUnavailableReason;
  formTitle?: string | null;
  formDescription?: string | null;
  formId?: string;
  errorMessage?: string | null;
  dashboard?: boolean;
  isPreview?: boolean;
  isDark?: boolean;
  theme?: FormThemeResolved;
  onRetry?: () => void;
  onReviewAnswers?: () => void;
  onToggleDark?: () => void;
}

export function FormUnavailableState({
  reason = "not-found",
  formTitle,
  formDescription,
  formId,
  errorMessage,
  dashboard = false,
  isPreview = false,
  isDark: externalIsDark,
  theme,
  onRetry,
  onReviewAnswers,
  onToggleDark,
}: FormUnavailableStateProps) {
  const [internalDark, setInternalDark] = React.useState(false);
  const [isRetrying, setIsRetrying] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      setInternalDark(
        document.documentElement.classList.contains("dark") ||
          window.matchMedia("(prefers-color-scheme: dark)").matches,
      );
    }
  }, []);

  const isDark = externalIsDark !== undefined ? externalIsDark : internalDark;

  const handleToggleDark = () => {
    if (onToggleDark) {
      onToggleDark();
    } else {
      const next = !isDark;
      setInternalDark(next);
      document.documentElement.classList.toggle("dark", next);
    }
  };

  const handleRetryClick = async () => {
    if (!onRetry) return;
    setIsRetrying(true);
    try {
      await Promise.resolve(onRetry());
    } finally {
      setIsRetrying(false);
    }
  };

  const isDeadlineError = Boolean(
    errorMessage && errorMessage.toLowerCase().includes("deadline"),
  );

  let title = "Form unavailable";
  let description = "This form is not accessible at this moment.";

  switch (reason) {
    case "closed":
      title = formTitle
        ? `Submissions closed for ${formTitle}`
        : "Submissions are closed";
      description =
        "This form is no longer accepting responses. If you need to submit information, please contact the person or organization who shared this link.";
      break;

    case "unpublished":
      title = "This form isn't accepting responses";
      description =
        "The form owner has not opened it for responses yet. If you believe this is a mistake, please reach out to the person or organization who shared this link.";
      break;

    case "not-found":
      title = "Form not found";
      description =
        "This link may be incorrect, expired, or the form was removed by its creator.";
      break;

    case "empty":
      if (isPreview || dashboard) {
        title = "No questions added yet";
        description =
          "You are previewing this form, but no questions have been added yet.";
      } else {
        title = formTitle ? formTitle : "No questions yet";
        description =
          formDescription ||
          "This form is published, but the creator hasn't added any questions yet.";
      }
      break;

    case "submission-failed":
      if (isDeadlineError) {
        title = "Deadline passed before submission";
        description =
          "The deadline for this form ended while you were completing it. Your answers have been preserved so you can review or copy them.";
      } else {
        title = "Couldn't submit response";
        description =
          "A network issue interrupted your submission. Your answers are saved in your browser, so you can safely try again.";
      }
      break;

    case "error":
      title = "Unable to load form";
      description =
        "We couldn't connect to the server. Please check your internet connection and try reloading.";
      break;
  }

  return (
    <div
      className="relative flex min-h-screen flex-col select-none transition-colors duration-300 bg-background text-foreground"
      style={{
        backgroundColor: theme?.colors.canvasBg,
        color: theme?.colors.cardText,
        colorScheme: isDark ? "dark" : "light",
      }}
    >
      {/* ────────────────────────────────────────────────────────── */}
      {/* Minimal Header                                             */}
      {/* ────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between px-6 sm:px-10">
        <div className="flex items-center gap-2">
          {dashboard ? (
            <Link
              href="/my-forms"
              className="inline-flex items-center gap-2 opacity-90 transition-opacity hover:opacity-100"
              aria-label="Back to dashboard"
            >
              <Image
                src={isDark ? "/logo-white.svg" : "/logo.svg"}
                alt="Convia"
                width={112}
                height={32}
                className="h-6 w-auto"
                priority
              />
            </Link>
          ) : (
            <div className="inline-flex items-center gap-2 opacity-90">
              <Image
                src={isDark ? "/logo-white.svg" : "/logo.svg"}
                alt="Convia"
                width={112}
                height={32}
                className="h-6 w-auto"
                priority
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isPreview && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: theme
                  ? `color-mix(in oklch, ${theme.colors.primary} 12%, transparent)`
                  : "var(--muted)",
                color: theme?.colors.primary ?? "var(--foreground)",
              }}
            >
              <Eye className="size-3" />
              Preview Mode
            </span>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleToggleDark}
            className="size-8 rounded-lg cursor-pointer transition-colors"
            style={{ color: theme?.colors.cardText }}
            aria-label="Toggle dark/light mode"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
        </div>
      </header>

      {/* ────────────────────────────────────────────────────────── */}
      {/* Center Canvas: Pure Minimalism                             */}
      {/* ────────────────────────────────────────────────────────── */}
      <main className="my-auto flex w-full flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="mx-auto w-full max-w-lg">
          <h1
            className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-balance"
            style={{ color: theme?.colors.cardText }}
          >
            {title}
          </h1>

          <p
            className="mt-4 text-base leading-relaxed sm:text-lg text-balance"
            style={{ color: theme?.colors.cardMuted ?? "var(--muted-foreground)" }}
          >
            {description}
          </p>

          {/* Contextual Actions Only */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {/* SUBMISSION FAILED ACTIONS */}
            {reason === "submission-failed" && (
              <>
                {!isDeadlineError && onRetry && (
                  <Button
                    onClick={handleRetryClick}
                    disabled={isRetrying}
                    className="h-10 cursor-pointer rounded-xl px-6 text-sm font-semibold shadow-xs transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
                    style={
                      theme
                        ? {
                            backgroundColor: theme.colors.primary,
                            color: theme.colors.primaryForeground,
                          }
                        : undefined
                    }
                  >
                    <RefreshCw
                      className={`size-3.5 mr-2 ${isRetrying ? "animate-spin" : ""}`}
                    />
                    {isRetrying ? "Retrying..." : "Try submitting again"}
                  </Button>
                )}

                {onReviewAnswers && (
                  <Button
                    variant="outline"
                    onClick={onReviewAnswers}
                    className="h-10 cursor-pointer rounded-xl px-5 text-sm font-medium transition-all"
                    style={
                      theme
                        ? {
                            borderColor: theme.colors.cardBorder,
                            color: theme.colors.cardText,
                          }
                        : undefined
                    }
                  >
                    <ArrowLeft className="size-3.5 mr-2" />
                    Review answers
                  </Button>
                )}
              </>
            )}

            {/* CREATOR PREVIEW EMPTY ACTION */}
            {reason === "empty" && (isPreview || dashboard) && formId && (
              <Button
                asChild
                className="h-10 cursor-pointer rounded-xl px-6 text-sm font-semibold shadow-xs transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
                style={
                  theme
                    ? {
                        backgroundColor: theme.colors.primary,
                        color: theme.colors.primaryForeground,
                      }
                    : undefined
                }
              >
                <Link href={`/builder/${formId}`}>
                  <PenSquare className="size-3.5 mr-2" />
                  Open in Builder
                </Link>
              </Button>
            )}

            {/* ERROR ACTION */}
            {reason === "error" && onRetry && (
              <Button
                onClick={handleRetryClick}
                disabled={isRetrying}
                className="h-10 cursor-pointer rounded-xl px-6 text-sm font-semibold shadow-xs transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
                style={
                  theme
                    ? {
                        backgroundColor: theme.colors.primary,
                        color: theme.colors.primaryForeground,
                      }
                    : undefined
                }
              >
                <RefreshCw
                  className={`size-3.5 mr-2 ${isRetrying ? "animate-spin" : ""}`}
                />
                {isRetrying ? "Reloading..." : "Reload form"}
              </Button>
            )}

            {/* DASHBOARD CONTEXT ONLY */}
            {dashboard && (
              <Button
                asChild
                variant="outline"
                className="h-10 cursor-pointer rounded-xl px-5 text-sm font-medium"
                style={
                  theme
                    ? {
                        borderColor: theme.colors.cardBorder,
                        color: theme.colors.cardText,
                      }
                    : undefined
                }
              >
                <Link href="/my-forms">
                  <Home className="size-3.5 mr-2" />
                  Back to My Forms
                </Link>
              </Button>
            )}
          </div>
        </div>
      </main>

      {/* ────────────────────────────────────────────────────────── */}
      {/* Pinned Minimal Footer                                      */}
      {/* ────────────────────────────────────────────────────────── */}
      <footer className="pointer-events-none fixed bottom-6 left-0 right-0 select-none text-center">
        <span
          className="text-xs font-medium tracking-wide"
          style={{ color: theme?.colors.cardMuted ?? "var(--muted-foreground)" }}
        >
          powered by{" "}
          <strong style={{ color: theme?.colors.cardText ?? "var(--foreground)" }}>
            convia
          </strong>
        </span>
      </footer>
    </div>
  );
}
