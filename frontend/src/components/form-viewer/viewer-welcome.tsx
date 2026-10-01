"use client";

import { ArrowRight, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { FormWithSections } from "@/lib/api/forms";
import type { FormThemeResolved } from "@/lib/builder-themes";

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
    <div className="w-full text-left">
      <h1
        className="font-heading text-2xl font-bold leading-tight tracking-tight sm:text-3xl md:text-4xl"
        style={{ color: theme.colors.cardText }}
      >
        {form.title || "Untitled Form"}
      </h1>
      {form.description && (
        <p className="mt-3 text-base leading-relaxed sm:text-lg" style={{ color: theme.colors.cardMuted }}>
          {form.description}
        </p>
      )}
      {firstSectionInfo && (
        <div className="mt-6">
          {firstSectionInfo.title && (
            <h2 className="font-heading text-lg font-bold tracking-tight sm:text-xl" style={{ color: theme.colors.cardText }}>
              {firstSectionInfo.title}
            </h2>
          )}
          {firstSectionInfo.description && (
            <p className="mt-1 text-sm leading-relaxed sm:text-base" style={{ color: theme.colors.cardMuted }}>
              {firstSectionInfo.description}
            </p>
          )}
        </div>
      )}
      <div className="mt-8 flex items-center gap-4">
        <Button
          onClick={onStart}
          className="flex h-11 cursor-pointer items-center gap-2 rounded-xl px-6 text-sm font-semibold transition-all duration-150 hover:opacity-90 active:scale-[0.98] sm:text-base"
          style={{ backgroundColor: theme.colors.primary, color: theme.colors.primaryForeground }}
          id="typeform-start-btn"
        >
          <span>Start</span>
          <ArrowRight className="size-4" />
        </Button>
        {isPreview && (
          <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1 text-xs font-medium">
            <Eye className="size-3" />
            Preview Mode
          </Badge>
        )}
      </div>
    </div>
  );
}
