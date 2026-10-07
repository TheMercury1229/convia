"use client";

import { ArrowRight, Clock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FormWithSections } from "@/lib/api/forms";
import type { FormThemeResolved } from "@/lib/builder-themes";

interface ViewerWelcomeProps {
  form: FormWithSections;
  theme: FormThemeResolved;
  isPreview: boolean;
  onStart: () => void;
  onFillWithAi?: () => void;
}

export function ViewerWelcome({
  form,
  theme,
  isPreview,
  onStart,
  onFillWithAi,
}: ViewerWelcomeProps) {
  return (
    <div className="w-full text-left transition-all animate-in fade-in duration-300 min-w-0 max-w-full overflow-hidden">
      <h1
        className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl text-balance break-words [overflow-wrap:anywhere]"
        style={{ color: theme.colors.cardText }}
      >
        {form.title || "Untitled Form"}
      </h1>
      {form.description && (
        <p
          className="mt-3.5 text-base leading-relaxed sm:text-lg text-balance break-words [overflow-wrap:anywhere]"
          style={{ color: theme.colors.cardMuted }}
        >
          {form.description}
        </p>
      )}

      {form.deadline && (
        <div
          className="mt-6 inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-medium sm:text-sm"
          style={{
            borderColor: theme.colors.cardInputBorder,
            backgroundColor: theme.colors.cardInputBg,
            color: theme.colors.cardMuted,
          }}
        >
          <Clock className="size-4 shrink-0" style={{ color: theme.colors.primary }} />
          <span>
            Closes{" "}
            {new Date(form.deadline).toLocaleString([], {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </span>
        </div>
      )}

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Button
          onClick={onStart}
          className="flex h-12 cursor-pointer items-center gap-2.5 rounded-xl px-7 text-base font-semibold shadow-xs transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
          style={{
            backgroundColor: theme.colors.primary,
            color: theme.colors.primaryForeground,
          }}
          id="typeform-start-btn"
        >
          <span>Start</span>
          <ArrowRight className="size-4.5" />
        </Button>

        {onFillWithAi && (
          <Button
            onClick={onFillWithAi}
            variant="outline"
            className="flex h-12 cursor-pointer items-center rounded-xl border px-6 text-base font-semibold shadow-xs transition-all duration-150 hover:opacity-90 active:scale-[0.98]"
            style={{
              borderColor: theme.colors.cardInputBorder,
              backgroundColor: theme.colors.cardInputBg,
              color: theme.colors.cardText,
            }}
            id="fill-with-grizzy-btn"
          >
            <span>Fill with Grizzy</span>
          </Button>
        )}

        {isPreview && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium shadow-2xs"
            style={{
              backgroundColor: theme.colors.badgeBg,
              color: theme.colors.badgeText,
              borderColor: theme.colors.cardInputBorder,
            }}
          >
            <Eye className="size-3.5" />
            Preview Mode
          </span>
        )}
      </div>
    </div>
  );
}
