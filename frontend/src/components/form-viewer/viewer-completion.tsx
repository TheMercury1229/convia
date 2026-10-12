"use client";

import * as React from "react";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FormWithSections } from "@/lib/api/forms";
import type { FormThemeResolved } from "@/lib/builder-themes";

interface ViewerCompletionProps {
  form: FormWithSections;
  theme: FormThemeResolved;
  isPreview: boolean;
  isDark: boolean;
  onRestart: () => void;
}

export function ViewerCompletion({
  form,
  theme,
  isPreview,
  isDark,
  onRestart,
}: ViewerCompletionProps) {
  const [countdown, setCountdown] = React.useState(4);

  React.useEffect(() => {
    if (isPreview || !form.redirectUrl) return;
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval);
          window.location.href = form.redirectUrl!;
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [form.redirectUrl, isPreview]);

  const displayTitle = isPreview
    ? "Preview Completed"
    : form.completionTitle?.trim() || "Thank you!";

  const displayMessage = isPreview
    ? "You have completed all questions in preview mode."
    : form.completionMessage?.trim() ||
      (form.title
        ? `Your response for "${form.title}" has been recorded.`
        : "Your response has been recorded.");

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center p-6 text-center select-none transition-colors duration-300"
      style={{
        backgroundColor: theme.colors.canvasBg,
        color: theme.colors.cardText,
        colorScheme: isDark ? "dark" : "light",
      }}
    >
      <div className="my-auto flex w-full max-w-lg flex-col items-center px-6 py-12 transition-all animate-in fade-in duration-300">
        <h2
          className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl text-balance"
          style={{ color: theme.colors.cardText }}
        >
          {displayTitle}
        </h2>

        <p
          className="mt-3.5 max-w-md text-base leading-relaxed sm:text-lg text-balance whitespace-pre-line"
          style={{ color: theme.colors.cardMuted }}
        >
          {displayMessage}
        </p>

        {form.redirectUrl && (
          <div className="mt-6 flex flex-col items-center gap-2">
            {!isPreview ? (
              <a
                href={form.redirectUrl}
                className="inline-flex items-center gap-1.5 text-xs font-medium underline underline-offset-4 transition-opacity hover:opacity-100"
                style={{ color: theme.colors.primary }}
              >
                <ExternalLink className="size-3.5" />
                Redirecting in {countdown}s &mdash; click if not redirected
              </a>
            ) : (
              <div
                className="rounded-lg border px-3 py-1.5 text-xs font-mono"
                style={{
                  borderColor: theme.colors.cardBorder,
                  color: theme.colors.cardMuted,
                }}
              >
                <span>Notice: In live mode, redirects to {form.redirectUrl}</span>
              </div>
            )}
          </div>
        )}

        <Button
          onClick={onRestart}
          className="mt-8 h-11 cursor-pointer rounded-xl px-7 text-sm font-semibold shadow-xs transition-all duration-150 hover:opacity-90 active:scale-[0.98] sm:text-base"
          style={{
            backgroundColor: theme.colors.primary,
            color: theme.colors.primaryForeground,
          }}
        >
          {isPreview ? "Restart Preview" : "Submit another response"}
        </Button>
      </div>

      <footer className="pointer-events-none fixed bottom-6 left-0 right-0 select-none text-center">
        <span
          className="text-xs font-medium tracking-wide"
          style={{ color: theme.colors.cardMuted }}
        >
          powered by <strong style={{ color: theme.colors.cardText }}>convia</strong>
        </span>
      </footer>
    </div>
  );
}
