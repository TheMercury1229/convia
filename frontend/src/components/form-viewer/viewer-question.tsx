"use client";

import { AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { TypeformInput } from "./typeform-input";
import type { FormThemeResolved } from "@/lib/builder-themes";
import type { FlatQuestionItem } from "./viewer-types";

interface ViewerQuestionProps {
  item: FlatQuestionItem;
  theme: FormThemeResolved;
  isDark: boolean;
  currentIndex: number;
  isLastQuestion: boolean;
  isMultiline: boolean;
  value: unknown;
  error: string | null;
  shake: boolean;
  onAnswerChange: (value: unknown) => void;
  onNext: (value?: unknown) => void;
}

export function ViewerQuestion({
  item,
  theme,
  isDark,
  currentIndex,
  isLastQuestion,
  isMultiline,
  value,
  error,
  shake,
  onAnswerChange,
  onNext,
}: ViewerQuestionProps) {
  const isHeading = item.question.type === "heading";
  const sectionTitle = item.sectionTitle?.trim() || "";
  const sectionDescription = item.sectionDescription?.trim() || "";
  const hasSectionTitle = sectionTitle && sectionTitle.toLowerCase() !== "untitled section";
  const showSection = item.isFirstQuestionOfSection && item.sectionIndex > 0 && (hasSectionTitle || sectionDescription);

  return (
    <div className={`w-full transition-all animate-in fade-in duration-300 ${shake ? "animate-shake" : ""}`}>
      {showSection && (
        <div className="mb-6 text-left">
          {item.totalSections > 1 && (
            <span className="mb-1.5 block text-xs font-mono font-semibold uppercase tracking-wider" style={{ color: theme.colors.primary }}>
              Section {item.sectionIndex + 1}
            </span>
          )}
          {hasSectionTitle && <h3 className="font-heading mt-1 text-lg font-bold tracking-tight sm:text-xl" style={{ color: theme.colors.cardText }}>{sectionTitle}</h3>}
          {sectionDescription && <p className="mt-1 text-xs leading-relaxed sm:text-sm" style={{ color: theme.colors.cardMuted }}>{sectionDescription}</p>}
        </div>
      )}

      {isHeading ? (
        <div className="mb-6 text-left">
          <h2 className="font-heading text-xl font-bold tracking-tight sm:text-2xl md:text-3xl" style={{ color: theme.colors.cardText }}>{item.question.label || "Untitled Section"}</h2>
          {item.question.description && <p className="mt-2 text-sm leading-relaxed sm:text-base" style={{ color: theme.colors.cardMuted }}>{item.question.description}</p>}
        </div>
      ) : (
        <div className="mb-4 text-left">
          <h2 className="font-heading flex items-start gap-3 text-xl font-semibold leading-snug tracking-tight sm:text-2xl md:text-3xl" style={{ color: theme.colors.cardText }}>
            <span className="shrink-0 pt-0.5 font-mono text-base font-semibold sm:text-lg" style={{ color: theme.colors.primary }}>{currentIndex + 1} ➔</span>
            <span>{item.question.label || "Untitled Question"}{item.question.required && <span className="ml-1 font-bold text-destructive" title="Required">*</span>}</span>
          </h2>
          {item.question.description && <p className="mt-1.5 pl-7 text-sm leading-relaxed sm:text-base" style={{ color: theme.colors.cardMuted }}>{item.question.description}</p>}
        </div>
      )}

      {!isHeading && (
        <div className="mt-6 pl-0 sm:mt-7 sm:pl-7">
          <TypeformInput
            key={item.question.id}
            question={item.question}
            theme={theme}
            value={value}
            onChange={onAnswerChange}
            onSubmit={onNext}
            hasError={Boolean(error)}
            isDark={isDark}
          />
          {error && (
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive sm:text-sm" role="alert">
              <AlertCircle className="size-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}

      <div className="mt-7 flex items-center gap-4 pl-0 sm:mt-8 sm:pl-7">
        <Button
          onClick={() => onNext()}
          className="flex h-10 cursor-pointer items-center gap-2 rounded-xl px-5 text-sm font-medium shadow-xs transition-all duration-150 hover:opacity-90 active:scale-[0.98] sm:text-base"
          style={{ backgroundColor: theme.colors.primary, color: theme.colors.primaryForeground }}
          id="typeform-next-btn"
        >
          <span>{isHeading ? "Continue" : isLastQuestion ? "Submit Form" : "Next"}</span>
          <ArrowRight className="size-4" />
        </Button>
        <div className="flex items-center gap-1.5 text-xs select-none" style={{ color: theme.colors.cardMuted }}>
          <span>press</span>
          {isMultiline ? <span className="flex items-center gap-1"><Kbd className="px-1.5 py-0.5 text-[10px]">Ctrl</Kbd><span>+</span><Kbd className="px-1.5 py-0.5 text-[10px]">Enter</Kbd></span> : <Kbd className="px-1.5 py-0.5 text-[10px]">Enter ↵</Kbd>}
        </div>
      </div>
    </div>
  );
}
