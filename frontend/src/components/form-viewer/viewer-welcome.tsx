"use client";

import { ArrowRight, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FormWithSections } from "@/lib/api/forms";
import type { FormThemeResolved } from "@/lib/builder-themes";

import { Kbd } from "@/components/ui/kbd";

interface ViewerWelcomeProps {
  form: FormWithSections;
  theme: FormThemeResolved;
  isPreview: boolean;
  firstSectionInfo: { title: string | null; description: string | null } | null;
  onStart: () => void;
}

export function ViewerWelcome({
  form,
  theme,
  isPreview,
  firstSectionInfo,
  onStart,
}: ViewerWelcomeProps) {
  return (
    <div className="w-full text-left transition-all animate-in fade-in duration-300">
      <h1
        className="font-heading text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl md:text-5xl"
        style={{ color: theme.colors.cardText }}
      >
        {form.title || "Untitled Form"}
      </h1>
      {form.description && (
        <p
          className="mt-3.5 text-base leading-relaxed sm:text-lg"
          style={{ color: theme.colors.cardMuted }}
        >
          {form.description}
        </p>
      )}

      {firstSectionInfo && (
        <div
          className="mt-7 rounded-2xl border p-5 transition-colors"
          style={{
            backgroundColor: theme.colors.cardInputBg,
            borderColor: theme.colors.cardInputBorder,
          }}
        >
          {firstSectionInfo.title && (
            <h2
              className="font-heading text-lg font-bold tracking-tight sm:text-xl"
              style={{ color: theme.colors.cardText }}
            >
              {firstSectionInfo.title}
            </h2>
          )}
          {firstSectionInfo.description && (
            <p
              className="mt-1 text-sm leading-relaxed"
              style={{ color: theme.colors.cardMuted }}
            >
              {firstSectionInfo.description}
            </p>
          )}
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

        <div
          className="flex items-center gap-1.5 text-xs select-none"
          style={{ color: theme.colors.cardMuted }}
        >
          <span>press</span>
          <Kbd
            className="px-1.5 py-0.5 text-[10px]"
            style={{
              backgroundColor: theme.colors.badgeBg,
              color: theme.colors.badgeText,
              borderColor: theme.colors.cardInputBorder,
            }}
          >
            Enter ↵
          </Kbd>
        </div>

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
