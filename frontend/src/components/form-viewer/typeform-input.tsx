"use client";

import * as React from "react";
import {
  Star,
  Upload,
  X,
  FileIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Question } from "@/types/builder";
import type { FormThemeResolved } from "@/lib/builder-themes";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Kbd } from "@/components/ui/kbd";

interface TypeformInputProps {
  question: Question;
  theme: FormThemeResolved;
  value: unknown;
  onChange: (value: unknown) => void;
  onSubmit?: (val?: unknown) => void;
  hasError?: boolean;
  isDark?: boolean;
}

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"];

function RatingInput({
  question,
  theme,
  value,
  onChange,
  onSubmit,
  isDark = false,
}: {
  question: Question;
  theme: FormThemeResolved;
  value: unknown;
  onChange: (value: unknown) => void;
  onSubmit?: (val?: unknown) => void;
  isDark?: boolean;
}) {
  const max = question.validation?.maxRating || 5;
  const currentRating = typeof value === "number" ? value : 0;
  const [hoverRating, setHoverRating] = React.useState(0);

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 py-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => {
        const isFilled = star <= (hoverRating || currentRating);
        return (
          <button
            key={star}
            type="button"
            id={`rating-star-${question.id}-${star}`}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => {
              onChange(star);
              setTimeout(() => onSubmit?.(star), 180);
            }}
            className="group p-1.5 rounded-lg transition-transform duration-150 hover:scale-115 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label={`${star} star`}
          >
            <Star
              className={cn(
                "size-7 sm:size-8 transition-colors duration-150",
                isFilled ? "fill-current" : "fill-none"
              )}
              style={{
                color: isFilled
                  ? theme.colors.primary
                  : isDark
                  ? "rgba(255, 255, 255, 0.25)"
                  : "rgba(0, 0, 0, 0.2)",
              }}
            />
          </button>
        );
      })}
    </div>
  );
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

  // Auto-focus input on question load
  React.useEffect(() => {
    setIsFocused(false);
    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      } else {
        const el = document.getElementById(`q-input-${question.id}`);
        el?.focus();
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [question.id]);

  const strValue = typeof value === "string" ? value : "";
  const arrValue = Array.isArray(value) ? value : [];
  const numValue = typeof value === "number" ? value : "";

  // Dynamic high-contrast border & background tokens
  const idleBorder = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)";
  const idleBg = isDark ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.02)";
  const placeholderColor = isDark ? "rgba(255, 255, 255, 0.4)" : "rgba(15, 23, 42, 0.4)";

  switch (question.type) {
    case "text":
    case "email":
    case "phone":
    case "url": {
      const inputType =
        question.type === "email"
          ? "email"
          : question.type === "phone"
          ? "tel"
          : question.type === "url"
          ? "url"
          : "text";

      return (
        <div className="w-full">
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={inputType}
            id={`q-input-${question.id}`}
            value={strValue}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmit?.(strValue);
              }
            }}
            placeholder={question.placeholder || "Type your answer here…"}
            className="w-full bg-transparent px-0 py-2.5 text-lg sm:text-xl font-normal outline-none transition-colors duration-200 border-b-2 placeholder:text-muted-foreground/50"
            style={{
              color: theme.colors.cardText,
              borderColor: hasError
                ? "oklch(0.627 0.22 29)"
                : isFocused || strValue
                ? theme.colors.primary
                : idleBorder,
            }}
          />
        </div>
      );
    }

    case "number": {
      return (
        <div className="w-full">
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="number"
            id={`q-input-${question.id}`}
            value={numValue}
            min={question.validation?.min}
            max={question.validation?.max}
            step={question.validation?.step ?? "any"}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => {
              const val = e.target.value === "" ? "" : Number(e.target.value);
              onChange(val);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSubmit?.(numValue);
              }
            }}
            placeholder={question.placeholder || "0"}
            className="w-full bg-transparent px-0 py-2.5 text-lg sm:text-xl font-normal outline-none transition-colors duration-200 border-b-2 placeholder:text-muted-foreground/50"
            style={{
              color: theme.colors.cardText,
              borderColor: hasError
                ? "oklch(0.627 0.22 29)"
                : isFocused || numValue !== ""
                ? theme.colors.primary
                : idleBorder,
            }}
          />
        </div>
      );
    }

    case "textarea":
    case "paragraph": {
      return (
        <div className="w-full">
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            id={`q-input-${question.id}`}
            value={strValue}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                onSubmit?.(strValue);
              }
            }}
            rows={4}
            placeholder={
              question.placeholder ||
              (question.type === "paragraph"
                ? "Write your long-form response here…"
                : "Type your answer here…")
            }
            className="w-full resize-y rounded-xl border p-3.5 sm:p-4 text-base sm:text-lg font-normal leading-relaxed outline-none transition-all min-h-[120px] sm:min-h-[140px] max-h-[260px] shadow-xs focus-visible:ring-2 focus-visible:ring-primary/40 placeholder:text-muted-foreground/50"
            style={{
              backgroundColor: idleBg,
              borderColor: hasError
                ? "oklch(0.627 0.22 29)"
                : isFocused || strValue
                ? theme.colors.primary
                : idleBorder,
              color: theme.colors.cardText,
            }}
          />
          <div
            className="mt-2 text-xs text-muted-foreground flex items-center justify-between"
            style={{ color: theme.colors.cardMuted }}
          >
            <span className="flex items-center gap-1">
              <Kbd className="text-[10px] px-1 py-0.5">Shift</Kbd> + <Kbd className="text-[10px] px-1 py-0.5">Enter</Kbd> for new line
            </span>
            <span className="flex items-center gap-1">
              <Kbd className="text-[10px] px-1 py-0.5">Ctrl</Kbd> + <Kbd className="text-[10px] px-1 py-0.5">Enter</Kbd> to submit
            </span>
          </div>
        </div>
      );
    }

    case "radio": {
      const options = question.options || [];
      return (
        <RadioGroup
          value={strValue}
          onValueChange={(val) => {
            onChange(val);
            setTimeout(() => onSubmit?.(val), 180);
          }}
          className="w-full space-y-2"
        >
          {options.map((opt, idx) => {
            const letter = OPTION_LETTERS[idx] || `${idx + 1}`;
            const isSelected = strValue === opt.label || strValue === opt.id;

            return (
              <div
                key={opt.id || `${opt.label}-${idx}`}
                role="button"
                tabIndex={0}
                id={`radio-card-${question.id}-${idx}`}
                onClick={() => {
                  onChange(opt.label);
                  setTimeout(() => onSubmit?.(opt.label), 180);
                }}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    onChange(opt.label);
                    setTimeout(() => onSubmit?.(opt.label), 180);
                  }
                }}
                className={cn(
                  "group flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 sm:px-4 py-2.5 sm:py-3 text-left transition-all duration-150 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-primary/50 shadow-xs",
                  isSelected && "shadow-xs scale-[1.005]"
                )}
                style={{
                  backgroundColor: isSelected
                    ? `color-mix(in oklch, ${theme.colors.primary} 12%, transparent)`
                    : idleBg,
                  borderColor: isSelected ? theme.colors.primary : idleBorder,
                  color: theme.colors.cardText,
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex size-6 shrink-0 items-center justify-center rounded-md border text-xs font-mono font-semibold transition-colors"
                    style={{
                      backgroundColor: isSelected
                        ? theme.colors.primary
                        : isDark
                        ? "rgba(255, 255, 255, 0.08)"
                        : "rgba(0, 0, 0, 0.05)",
                      borderColor: isSelected
                        ? theme.colors.primary
                        : idleBorder,
                      color: isSelected
                        ? theme.colors.primaryForeground
                        : theme.colors.cardText,
                    }}
                  >
                    {letter}
                  </span>
                  <span className="text-sm sm:text-base font-medium">{opt.label}</span>
                </div>
                <RadioGroupItem
                  value={opt.label}
                  id={`radio-${question.id}-${idx}`}
                  tabIndex={-1}
                  className="size-4 shrink-0 pointer-events-none"
                  style={{
                    borderColor: isSelected ? theme.colors.primary : idleBorder,
                    backgroundColor: isSelected ? theme.colors.primary : "transparent",
                    color: theme.colors.primaryForeground,
                  }}
                />
              </div>
            );
          })}
        </RadioGroup>
      );
    }

    case "checkbox":
    case "multi_select": {
      const options = question.options || [];

      const toggleOption = (label: string) => {
        const next = arrValue.includes(label)
          ? arrValue.filter((item: string) => item !== label)
          : [...arrValue, label];
        onChange(next);
      };

      return (
        <div className="w-full space-y-2">
          {options.map((opt, idx) => {
            const letter = OPTION_LETTERS[idx] || `${idx + 1}`;
            const isSelected = arrValue.includes(opt.label);

            return (
              <div
                key={opt.id || `${opt.label}-${idx}`}
                role="button"
                tabIndex={0}
                id={`check-${question.id}-${idx}`}
                onClick={() => toggleOption(opt.label)}
                onKeyDown={(e) => {
                  if (e.key === " " || e.key === "Enter") {
                    e.preventDefault();
                    toggleOption(opt.label);
                  }
                }}
                className={cn(
                  "group flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 sm:px-4 py-2.5 sm:py-3 text-left transition-all duration-150 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-primary/50 shadow-xs",
                  isSelected && "shadow-xs scale-[1.005]"
                )}
                style={{
                  backgroundColor: isSelected
                    ? `color-mix(in oklch, ${theme.colors.primary} 12%, transparent)`
                    : idleBg,
                  borderColor: isSelected ? theme.colors.primary : idleBorder,
                  color: theme.colors.cardText,
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex size-6 shrink-0 items-center justify-center rounded-md border text-xs font-mono font-semibold transition-colors"
                    style={{
                      backgroundColor: isSelected
                        ? theme.colors.primary
                        : isDark
                        ? "rgba(255, 255, 255, 0.08)"
                        : "rgba(0, 0, 0, 0.05)",
                      borderColor: isSelected
                        ? theme.colors.primary
                        : idleBorder,
                      color: isSelected
                        ? theme.colors.primaryForeground
                        : theme.colors.cardText,
                    }}
                  >
                    {letter}
                  </span>
                  <span className="text-sm sm:text-base font-medium">{opt.label}</span>
                </div>
                <Checkbox
                  checked={isSelected}
                  tabIndex={-1}
                  className="pointer-events-none size-4 shrink-0 rounded-sm"
                  style={{
                    borderColor: isSelected ? theme.colors.primary : idleBorder,
                    backgroundColor: isSelected ? theme.colors.primary : "transparent",
                    color: theme.colors.primaryForeground,
                  }}
                />
              </div>
            );
          })}
        </div>
      );
    }

    case "select": {
      const options = (question.options || []).filter((opt) => Boolean(opt.label?.trim()));

      return (
        <div className="w-full max-w-md">
          <Select
            value={strValue || undefined}
            onValueChange={(val) => {
              onChange(val);
              setTimeout(() => onSubmit?.(val), 180);
            }}
          >
            <SelectTrigger
              id={`q-input-${question.id}`}
              className="w-full h-11 sm:h-12 rounded-xl border px-3.5 sm:px-4 py-2 text-sm sm:text-base font-medium cursor-pointer shadow-xs focus-visible:ring-2 focus-visible:ring-primary/40 [&>svg]:size-4 [&>svg]:opacity-70 [&>svg]:text-current transition-colors"
              style={{
                backgroundColor: idleBg,
                borderColor: hasError
                  ? "oklch(0.627 0.22 29)"
                  : strValue
                  ? theme.colors.primary
                  : idleBorder,
                color: strValue ? theme.colors.cardText : placeholderColor,
              }}
            >
              <SelectValue placeholder={question.placeholder || "Select an option…"} />
            </SelectTrigger>
            <SelectContent
              position="popper"
              sideOffset={6}
              className="w-[var(--radix-select-trigger-width)] min-w-[240px] max-h-64 rounded-xl border p-1 shadow-lg backdrop-blur-md z-[100] [&_[data-slot=select-item]_svg]:text-[var(--theme-primary)]"
              style={{
                backgroundColor: theme.colors.cardBg,
                borderColor: theme.colors.cardBorder,
                color: theme.colors.cardText,
                colorScheme: isDark ? "dark" : "light",
                "--theme-primary": theme.colors.primary,
              } as React.CSSProperties}
            >
              {options.length === 0 ? (
                <div
                  className="py-3 px-4 text-sm text-center font-medium text-muted-foreground"
                  style={{ color: theme.colors.cardMuted }}
                >
                  No options available
                </div>
              ) : (
                options.map((opt, idx) => {
                  const isSelected = strValue === opt.label;
                  return (
                    <SelectItem
                      key={opt.id || `${opt.label}-${idx}`}
                      value={opt.label}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm sm:text-base font-medium cursor-pointer transition-colors focus:bg-transparent data-[highlighted]:bg-[var(--item-hover-bg)]",
                        isSelected && "font-semibold"
                      )}
                      style={{
                        color: theme.colors.cardText,
                        backgroundColor: isSelected
                          ? `color-mix(in oklch, ${theme.colors.primary} 14%, transparent)`
                          : undefined,
                        "--item-hover-bg": `color-mix(in oklch, ${theme.colors.primary} 10%, transparent)`,
                      } as React.CSSProperties}
                    >
                      {opt.label}
                    </SelectItem>
                  );
                })
              )}
            </SelectContent>
          </Select>
        </div>
      );
    }

    case "yes_no": {
      return (
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          <button
            type="button"
            id={`yes-btn-${question.id}`}
            onClick={() => {
              onChange("yes");
              setTimeout(() => onSubmit?.("yes"), 180);
            }}
            className={cn(
              "group flex items-center justify-center gap-2.5 rounded-xl border py-2.5 sm:py-3 px-4 text-center transition-all duration-150 cursor-pointer shadow-xs",
              strValue === "yes" && "scale-[1.01]"
            )}
            style={{
              backgroundColor:
                strValue === "yes"
                  ? `color-mix(in oklch, ${theme.colors.primary} 14%, transparent)`
                  : idleBg,
              borderColor: strValue === "yes" ? theme.colors.primary : idleBorder,
              color: theme.colors.cardText,
            }}
          >
            <span
              className="flex size-6 shrink-0 items-center justify-center rounded-md border text-xs font-mono font-semibold"
              style={{
                backgroundColor: strValue === "yes"
                  ? theme.colors.primary
                  : isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(0, 0, 0, 0.05)",
                borderColor: strValue === "yes"
                  ? theme.colors.primary
                  : idleBorder,
                color: strValue === "yes" ? theme.colors.primaryForeground : theme.colors.cardText,
              }}
            >
              Y
            </span>
            <span className="text-base sm:text-lg font-semibold">Yes</span>
          </button>

          <button
            type="button"
            id={`no-btn-${question.id}`}
            onClick={() => {
              onChange("no");
              setTimeout(() => onSubmit?.("no"), 180);
            }}
            className={cn(
              "group flex items-center justify-center gap-2.5 rounded-xl border py-2.5 sm:py-3 px-4 text-center transition-all duration-150 cursor-pointer shadow-xs",
              strValue === "no" && "scale-[1.01]"
            )}
            style={{
              backgroundColor:
                strValue === "no"
                  ? `color-mix(in oklch, ${theme.colors.primary} 14%, transparent)`
                  : idleBg,
              borderColor: strValue === "no" ? theme.colors.primary : idleBorder,
              color: theme.colors.cardText,
            }}
          >
            <span
              className="flex size-6 shrink-0 items-center justify-center rounded-md border text-xs font-mono font-semibold"
              style={{
                backgroundColor: strValue === "no"
                  ? theme.colors.primary
                  : isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(0, 0, 0, 0.05)",
                borderColor: strValue === "no"
                  ? theme.colors.primary
                  : idleBorder,
                color: strValue === "no" ? theme.colors.primaryForeground : theme.colors.cardText,
              }}
            >
              N
            </span>
            <span className="text-base sm:text-lg font-semibold">No</span>
          </button>
        </div>
      );
    }

    case "rating": {
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

    case "scale": {
      const min = question.validation?.minScale ?? 1;
      const max = question.validation?.maxScale ?? 10;
      const currentVal = typeof value === "number" ? value : null;
      const range = Array.from({ length: max - min + 1 }, (_, i) => min + i);

      if (range.length > 10) {
        return (
          <div className="w-full max-w-md py-2 space-y-3">
            <div className="flex items-center justify-between text-base font-bold" style={{ color: theme.colors.cardText }}>
              <span className="text-xl font-mono">{currentVal ?? min}</span>
              <span className="text-xs font-mono font-medium text-muted-foreground">Range: {min} – {max}</span>
            </div>
            <Slider
              value={[currentVal ?? min]}
              min={min}
              max={max}
              step={1}
              onValueChange={([val]) => onChange(val)}
              className="cursor-pointer py-2"
            />
            {(question.validation?.minLabel || question.validation?.maxLabel) && (
              <div
                className="flex justify-between text-xs font-medium text-muted-foreground"
                style={{ color: theme.colors.cardMuted }}
              >
                <span>{question.validation.minLabel ?? `${min}`}</span>
                <span>{question.validation.maxLabel ?? `${max}`}</span>
              </div>
            )}
          </div>
        );
      }

      return (
        <div className="w-full space-y-2.5">
          <div className="flex flex-wrap gap-2">
            {range.map((num) => {
              const isSelected = currentVal === num;
              return (
                <button
                  key={num}
                  type="button"
                  id={`scale-btn-${question.id}-${num}`}
                  onClick={() => {
                    onChange(num);
                    setTimeout(() => onSubmit?.(num), 180);
                  }}
                  className={cn(
                    "flex size-9 sm:size-10 items-center justify-center rounded-lg border text-sm sm:text-base font-semibold transition-all duration-150 cursor-pointer shadow-xs",
                    isSelected && "scale-105 shadow-sm"
                  )}
                  style={{
                    backgroundColor: isSelected ? theme.colors.primary : idleBg,
                    borderColor: isSelected ? theme.colors.primary : idleBorder,
                    color: isSelected ? theme.colors.primaryForeground : theme.colors.cardText,
                  }}
                >
                  {num}
                </button>
              );
            })}
          </div>
          {(question.validation?.minLabel || question.validation?.maxLabel) && (
            <div
              className="flex justify-between text-xs px-1 pt-1 font-medium text-muted-foreground"
              style={{ color: theme.colors.cardMuted }}
            >
              <span>{question.validation.minLabel ?? `${min}`}</span>
              <span>{question.validation.maxLabel ?? `${max}`}</span>
            </div>
          )}
        </div>
      );
    }

    case "date": {
      return (
        <div className="relative w-full max-w-sm">
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="date"
            id={`q-input-${question.id}`}
            value={strValue}
            min={question.validation?.minDate}
            max={question.validation?.maxDate}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => {
              onChange(e.target.value);
              if (e.target.value) {
                setTimeout(() => onSubmit?.(e.target.value), 250);
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSubmit?.(strValue);
              }
            }}
            className="w-full h-11 sm:h-12 rounded-xl border px-3.5 sm:px-4 py-2 text-base font-normal outline-none transition-colors duration-200 cursor-pointer shadow-xs focus-visible:ring-2 focus-visible:ring-primary/40"
            style={{
              backgroundColor: idleBg,
              borderColor: hasError
                ? "oklch(0.627 0.22 29)"
                : isFocused || strValue
                ? theme.colors.primary
                : idleBorder,
              color: strValue ? theme.colors.cardText : placeholderColor,
              colorScheme: isDark ? "dark" : "light",
            }}
          />
        </div>
      );
    }

    case "time": {
      return (
        <div className="relative w-full max-w-xs">
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="time"
            id={`q-input-${question.id}`}
            value={strValue}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSubmit?.(strValue);
              }
            }}
            className="w-full h-11 sm:h-12 rounded-xl border px-3.5 sm:px-4 py-2 text-base font-normal outline-none transition-colors duration-200 shadow-xs focus-visible:ring-2 focus-visible:ring-primary/40"
            style={{
              backgroundColor: idleBg,
              borderColor: hasError
                ? "oklch(0.627 0.22 29)"
                : isFocused || strValue
                ? theme.colors.primary
                : idleBorder,
              color: theme.colors.cardText,
              colorScheme: isDark ? "dark" : "light",
            }}
          />
        </div>
      );
    }

    case "datetime": {
      return (
        <div className="relative w-full max-w-sm">
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="datetime-local"
            id={`q-input-${question.id}`}
            value={strValue}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onSubmit?.(strValue);
              }
            }}
            className="w-full h-11 sm:h-12 rounded-xl border px-3.5 sm:px-4 py-2 text-base font-normal outline-none transition-colors duration-200 shadow-xs focus-visible:ring-2 focus-visible:ring-primary/40"
            style={{
              backgroundColor: idleBg,
              borderColor: hasError
                ? "oklch(0.627 0.22 29)"
                : isFocused || strValue
                ? theme.colors.primary
                : idleBorder,
              color: theme.colors.cardText,
              colorScheme: isDark ? "dark" : "light",
            }}
          />
        </div>
      );
    }

    case "file": {
      return (
        <div className="w-full max-w-md">
          {strValue ? (
            <div
              className="flex items-center justify-between rounded-xl border p-3.5 sm:p-4 shadow-xs"
              style={{
                backgroundColor: `color-mix(in oklch, ${theme.colors.primary} 8%, transparent)`,
                borderColor: theme.colors.primary,
              }}
            >
              <div className="flex items-center gap-3 truncate mr-3">
                <FileIcon className="size-5 shrink-0" style={{ color: theme.colors.primary }} />
                <span className="font-medium text-sm truncate" style={{ color: theme.colors.cardText }}>
                  {strValue}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onChange("")}
                className="rounded-lg p-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                style={{ color: theme.colors.cardMuted }}
                aria-label="Remove uploaded file"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor={`file-upload-${question.id}`}
              className="flex flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center transition-all duration-150 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
              style={{
                backgroundColor: idleBg,
                borderColor: idleBorder,
              }}
            >
              <Upload
                className="size-6 mb-2 opacity-70"
                style={{ color: theme.colors.primary }}
              />
              <p className="text-sm font-semibold" style={{ color: theme.colors.cardText }}>
                Click to choose a file or drag & drop
              </p>
              <p
                className="text-xs mt-1 text-muted-foreground"
                style={{ color: theme.colors.cardMuted }}
              >
                {question.validation?.allowedExtensions
                  ? `Supported: ${question.validation.allowedExtensions}`
                  : "PDF, DOC, PNG, JPG up to 10MB"}
              </p>
              <input
                id={`file-upload-${question.id}`}
                type="file"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    onChange(file.name);
                  }
                }}
              />
            </label>
          )}
        </div>
      );
    }

    case "heading": {
      return null;
    }

    default:
      return (
        <input
          ref={inputRef as React.RefObject<HTMLInputElement>}
          type="text"
          id={`q-input-${question.id}`}
          value={strValue}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder || "Type your answer…"}
          className="w-full bg-transparent px-0 py-2.5 text-lg sm:text-xl font-normal outline-none border-b-2 placeholder:text-muted-foreground/50 transition-colors"
          style={{
            borderColor: isFocused || strValue ? theme.colors.primary : idleBorder,
            color: theme.colors.cardText,
          }}
        />
      );
  }
}
