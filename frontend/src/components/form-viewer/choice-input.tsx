"use client";

import * as React from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export function ChoiceInput({ question, theme, value, onChange, onSubmit, isDark, hasError }: ChoiceInputProps) {
  const options = question.options ?? [];
  const stringValue = typeof value === "string" ? value : "";
  const selectedValues = Array.isArray(value) ? value : [];
  const border = isDark ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.12)";
  const background = isDark ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.02)";
  const selectedBackground = `color-mix(in oklch, ${theme.colors.primary} 12%, transparent)`;

  const submit = (next: unknown) => {
    onChange(next);
    window.setTimeout(() => onSubmit?.(next), 180);
  };

  if (question.type === "select") {
    return (
      <Select value={stringValue || undefined} onValueChange={submit}>
        <SelectTrigger
          id={`q-input-${question.id}`}
          className="h-11 w-full max-w-md rounded-xl border px-3.5 text-sm font-medium sm:h-12 sm:text-base"
          style={{ backgroundColor: background, borderColor: hasError ? "oklch(.627 .22 29)" : stringValue ? theme.colors.primary : border, color: stringValue ? theme.colors.cardText : theme.colors.cardMuted }}
        >
          <SelectValue placeholder={question.placeholder || "Select an option..."} />
        </SelectTrigger>
        <SelectContent className="max-h-64 rounded-xl" style={{ backgroundColor: theme.colors.cardBg, borderColor: theme.colors.cardBorder, color: theme.colors.cardText }}>
          {options.map((option) => <SelectItem key={option.id} value={option.label}>{option.label}</SelectItem>)}
        </SelectContent>
      </Select>
    );
  }

  if (question.type === "yes_no") {
    return (
      <div className="grid w-full max-w-xs grid-cols-2 gap-3">
        {["yes", "no"].map((answer) => {
          const selected = stringValue === answer;
          return <button key={answer} type="button" onClick={() => submit(answer)} className="rounded-xl border px-4 py-3 text-base font-semibold capitalize" style={{ backgroundColor: selected ? selectedBackground : background, borderColor: selected ? theme.colors.primary : border, color: theme.colors.cardText }}>{answer}</button>;
        })}
      </div>
    );
  }

  if (question.type === "radio") {
    return (
      <RadioGroup value={stringValue} onValueChange={submit} className="w-full max-w-md space-y-2">
        {options.map((option) => {
          const selected = stringValue === option.label;
          return <div key={option.id} role="button" tabIndex={0} onClick={() => submit(option.label)} className="flex cursor-pointer items-center justify-between rounded-xl border px-3.5 py-3 text-left sm:px-4" style={{ backgroundColor: selected ? selectedBackground : background, borderColor: selected ? theme.colors.primary : border, color: theme.colors.cardText }}><span>{option.label}</span><RadioGroupItem value={option.label} tabIndex={-1} className="pointer-events-none" /></div>;
        })}
      </RadioGroup>
    );
  }

  const toggle = (label: string) => onChange(selectedValues.includes(label) ? selectedValues.filter((item) => item !== label) : [...selectedValues, label]);
  return <div className="w-full max-w-md space-y-2">{options.map((option) => { const selected = selectedValues.includes(option.label); return <div key={option.id} role="button" tabIndex={0} onClick={() => toggle(option.label)} className="flex cursor-pointer items-center justify-between rounded-xl border px-3.5 py-3 text-left sm:px-4" style={{ backgroundColor: selected ? selectedBackground : background, borderColor: selected ? theme.colors.primary : border, color: theme.colors.cardText }}><span>{option.label}</span><Checkbox checked={selected} tabIndex={-1} className="pointer-events-none" /></div>; })}</div>;
}
