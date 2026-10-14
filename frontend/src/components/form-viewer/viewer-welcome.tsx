"use client";

import * as React from "react";
import { ArrowRight, Calendar, Clock, Eye } from "lucide-react";
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
  const totalQuestions = React.useMemo(() => {
    return (
      form.sections?.reduce((acc, s) => {
        const qs = s.questions?.filter((q) => q.type !== "heading") || [];
        return acc + qs.length;
      }, 0) || 0
    );
  }, [form.sections]);

  const estimatedMinutes = Math.max(1, Math.ceil(totalQuestions * 0.4));
  const expectedTimeText =
    totalQuestions <= 1 ? "~1 min to fill" : `~${estimatedMinutes} mins to fill`;

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

      {/* Form Metadata Badges: Expected Time to Fill & Deadline */}
      <div className="mt-6 flex flex-wrap items-center gap-2.5">
        <div
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow-2xs transition-colors"
          style={{
            borderColor: theme.colors.cardInputBorder,
            backgroundColor: theme.colors.cardInputBg,
            color: theme.colors.cardMuted,
          }}
          title="Estimated time to complete this form"
        >
          <Clock className="size-3.5 shrink-0" style={{ color: theme.colors.primary }} />
          <span>{expectedTimeText}</span>
        </div>

        {form.deadline && (
          <div
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium shadow-2xs transition-colors"
            style={{
              borderColor: theme.colors.cardInputBorder,
              backgroundColor: theme.colors.cardInputBg,
              color: theme.colors.cardMuted,
            }}
          >
            <Calendar className="size-3.5 shrink-0" style={{ color: theme.colors.primary }} />
            <span>
              Closes{" "}
              {new Date(form.deadline).toLocaleString([], {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </span>
          </div>
        )}
      </div>

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

        {!isPreview && onFillWithAi && (
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
