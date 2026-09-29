import * as React from "react";
import {
  ChevronDown,
  ListFilter,
  Star,
  Calendar,
  Clock,
  CalendarClock,
  Mail,
  Phone,
  Link,
  Hash,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Question } from "@/types/builder";
import type { FormThemeResolved } from "@/lib/builder-themes";

export interface QuestionPreviewProps {
  question: Question;
  theme: FormThemeResolved;
}

export function QuestionPreview({ question, theme }: QuestionPreviewProps) {
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
