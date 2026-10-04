"use client";

import * as React from "react";
import {
  Calendar,
  Clock,
  Globe,
  Hash,
  Mail,
  Phone,
  Type,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import type { Question } from "@/types/builder";
import type { FormThemeResolved } from "@/lib/builder-themes";
import { ChoiceInput } from "./choice-input";
import { FileInput } from "./file-input";
import { RatingInput } from "./rating-input";

interface TypeformInputProps {
  question: Question;
  theme: FormThemeResolved;
  value: unknown;
  onChange: (value: unknown) => void;
  onSubmit?: (value?: unknown) => void;
  hasError?: boolean;
  isDark?: boolean;
}

export function TypeformInput({
  question,
  theme,
  value,
  onChange,
  onSubmit,
  hasError = false,
  isDark = false,
}: TypeformInputProps) {
  const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);
  const stringValue = typeof value === "string" ? value : "";
  const numberValue = typeof value === "number" ? value : "";

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      document.getElementById(`q-input-${question.id}`)?.focus();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [question.id]);

  // Choice-based questions
  if (["select", "radio", "checkbox", "multi_select", "yes_no"].includes(question.type)) {
    return (
      <ChoiceInput
        question={question}
        theme={theme}
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
        isDark={isDark}
        hasError={hasError}
      />
    );
  }

  // Rating question
  if (question.type === "rating") {
    return (
      <RatingInput
        question={question}
        theme={theme}
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
        isDark={isDark}
      />
    );
  }

  // Scale question (e.g. 1-10 or 1-5 NPS)
  if (question.type === "scale") {
    const min = question.validation?.minScale ?? 1;
    const max = question.validation?.maxScale ?? 10;
    const current = typeof value === "number" ? value : min;

    if (max - min > 9) {
      return (
        <div className="w-full max-w-md space-y-4">
          <div className="flex items-center justify-between text-sm">
            <span
              className="font-mono text-2xl font-bold transition-colors"
              style={{ color: theme.colors.primary }}
            >
              {current}
            </span>
            <span
              className="font-mono text-xs font-medium"
              style={{ color: theme.colors.cardMuted }}
            >
              Range: {min} – {max}
            </span>
          </div>
          <div
            className="rounded-xl border p-4 transition-colors"
            style={{
              backgroundColor: theme.colors.cardInputBg,
              borderColor: theme.colors.cardInputBorder,
            }}
          >
            <Slider
              value={[current]}
              min={min}
              max={max}
              step={1}
              onValueChange={([next]) => onChange(next)}
              className="cursor-pointer"
            />
          </div>
        </div>
      );
    }

    const steps = Array.from({ length: max - min + 1 }, (_, index) => min + index);

    return (
      <div className="w-full max-w-md space-y-3">
        <div className="flex flex-wrap gap-2.5">
          {steps.map((item) => {
            const isSelected = current === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => {
                  onChange(item);
                  window.setTimeout(() => onSubmit?.(item), 180);
                }}
                className={cn(
                  "flex size-11 cursor-pointer items-center justify-center rounded-xl border text-sm font-semibold transition-all duration-150 active:scale-95",
                  isSelected ? "scale-105 shadow-sm" : "hover:scale-102",
                )}
                style={{
                  backgroundColor: isSelected ? theme.colors.primary : theme.colors.cardInputBg,
                  borderColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.cardInputBorder,
                  color: isSelected
                    ? theme.colors.primaryForeground
                    : theme.colors.cardText,
                  boxShadow: isSelected
                    ? `0 4px 14px color-mix(in oklch, ${theme.colors.primary} 30%, transparent)`
                    : "none",
                }}
              >
                {item}
              </button>
            );
          })}
        </div>
        <div
          className="flex justify-between px-1 text-xs"
          style={{ color: theme.colors.cardMuted }}
        >
          <span>Not likely</span>
          <span>Extremely likely</span>
        </div>
      </div>
    );
  }

  // File upload question
  if (question.type === "file") {
    return (
      <FileInput
        question={question}
        theme={theme}
        value={value}
        onChange={onChange}
        isDark={isDark}
      />
    );
  }

  // Multiline Text (textarea / paragraph)
  const isLongText = question.type === "textarea" || question.type === "paragraph";
  if (isLongText) {
    return (
      <div className="w-full">
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          id={`q-input-${question.id}`}
          value={stringValue}
          rows={4}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
              event.preventDefault();
              onSubmit?.(stringValue);
            }
          }}
          placeholder={question.placeholder || "Type your answer here..."}
          className="min-h-32 max-h-72 w-full resize-y rounded-xl border p-4 text-base leading-relaxed outline-none transition-all duration-200 sm:text-lg"
          style={{
            backgroundColor: theme.colors.cardInputBg,
            borderColor: hasError
              ? "var(--destructive)"
              : isFocused
                ? theme.colors.cardBorderSelected || theme.colors.primary
                : theme.colors.cardInputBorder,
            color: theme.colors.cardText,
            boxShadow: isFocused
              ? `0 0 0 3px color-mix(in oklch, ${theme.colors.primary} 22%, transparent)`
              : "none",
          }}
        />
        <div
          className="mt-2.5 flex items-center justify-between text-xs"
          style={{ color: theme.colors.cardMuted }}
        >
          <span className="flex items-center gap-1">
            <Kbd
              className="px-1.5 py-0.5 text-[10px]"
              style={{
                backgroundColor: theme.colors.badgeBg,
                color: theme.colors.badgeText,
                borderColor: theme.colors.cardInputBorder,
              }}
            >
              Shift
            </Kbd>
            <span>+</span>
            <Kbd
              className="px-1.5 py-0.5 text-[10px]"
              style={{
                backgroundColor: theme.colors.badgeBg,
                color: theme.colors.badgeText,
                borderColor: theme.colors.cardInputBorder,
              }}
            >
              Enter
            </Kbd>
            <span>for new line</span>
          </span>
          <span className="flex items-center gap-1">
            <Kbd
              className="px-1.5 py-0.5 text-[10px]"
              style={{
                backgroundColor: theme.colors.badgeBg,
                color: theme.colors.badgeText,
                borderColor: theme.colors.cardInputBorder,
              }}
            >
              Ctrl
            </Kbd>
            <span>+</span>
            <Kbd
              className="px-1.5 py-0.5 text-[10px]"
              style={{
                backgroundColor: theme.colors.badgeBg,
                color: theme.colors.badgeText,
                borderColor: theme.colors.cardInputBorder,
              }}
            >
              Enter
            </Kbd>
            <span>to submit</span>
          </span>
        </div>
      </div>
    );
  }

  // Single-line inputs: text, email, phone, url, number, date, time, datetime
  const inputType =
    question.type === "email"
      ? "email"
      : question.type === "phone"
        ? "tel"
        : question.type === "url"
          ? "url"
          : question.type === "number"
            ? "number"
            : question.type === "date"
              ? "date"
              : question.type === "time"
                ? "time"
                : question.type === "datetime"
                  ? "datetime-local"
                  : "text";

  const inputValue = question.type === "number" ? numberValue : stringValue;

  const renderIcon = () => {
    const iconClass = "size-5 shrink-0 transition-colors";
    const iconStyle = {
      color: isFocused ? theme.colors.primary : theme.colors.cardMuted,
    };

    switch (question.type) {
      case "email":
        return <Mail className={iconClass} style={iconStyle} />;
      case "phone":
        return <Phone className={iconClass} style={iconStyle} />;
      case "url":
        return <Globe className={iconClass} style={iconStyle} />;
      case "number":
        return <Hash className={iconClass} style={iconStyle} />;
      case "date":
        return <Calendar className={iconClass} style={iconStyle} />;
      case "time":
      case "datetime":
        return <Clock className={iconClass} style={iconStyle} />;
      default:
        return <Type className={iconClass} style={iconStyle} />;
    }
  };

  return (
    <div className="relative w-full">
      <div className="flex items-center gap-3">
        {renderIcon()}
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type={inputType}
          id={`q-input-${question.id}`}
          value={inputValue}
          min={question.validation?.min}
          max={question.validation?.max}
          step={question.validation?.step ?? "any"}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(event) =>
            onChange(
              question.type === "number"
                ? event.target.value === ""
                  ? ""
                  : Number(event.target.value)
                : event.target.value,
            )
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              onSubmit?.(inputValue);
            }
          }}
          placeholder={question.placeholder || "Type your answer here..."}
          className="w-full bg-transparent py-2.5 text-xl font-normal outline-none transition-colors sm:text-2xl"
          style={{
            color: theme.colors.cardText,
            colorScheme: isDark ? "dark" : "light",
          }}
        />
      </div>

      {/* Styled Theme Bottom Border */}
      <div
        className="mt-1 h-0.5 w-full rounded-full transition-all duration-200"
        style={{
          backgroundColor: hasError
            ? "var(--destructive)"
            : isFocused
              ? theme.colors.primary
              : stringValue
                ? theme.colors.cardBorderSelected || theme.colors.primary
                : theme.colors.cardInputBorder,
          boxShadow: isFocused
            ? `0 1px 8px color-mix(in oklch, ${theme.colors.primary} 30%, transparent)`
            : "none",
        }}
      />
    </div>
  );
}

