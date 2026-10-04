"use client";

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
        {/* Celebration Checkmark Icon */}
        <h2
          className="font-heading text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl"
          style={{ color: theme.colors.cardText }}
        >
          {isPreview ? "Preview Completed" : "Thank you!"}
        </h2>

        <p
          className="mt-3.5 max-w-md text-base leading-relaxed sm:text-lg"
          style={{ color: theme.colors.cardMuted }}
        >
          {isPreview
            ? "You have completed all questions in preview mode."
            : form.title
              ? `Your response for "${form.title}" has been recorded.`
              : "Your response has been recorded."}
        </p>

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
