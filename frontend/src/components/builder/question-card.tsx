"use client";

import * as React from "react";
import { useDrag } from "react-dnd";
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  Type,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useBuilderStore, useBuilderTheme } from "@/store/builder-store";
import { DND_TYPES, type QuestionDragItem } from "./dnd-types";
import type { Question } from "@/types/builder";
import { type FormThemeResolved } from "@/lib/builder-themes";
import { TYPE_ICONS, TYPE_LABELS } from "@/lib/question-registry";
import { QuestionPreview } from "./question-preview";

export { TYPE_ICONS, TYPE_LABELS, QuestionPreview };

// ─────────────────────────────────────────────────────────
// QuestionCard — drag source ONLY (no drop target here)
// ─────────────────────────────────────────────────────────

export interface QuestionCardProps {
  question: Question;
  /** Position index within the section (used as drag item payload) */
  index: number;
  isFirst?: boolean;
  isLast?: boolean;
  theme?: FormThemeResolved;
}

export function QuestionCard({
  question,
  index,
  isFirst = false,
  isLast = false,
  theme: propTheme,
}: QuestionCardProps) {
  const {
    selectedElement,
    selectElement,
    deleteQuestion,
    duplicateQuestion,
    moveQuestionUp,
    moveQuestionDown,
    readOnly,
  } = useBuilderStore();
  const fallbackTheme = useBuilderTheme();
  const currentTheme = propTheme ?? fallbackTheme;
  const isSelected = selectedElement?.id === question.id;

  const TypeIcon = TYPE_ICONS[question.type] ?? Type;

  // Only a drag source — no drop target on the card itself.
  // All drop logic lives in QuestionDropSlot between cards.
  const [{ isDragging }, drag, dragPreview] = useDrag<
    QuestionDragItem,
    void,
    { isDragging: boolean }
  >(() => ({
    type: DND_TYPES.QUESTION_CARD,
    item: () => ({
      type: DND_TYPES.QUESTION_CARD,
      questionId: question.id,
      sectionId: question.sectionId,
      index,
    }),
    canDrag: () => !readOnly,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }), [question.id, question.sectionId, index, readOnly]);

  const cardRef = React.useRef<HTMLDivElement>(null);
  dragPreview(cardRef);

  return (
    <div
      ref={cardRef}
      onClick={(e) => {
        e.stopPropagation();
        selectElement({ type: "question", id: question.id });
      }}
      className={cn(
        "group relative rounded-lg border transition-all duration-150 cursor-pointer min-w-0 max-w-full overflow-hidden",
        !isSelected && "hover:border-foreground/20",
        isDragging && "opacity-30",
      )}
      style={{
        backgroundColor: currentTheme.colors.cardBg,
        borderColor: isSelected
          ? `color-mix(in oklch, ${currentTheme.colors.cardBorder} 65%, ${currentTheme.colors.primary} 35%)`
          : currentTheme.colors.cardBorder,
        borderWidth: "1px",
        color: currentTheme.colors.cardText,
      }}
    >
      {/* Drag handle */}
      {!readOnly && (
        <div
          ref={drag as unknown as React.Ref<HTMLDivElement>}
          className={cn(
            "absolute left-0 top-0 bottom-0 flex w-8 cursor-grab items-center justify-center",
            "opacity-0 group-hover:opacity-100 transition-opacity active:cursor-grabbing",
          )}
          onClick={(e) => e.stopPropagation()}
          title="Drag to reorder"
        >
          <GripVertical className="size-4" style={{ color: currentTheme.colors.cardMuted }} />
        </div>
      )}

      {/* Content */}
      <div className={cn(readOnly ? "px-4" : "pl-8 pr-4", "py-3.5 min-w-0 overflow-hidden")}>
        {/* Type badge row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <div
              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-medium"
              style={{
                backgroundColor: currentTheme.colors.badgeBg,
                color: currentTheme.colors.badgeText,
              }}
            >
              <TypeIcon className="size-3 shrink-0" />
              <span className="text-[11px] font-semibold uppercase tracking-wider">
                {TYPE_LABELS[question.type]}
              </span>
            </div>
          </div>

          {/* Inline actions — appear on hover or when selected */}
          {!readOnly && (
            <div
              className={cn(
                "flex items-center gap-0.5 transition-opacity shrink-0",
                isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
              )}
            >
            <Button
              variant="ghost"
              size="icon-xs"
              className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:pointer-events-none"
              onClick={(e) => {
                e.stopPropagation();
                moveQuestionUp(question.id);
              }}
              disabled={isFirst}
              title="Move up"
            >
              <ArrowUp className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:pointer-events-none"
              onClick={(e) => {
                e.stopPropagation();
                moveQuestionDown(question.id);
              }}
              disabled={isLast}
              title="Move down"
            >
              <ArrowDown className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                duplicateQuestion(question.id);
              }}
              title="Duplicate"
            >
              <Copy className="size-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-xs"
              className="h-7 w-7 text-destructive/60 hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation();
                deleteQuestion(question.id);
              }}
              title="Delete"
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
          )}
        </div>

        {/* Label */}
        {question.type !== "heading" && (
          <p
            className="mt-1.5 text-base font-semibold leading-snug break-words"
            style={{ color: currentTheme.colors.cardText }}
          >
            {question.label}
            {question.required && (
              <span
                className="ml-0.5"
                style={{ color: currentTheme.colors.primary }}
                aria-label="required"
              >
                *
              </span>
            )}
          </p>
        )}

        {/* Field preview */}
        <QuestionPreview question={question} theme={currentTheme} />

        {/* Description hint */}
        {question.description && question.type !== "heading" && (
          <p
            className="mt-1.5 text-xs leading-relaxed break-words"
            style={{ color: currentTheme.colors.cardMuted }}
          >
            {question.description}
          </p>
        )}
      </div>
    </div>
  );
}
