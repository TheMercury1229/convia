"use client";

import * as React from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Question } from "@/types/builder";
import type { FormThemeResolved } from "@/lib/builder-themes";

interface ChoiceInputProps {
  question: Question;
  theme: FormThemeResolved;
  value: unknown;
  onChange: (value: unknown) => void;
  onSubmit?: (value?: unknown) => void;
  isDark: boolean;
  hasError: boolean;
}

export function ChoiceInput({
  question,
  theme,
  value,
  onChange,
  onSubmit,
  isDark,
  hasError,
}: ChoiceInputProps) {
  const options = React.useMemo(() => question.options ?? [], [question.options]);
  const stringValue = typeof value === "string" ? value : "";
  const selectedValues = Array.isArray(value) ? value : [];

  const border = theme.colors.cardInputBorder;
  const background = theme.colors.cardInputBg;
  const selectedBackground = `color-mix(in oklch, ${theme.colors.primary} 12%, ${theme.colors.cardInputBg})`;
  const selectedBorder = theme.colors.cardBorderSelected || theme.colors.primary;

  const submit = React.useCallback(
    (next: unknown) => {
      onChange(next);
      window.setTimeout(() => onSubmit?.(next), 180);
    },
    [onChange, onSubmit],
  );

  // Keyboard shortcut listener (A, B, C... or Y / N)
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (["INPUT", "TEXTAREA"].includes(target.tagName)) return;

      const key = event.key.toUpperCase();

      if (question.type === "yes_no") {
        if (key === "Y") {
          event.preventDefault();
          submit("yes");
        } else if (key === "N") {
          event.preventDefault();
          submit("no");
        }
        return;
      }

      if (["radio", "checkbox", "multi_select"].includes(question.type)) {
        const charCode = key.charCodeAt(0);
        if (key.length === 1 && charCode >= 65 && charCode <= 90) {
          const index = charCode - 65;
          if (index < options.length) {
            const opt = options[index];
            if (question.type === "radio") {
              event.preventDefault();
              submit(opt.label);
            } else {
              event.preventDefault();
              const nextValues = selectedValues.includes(opt.label)
                ? selectedValues.filter((item) => item !== opt.label)
                : [...selectedValues, opt.label];
              onChange(nextValues);
            }
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [options, question.type, selectedValues, submit, onChange]);

  // ── Select (dropdown) ────────────────────────────────────────────────────
  if (question.type === "select") {
    return (
      <Select value={stringValue || undefined} onValueChange={submit}>
        <SelectTrigger
          id={`q-input-${question.id}`}
          className="h-12 w-full max-w-md rounded-xl border px-4 text-base font-medium shadow-2xs transition-all duration-150 sm:h-13 sm:text-lg"
          style={{
            backgroundColor: background,
            borderColor: hasError
              ? "var(--destructive)"
              : stringValue
                ? theme.colors.primary
                : border,
            color: stringValue ? theme.colors.cardText : theme.colors.cardMuted,
            boxShadow: stringValue
              ? `0 0 0 2px color-mix(in oklch, ${theme.colors.primary} 20%, transparent)`
              : "none",
          }}
        >
          <SelectValue placeholder={question.placeholder || "Select an option..."} />
        </SelectTrigger>
        <SelectContent
          className="max-h-64 rounded-xl border p-1 shadow-md transition-colors"
          style={{
            backgroundColor: theme.colors.cardBg,
            borderColor: theme.colors.cardBorder,
            color: theme.colors.cardText,
          }}
        >
          {options.map((option) => (
            <SelectItem
              key={option.id}
              value={option.label}
              className="cursor-pointer rounded-lg py-2.5 text-sm font-medium transition-colors hover:opacity-90"
              style={{
                color: theme.colors.cardText,
              }}
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // ── Yes / No ─────────────────────────────────────────────────────────────
  if (question.type === "yes_no") {
    const choices = [
      { key: "Y", label: "Yes", val: "yes" },
      { key: "N", label: "No", val: "no" },
    ];

    return (
      <div className="grid w-full max-w-xs grid-cols-2 gap-3.5">
        {choices.map(({ key, label, val }) => {
          const isSelected = stringValue === val;
          return (
            <button
              key={val}
              type="button"
              onClick={() => submit(val)}
              className={cn(
                "group relative flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-all duration-150 active:scale-[0.98]",
                isSelected ? "shadow-sm" : "hover:border-opacity-80",
              )}
              style={{
                backgroundColor: isSelected ? selectedBackground : background,
                borderColor: isSelected ? selectedBorder : border,
                color: theme.colors.cardText,
                boxShadow: isSelected
                  ? `0 0 0 2px ${theme.colors.cardRingSelected || theme.colors.primary}`
                  : "none",
              }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex size-6.5 shrink-0 items-center justify-center rounded-md border text-xs font-mono font-semibold transition-colors"
                  style={{
                    backgroundColor: isSelected
                      ? theme.colors.primary
                      : theme.colors.badgeBg,
                    color: isSelected
                      ? theme.colors.primaryForeground
                      : theme.colors.badgeText,
                    borderColor: isSelected
                      ? theme.colors.primary
                      : theme.colors.cardInputBorder,
                  }}
                >
                  {key}
                </span>
                <span className="text-base font-semibold capitalize">{label}</span>
              </div>
              {isSelected && (
                <Check
                  className="size-4 shrink-0 transition-transform animate-in zoom-in-75"
                  style={{ color: theme.colors.primary }}
                />
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // ── Radio (single select) ────────────────────────────────────────────────
  if (question.type === "radio") {
    return (
      <div className="w-full max-w-md space-y-2.5">
        {options.map((option, index) => {
          const isSelected = stringValue === option.label;
          const letter = String.fromCharCode(65 + index);

          return (
            <div
              key={option.id}
              role="button"
              tabIndex={0}
              onClick={() => submit(option.label)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  submit(option.label);
                }
              }}
              className={cn(
                "group flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-left transition-all duration-150 active:scale-[0.99] outline-none",
                isSelected ? "shadow-xs" : "hover:scale-[1.01]",
              )}
              style={{
                backgroundColor: isSelected ? selectedBackground : background,
                borderColor: isSelected ? selectedBorder : border,
                color: theme.colors.cardText,
                boxShadow: isSelected
                  ? `0 0 0 2px ${theme.colors.cardRingSelected || theme.colors.primary}`
                  : "none",
              }}
            >
              <div className="flex items-center gap-3 truncate">
                <span
                  className="flex size-6.5 shrink-0 items-center justify-center rounded-md border text-xs font-mono font-semibold transition-colors"
                  style={{
                    backgroundColor: isSelected
                      ? theme.colors.primary
                      : theme.colors.badgeBg,
                    color: isSelected
                      ? theme.colors.primaryForeground
                      : theme.colors.badgeText,
                    borderColor: isSelected
                      ? theme.colors.primary
                      : theme.colors.cardInputBorder,
                  }}
                >
                  {letter}
                </span>
                <span className="truncate text-base font-medium">{option.label}</span>
              </div>

              {/* Custom Theme Radio Indicator */}
              <div
                className="flex size-4.5 shrink-0 items-center justify-center rounded-full border transition-all"
                style={{
                  borderColor: isSelected ? theme.colors.primary : border,
                  backgroundColor: isSelected ? theme.colors.primary : "transparent",
                }}
              >
                {isSelected && (
                  <div
                    className="size-2 rounded-full"
                    style={{ backgroundColor: theme.colors.primaryForeground }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Checkbox / Multi Select ──────────────────────────────────────────────
  const toggle = (label: string) => {
    const next = selectedValues.includes(label)
      ? selectedValues.filter((item) => item !== label)
      : [...selectedValues, label];
    onChange(next);
  };

  return (
    <div className="w-full max-w-md space-y-2.5">
      {options.map((option, index) => {
        const isSelected = selectedValues.includes(option.label);
        const letter = String.fromCharCode(65 + index);

        return (
          <div
            key={option.id}
            role="button"
            tabIndex={0}
            onClick={() => toggle(option.label)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggle(option.label);
              }
            }}
            className={cn(
              "group flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-left transition-all duration-150 active:scale-[0.99] outline-none",
              isSelected ? "shadow-xs" : "hover:scale-[1.01]",
            )}
            style={{
              backgroundColor: isSelected ? selectedBackground : background,
              borderColor: isSelected ? selectedBorder : border,
              color: theme.colors.cardText,
              boxShadow: isSelected
                ? `0 0 0 2px ${theme.colors.cardRingSelected || theme.colors.primary}`
                : "none",
            }}
          >
            <div className="flex items-center gap-3 truncate">
              <span
                className="flex size-6.5 shrink-0 items-center justify-center rounded-md border text-xs font-mono font-semibold transition-colors"
                style={{
                  backgroundColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.badgeBg,
                  color: isSelected
                    ? theme.colors.primaryForeground
                    : theme.colors.badgeText,
                  borderColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.cardInputBorder,
                }}
              >
                {letter}
              </span>
              <span className="truncate text-base font-medium">{option.label}</span>
            </div>

            {/* Custom Theme Checkbox Indicator */}
            <div
              className="flex size-4.5 shrink-0 items-center justify-center rounded-md border transition-all"
              style={{
                borderColor: isSelected ? theme.colors.primary : border,
                backgroundColor: isSelected ? theme.colors.primary : "transparent",
              }}
            >
              {isSelected && (
                <Check
                  className="size-3.5 stroke-[3]"
                  style={{ color: theme.colors.primaryForeground }}
                />
              )}
            </div>
          </div>
        );
      })}

      <div className="pt-1 text-xs" style={{ color: theme.colors.cardMuted }}>
        <span>Select all that apply</span>
      </div>
    </div>
  );
}

