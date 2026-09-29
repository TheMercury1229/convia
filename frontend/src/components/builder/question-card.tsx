"use client";

import * as React from "react";
import { useDrag } from "react-dnd";
import {
  GripVertical,
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  Mail,
  Type,
  AlignJustify,
  Hash,
  Phone,
  Link,
  ChevronDown,
  ListFilter,
  CircleDot,
  CheckSquare,
  ToggleLeft,
  Calendar,
  Clock,
  CalendarClock,
  Upload,
  Star,
  Sliders,
  Heading1,
  AlignLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useBuilderStore } from "@/store/builder-store";
import { DND_TYPES, type QuestionDragItem } from "./dnd-types";
import type { Question, QuestionType } from "@/types/builder";
import { useTheme } from "next-themes";
import { getFormTheme, type FormThemeResolved } from "@/lib/builder-themes";

// ─────────────────────────────────────────────────────────
// Icon / label maps
// ─────────────────────────────────────────────────────────

export const TYPE_ICONS: Record<QuestionType, React.ElementType> = {
  heading: Heading1,
  paragraph: AlignLeft,
  text: Type,
  textarea: AlignJustify,
  email: Mail,
  number: Hash,
  phone: Phone,
  url: Link,
  select: ChevronDown,
  multi_select: ListFilter,
  radio: CircleDot,
  checkbox: CheckSquare,
  yes_no: ToggleLeft,
  date: Calendar,
  time: Clock,
  datetime: CalendarClock,
  rating: Star,
  scale: Sliders,
  file: Upload,
};

export const TYPE_LABELS: Record<QuestionType, string> = {
  heading: "Heading",
  paragraph: "Paragraph",
  text: "Short Text",
  textarea: "Long Text",
  email: "Email",
  number: "Number",
  phone: "Phone",
  url: "Website / URL",
  select: "Dropdown",
  multi_select: "Multi Select",
  radio: "Single Choice",
  checkbox: "Multiple Choice",
  yes_no: "Yes / No",
  date: "Date",
  time: "Time",
  datetime: "Date & Time",
  rating: "Rating",
  scale: "Opinion Scale",
  file: "File Upload",
};

// ─────────────────────────────────────────────────────────
// Question field preview (read-only visual)
// ─────────────────────────────────────────────────────────

function QuestionPreview({ question, theme }: { question: Question; theme: FormThemeResolved }) {
  const base =
    "mt-2 w-full rounded-md border px-3.5 py-2 text-sm pointer-events-none select-none";
  const inputStyle: React.CSSProperties = {
    backgroundColor: theme.colors.cardInputBg,
    borderColor: theme.colors.cardInputBorder,
    color: theme.colors.cardMuted,
  };

  switch (question.type) {
    case "heading":
      return (
        <p className="mt-1.5 text-lg font-semibold" style={{ color: theme.colors.cardText }}>
          {question.label || "Heading"}
        </p>
      );
    case "paragraph":
      return (
        <div className={cn(base, "min-h-24 py-2.5 flex flex-col justify-between")} style={inputStyle}>
          <span>{question.placeholder || "Long-form response / essay answer…"}</span>
          <span className="text-[11px] opacity-50 text-right">Paragraph</span>
        </div>
      );
    case "textarea":
      return (
        <div className={cn(base, "h-16")} style={inputStyle}>{question.placeholder || "Long text answer…"}</div>
      );
    case "select":
      return (
        <div className={cn(base, "flex items-center justify-between")} style={inputStyle}>
          <span>{question.placeholder || "Select an option"}</span>
          <ChevronDown className="size-4 opacity-50" />
        </div>
      );
    case "multi_select":
      return (
        <div className={cn(base, "flex items-center justify-between")} style={inputStyle}>
          <span>{question.placeholder || "Select options"}</span>
          <ListFilter className="size-4 opacity-50" />
        </div>
      );
    case "radio":
      return (
        <div className="mt-2 flex flex-col gap-1.5 pointer-events-none">
          {question.options.slice(0, 3).map((opt) => (
            <div key={opt.id} className="flex items-center gap-2">
              <div
                className="size-4 rounded-full border"
                style={{ borderColor: theme.colors.cardInputBorder }}
              />
              <span className="text-sm" style={{ color: theme.colors.cardMuted }}>{opt.label}</span>
            </div>
          ))}
        </div>
      );
    case "checkbox":
      return (
        <div className="mt-2 flex flex-col gap-1.5 pointer-events-none">
          {question.options.slice(0, 3).map((opt) => (
            <div key={opt.id} className="flex items-center gap-2">
              <div
                className="size-4 rounded border"
                style={{ borderColor: theme.colors.cardInputBorder }}
              />
              <span className="text-sm" style={{ color: theme.colors.cardMuted }}>{opt.label}</span>
            </div>
          ))}
        </div>
      );
    case "yes_no":
      return (
        <div className="mt-2 flex gap-2 pointer-events-none">
          <div className="rounded-md border px-4 py-1.5 text-sm font-medium" style={inputStyle}>
            Yes
          </div>
          <div className="rounded-md border px-4 py-1.5 text-sm font-medium" style={inputStyle}>
            No
          </div>
        </div>
      );
    case "rating": {
      const starCount = question.validation?.maxRating === 10 ? 10 : 5;
      return (
        <div className="mt-2 flex gap-1.5 pointer-events-none">
          {Array.from({ length: starCount }, (_, i) => (
            <Star key={i} className="size-5 opacity-30" style={{ color: theme.colors.primary }} />
          ))}
        </div>
      );
    }
    case "scale": {
      const min = question.validation?.minScale ?? 1;
      const max = question.validation?.maxScale ?? 10;
      const steps = Array.from(
        { length: Math.max(1, max - min + 1) },
        (_, i) => min + i,
      );
      return (
        <div className="mt-2 flex flex-col gap-1.5 pointer-events-none">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            {steps.map((num) => (
              <div
                key={num}
                className="flex size-7 items-center justify-center rounded border text-xs font-medium shrink-0"
                style={inputStyle}
              >
                {num}
              </div>
            ))}
          </div>
          {(question.validation?.minLabel || question.validation?.maxLabel) && (
            <div
              className="flex items-center justify-between text-xs px-0.5"
              style={{ color: theme.colors.cardMuted }}
            >
              <span>{question.validation?.minLabel}</span>
              <span>{question.validation?.maxLabel}</span>
            </div>
          )}
        </div>
      );
    }
    case "file":
      return (
        <div
          className="mt-2 flex flex-col items-center justify-center rounded-md border border-dashed py-3 px-3 pointer-events-none text-center"
          style={{ borderColor: theme.colors.cardInputBorder }}
        >
          <span className="text-xs font-medium" style={{ color: theme.colors.cardText }}>
            Drop file or click to upload
          </span>
          <span className="text-[11px] mt-0.5" style={{ color: theme.colors.cardMuted }}>
            {question.validation?.allowedExtensions
              ? `Allowed: ${question.validation.allowedExtensions}`
              : "Any file type"}{" "}
            • Max {question.validation?.maxFileSizeMB ?? 10}MB
          </span>
        </div>
      );
    case "date":
      return (
        <div className={cn(base, "flex items-center justify-between")} style={inputStyle}>
          <span>DD / MM / YYYY</span>
          <Calendar className="size-4 opacity-50" />
        </div>
      );
    case "time":
      return (
        <div className={cn(base, "flex items-center justify-between")} style={inputStyle}>
          <span>HH : MM</span>
          <Clock className="size-4 opacity-50" />
        </div>
      );
    case "datetime":
      return (
        <div className={cn(base, "flex items-center justify-between")} style={inputStyle}>
          <span>DD / MM / YYYY, --:--</span>
          <CalendarClock className="size-4 opacity-50" />
        </div>
      );
    case "email":
      return (
        <div className={cn(base, "flex items-center gap-2")} style={inputStyle}>
          <Mail className="size-3.5 opacity-50" />
          <span>{question.placeholder || "name@example.com"}</span>
        </div>
      );
    case "phone":
      return (
        <div className={cn(base, "flex items-center gap-2")} style={inputStyle}>
          <Phone className="size-3.5 opacity-50" />
          <span>{question.placeholder || "+1 (555) 000-0000"}</span>
        </div>
      );
    case "url":
      return (
        <div className={cn(base, "flex items-center gap-2")} style={inputStyle}>
          <Link className="size-3.5 opacity-50" />
          <span>{question.placeholder || "https://example.com"}</span>
        </div>
      );
    case "number":
      return (
        <div className={cn(base, "flex items-center gap-2")} style={inputStyle}>
          <Hash className="size-3.5 opacity-50" />
          <span>{question.placeholder || "123"}</span>
        </div>
      );
    default:
      return <div className={base} style={inputStyle}>{question.placeholder || "Your answer"}</div>;
  }
}

// ─────────────────────────────────────────────────────────
// QuestionCard — drag source ONLY (no drop target here)
// ─────────────────────────────────────────────────────────

interface QuestionCardProps {
  question: Question;
  /** Position index within the section (used as drag item payload) */
  index: number;
  isFirst?: boolean;
  isLast?: boolean;
}

export function QuestionCard({
  question,
  index,
  isFirst = false,
  isLast = false,
}: QuestionCardProps) {
  const {
    form,
    selectedElement,
    selectElement,
    deleteQuestion,
    duplicateQuestion,
    moveQuestionUp,
    moveQuestionDown,
  } = useBuilderStore();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const currentTheme = getFormTheme(form.themeId || "nova", isDark);
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
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

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
        "group relative rounded-lg border transition-all duration-150 cursor-pointer",
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

      {/* Content */}
      <div className="pl-8 pr-4 py-3.5">
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

            <div className="mx-0.5 h-3.5 w-px bg-border/60" />

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
        </div>

        {/* Label */}
        {question.type !== "heading" && (
          <p
            className="mt-1.5 text-base font-semibold leading-snug"
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
            className="mt-1.5 text-xs leading-relaxed"
            style={{ color: currentTheme.colors.cardMuted }}
          >
            {question.description}
          </p>
        )}
      </div>
    </div>
  );
}
