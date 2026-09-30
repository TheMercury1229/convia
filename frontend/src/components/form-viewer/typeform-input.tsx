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
    <div className="flex items-center gap-2 sm:gap-2.5 py-1.5">
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
            className="group p-1.5 transition-transform duration-150 hover:scale-125 cursor-pointer focus:outline-none"
            aria-label={`${star} star`}
          >
            <Star
              className={cn(
                "size-8 sm:size-9 transition-colors duration-150",
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
  const idleBorder = isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.18)";
  const idleBg = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.03)";
  const placeholderColor = isDark ? "rgba(255, 255, 255, 0.45)" : "rgba(0, 0, 0, 0.4)";


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
            className="w-full bg-transparent px-0 py-3 text-xl sm:text-2xl font-normal outline-none transition-colors duration-200 border-b-2"
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
            className="w-full bg-transparent px-0 py-3 text-xl sm:text-2xl font-normal outline-none transition-colors duration-200 border-b-2"
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
            className="w-full resize-y rounded-2xl border-2 p-3.5 sm:p-4 text-xl sm:text-2xl font-normal leading-relaxed outline-none transition-colors duration-200 min-h-[140px] sm:min-h-[160px] max-h-[280px] sm:max-h-[320px]"
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
            className="mt-2.5 text-xs font-mono flex items-center justify-between"
            style={{ color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(15, 23, 42, 0.6)" }}
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
          className="w-full space-y-2.5"
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
                  "group flex w-full items-center justify-between gap-3 rounded-2xl border-2 px-4 sm:px-5 py-3 text-left transition-all duration-150 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  isSelected && "shadow-sm scale-[1.008]"
                )}
                style={{
                  backgroundColor: isSelected
                    ? `color-mix(in oklch, ${theme.colors.primary} 14%, transparent)`
                    : idleBg,
                  borderColor: isSelected ? theme.colors.primary : idleBorder,
                  color: theme.colors.cardText,
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex size-6.5 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-colors"
                    style={{
                      backgroundColor: isSelected
                        ? theme.colors.primary
                        : isDark
                        ? "rgba(255, 255, 255, 0.08)"
                        : "rgba(0, 0, 0, 0.06)",
                      borderColor: isSelected
                        ? theme.colors.primary
                        : isDark
                        ? "rgba(255, 255, 255, 0.2)"
                        : "rgba(0, 0, 0, 0.16)",
                      color: isSelected
                        ? theme.colors.primaryForeground
                        : theme.colors.cardText,
                    }}
                  >
                    {letter}
                  </span>
                  <span className="text-base font-medium">{opt.label}</span>
                </div>
                <RadioGroupItem
                  value={opt.label}
                  id={`radio-${question.id}-${idx}`}
                  tabIndex={-1}
                  className="size-5 shrink-0 pointer-events-none"
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
        <div className="w-full space-y-2.5">
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
                  "group flex w-full items-center justify-between gap-3 rounded-2xl border-2 px-4 sm:px-5 py-3 text-left transition-all duration-150 cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                  isSelected && "shadow-sm scale-[1.008]"
                )}
                style={{
                  backgroundColor: isSelected
                    ? `color-mix(in oklch, ${theme.colors.primary} 14%, transparent)`
                    : idleBg,
                  borderColor: isSelected ? theme.colors.primary : idleBorder,
                  color: theme.colors.cardText,
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex size-6.5 shrink-0 items-center justify-center rounded-lg border text-xs font-bold transition-colors"
                    style={{
                      backgroundColor: isSelected
                        ? theme.colors.primary
                        : isDark
                        ? "rgba(255, 255, 255, 0.08)"
                        : "rgba(0, 0, 0, 0.06)",
                      borderColor: isSelected
                        ? theme.colors.primary
                        : isDark
                        ? "rgba(255, 255, 255, 0.2)"
                        : "rgba(0, 0, 0, 0.16)",
                      color: isSelected
                        ? theme.colors.primaryForeground
                        : theme.colors.cardText,
                    }}
                  >
                    {letter}
                  </span>
                  <span className="text-base font-medium">{opt.label}</span>
                </div>
                <Checkbox
                  checked={isSelected}
                  tabIndex={-1}
                  className="pointer-events-none size-5 shrink-0 rounded-md"
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
              className="w-full !h-auto min-h-[52px] rounded-2xl border-2 px-4 py-3 text-base sm:text-lg font-medium cursor-pointer shadow-none focus-visible:ring-0 [&>svg]:size-5 [&>svg]:opacity-75 [&>svg]:text-current transition-colors"
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
              className="w-[var(--radix-select-trigger-width)] min-w-[240px] max-h-64 rounded-2xl border-2 p-1.5 shadow-2xl backdrop-blur-xl z-[100] [&_[data-slot=select-item]_svg]:text-[var(--theme-primary)]"
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
                  className="py-3 px-4 text-sm text-center font-medium opacity-60"
                  style={{ color: theme.colors.cardText }}
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
                        "rounded-xl px-3.5 py-2.5 text-base font-medium cursor-pointer transition-colors focus:bg-transparent data-[highlighted]:bg-[var(--item-hover-bg)]",
                        isSelected && "font-semibold"
                      )}
                      style={{
                        color: theme.colors.cardText,
                        backgroundColor: isSelected
                          ? `color-mix(in oklch, ${theme.colors.primary} 16%, transparent)`
                          : undefined,
                        "--item-hover-bg": `color-mix(in oklch, ${theme.colors.primary} 12%, transparent)`,
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
        <div className="grid grid-cols-2 gap-3.5 w-full max-w-sm">
          <button
            type="button"
            id={`yes-btn-${question.id}`}
            onClick={() => {
              onChange("yes");
              setTimeout(() => onSubmit?.("yes"), 180);
            }}
            className={cn(
              "group flex items-center justify-center gap-3 rounded-2xl border-2 py-3.5 px-5 text-center transition-all duration-150 cursor-pointer",
              strValue === "yes" && "shadow-sm scale-[1.02]"
            )}
            style={{
              backgroundColor:
                strValue === "yes"
                  ? `color-mix(in oklch, ${theme.colors.primary} 16%, transparent)`
                  : idleBg,
              borderColor: strValue === "yes" ? theme.colors.primary : idleBorder,
              color: theme.colors.cardText,
            }}
          >
            <span
              className="flex size-6.5 shrink-0 items-center justify-center rounded-lg border text-xs font-bold"
              style={{
                backgroundColor: strValue === "yes"
                  ? theme.colors.primary
                  : isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(0, 0, 0, 0.06)",
                borderColor: strValue === "yes"
                  ? theme.colors.primary
                  : isDark
                  ? "rgba(255, 255, 255, 0.2)"
                  : "rgba(0, 0, 0, 0.16)",
                color: strValue === "yes" ? theme.colors.primaryForeground : theme.colors.cardText,
              }}
            >
              Y
            </span>
            <span className="text-xl font-bold">Yes</span>
          </button>

          <button
            type="button"
            id={`no-btn-${question.id}`}
            onClick={() => {
              onChange("no");
              setTimeout(() => onSubmit?.("no"), 180);
            }}
            className={cn(
              "group flex items-center justify-center gap-3 rounded-2xl border-2 py-3.5 px-5 text-center transition-all duration-150 cursor-pointer",
              strValue === "no" && "shadow-sm scale-[1.02]"
            )}
            style={{
              backgroundColor:
                strValue === "no"
                  ? `color-mix(in oklch, ${theme.colors.primary} 16%, transparent)`
                  : idleBg,
              borderColor: strValue === "no" ? theme.colors.primary : idleBorder,
              color: theme.colors.cardText,
            }}
          >
            <span
              className="flex size-6.5 shrink-0 items-center justify-center rounded-lg border text-xs font-bold"
              style={{
                backgroundColor: strValue === "no"
                  ? theme.colors.primary
                  : isDark
                  ? "rgba(255, 255, 255, 0.08)"
                  : "rgba(0, 0, 0, 0.06)",
                borderColor: strValue === "no"
                  ? theme.colors.primary
                  : isDark
                  ? "rgba(255, 255, 255, 0.2)"
                  : "rgba(0, 0, 0, 0.16)",
                color: strValue === "no" ? theme.colors.primaryForeground : theme.colors.cardText,
              }}
            >
              N
            </span>
            <span className="text-xl font-bold">No</span>
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
          <div className="w-full max-w-md py-3 space-y-4">
            <div className="flex items-center justify-between text-base font-bold" style={{ color: theme.colors.cardText }}>
              <span className="text-2xl font-mono">{currentVal ?? min}</span>
              <span className="text-xs font-mono font-medium opacity-70">Range: {min} – {max}</span>
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
                className="flex justify-between text-xs font-semibold"
                style={{ color: isDark ? "rgba(255, 255, 255, 0.65)" : "rgba(15, 23, 42, 0.65)" }}
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
                    "flex size-10 sm:size-12 items-center justify-center rounded-xl border-2 text-base font-bold transition-all duration-150 cursor-pointer",
                    isSelected && "scale-105 shadow-md"
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
              className="flex justify-between text-xs px-1 pt-1 font-semibold"
              style={{ color: isDark ? "rgba(255, 255, 255, 0.65)" : "rgba(15, 23, 42, 0.65)" }}
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
            className="w-full rounded-2xl border-2 px-4 py-3 text-lg sm:text-xl font-normal outline-none transition-colors duration-200 cursor-pointer min-h-[52px]"
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
            className="w-full rounded-2xl border-2 px-4 py-3 text-lg font-normal outline-none transition-colors duration-200"
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
            className="w-full rounded-2xl border-2 px-4 py-3 text-lg font-normal outline-none transition-colors duration-200"
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
              className="flex items-center justify-between rounded-2xl border-2 p-5"
              style={{
                backgroundColor: `color-mix(in oklch, ${theme.colors.primary} 8%, transparent)`,
                borderColor: theme.colors.primary,
              }}
            >
              <div className="flex items-center gap-3 truncate mr-3">
                <FileIcon className="size-5.5 shrink-0" style={{ color: theme.colors.primary }} />
                <span className="font-semibold text-sm truncate" style={{ color: theme.colors.cardText }}>
                  {strValue}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onChange("")}
                className="rounded-full p-1.5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
                style={{ color: isDark ? "rgba(255, 255, 255, 0.7)" : "rgba(15, 23, 42, 0.7)" }}
                aria-label="Remove uploaded file"
              >
                <X className="size-4" />
              </button>
            </div>
          ) : (
            <label
              htmlFor={`file-upload-${question.id}`}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-7 text-center transition-all duration-200 cursor-pointer"
              style={{
                backgroundColor: idleBg,
                borderColor: idleBorder,
              }}
            >
              <Upload
                className="size-7 mb-2 opacity-75"
                style={{ color: theme.colors.primary }}
              />
              <p className="text-sm font-semibold" style={{ color: theme.colors.cardText }}>
                Click to choose a file or drag & drop
              </p>
              <p
                className="text-xs mt-1 font-medium"
                style={{ color: isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(15, 23, 42, 0.6)" }}
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
          className="w-full bg-transparent px-1 py-3 text-xl font-normal outline-none border-b-2"
          style={{
            borderColor: isFocused || strValue ? theme.colors.primary : idleBorder,
            color: theme.colors.cardText,
          }}
        />
      );
  }
}
