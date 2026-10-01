"use client";

import * as React from "react";
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

export function TypeformInput({ question, theme, value, onChange, onSubmit, hasError = false, isDark = false }: TypeformInputProps) {
  const inputRef = React.useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = React.useState(false);
  const stringValue = typeof value === "string" ? value : "";
  const numberValue = typeof value === "number" ? value : "";
  const idleBorder = isDark ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.12)";
  const idleBackground = isDark ? "rgba(255,255,255,.03)" : "rgba(0,0,0,.02)";

  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      document.getElementById(`q-input-${question.id}`)?.focus();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [question.id]);

  const inputStyle = {
    backgroundColor: "transparent",
    borderColor: hasError ? "oklch(.627 .22 29)" : isFocused || stringValue ? theme.colors.primary : idleBorder,
    color: theme.colors.cardText,
  };

  if (["select", "radio", "checkbox", "multi_select", "yes_no"].includes(question.type)) {
    return <ChoiceInput question={question} theme={theme} value={value} onChange={onChange} onSubmit={onSubmit} isDark={isDark} hasError={hasError} />;
  }

  if (question.type === "rating") {
    return <RatingInput question={question} theme={theme} value={value} onChange={onChange} onSubmit={onSubmit} isDark={isDark} />;
  }

  if (question.type === "scale") {
    const min = question.validation?.minScale ?? 1;
    const max = question.validation?.maxScale ?? 10;
    const current = typeof value === "number" ? value : min;
    if (max - min > 9) {
      return <div className="w-full max-w-md space-y-3"><div className="flex justify-between font-mono text-sm" style={{ color: theme.colors.cardText }}><span>{current}</span><span>{min} - {max}</span></div><Slider value={[current]} min={min} max={max} step={1} onValueChange={([next]) => onChange(next)} /></div>;
    }
    return <div className="flex flex-wrap gap-2">{Array.from({ length: max - min + 1 }, (_, index) => min + index).map((item) => <button key={item} type="button" onClick={() => { onChange(item); window.setTimeout(() => onSubmit?.(item), 180); }} className={cn("flex size-10 cursor-pointer items-center justify-center rounded-lg border text-sm font-semibold", current === item && "scale-105")} style={{ backgroundColor: current === item ? theme.colors.primary : idleBackground, borderColor: current === item ? theme.colors.primary : idleBorder, color: current === item ? theme.colors.primaryForeground : theme.colors.cardText }}>{item}</button>)}</div>;
  }

  if (question.type === "file") {
    return <FileInput question={question} theme={theme} value={value} onChange={onChange} isDark={isDark} />;
  }

  const isLongText = question.type === "textarea" || question.type === "paragraph";
  if (isLongText) {
    return <div className="w-full"><textarea ref={inputRef as React.RefObject<HTMLTextAreaElement>} id={`q-input-${question.id}`} value={stringValue} rows={4} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} onChange={(event) => onChange(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) { event.preventDefault(); onSubmit?.(stringValue); } }} placeholder={question.placeholder || "Type your answer here..."} className="min-h-30 max-h-65 w-full resize-y rounded-xl border p-4 text-base leading-relaxed outline-none sm:text-lg" style={inputStyle} /><div className="mt-2 flex items-center justify-between text-xs" style={{ color: theme.colors.cardMuted }}><span><Kbd className="px-1 py-0.5 text-[10px]">Shift</Kbd> + <Kbd className="px-1 py-0.5 text-[10px]">Enter</Kbd> for new line</span><span><Kbd className="px-1 py-0.5 text-[10px]">Ctrl</Kbd> + <Kbd className="px-1 py-0.5 text-[10px]">Enter</Kbd> to submit</span></div></div>;
  }

  const inputType = question.type === "email" ? "email" : question.type === "phone" ? "tel" : question.type === "url" ? "url" : question.type === "number" ? "number" : question.type === "date" ? "date" : question.type === "time" ? "time" : question.type === "datetime" ? "datetime-local" : "text";
  const inputValue = question.type === "number" ? numberValue : stringValue;
  return <input ref={inputRef as React.RefObject<HTMLInputElement>} type={inputType} id={`q-input-${question.id}`} value={inputValue} min={question.validation?.min} max={question.validation?.max} step={question.validation?.step ?? "any"} onFocus={() => setIsFocused(true)} onBlur={() => setIsFocused(false)} onChange={(event) => onChange(question.type === "number" ? (event.target.value === "" ? "" : Number(event.target.value)) : event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); onSubmit?.(inputValue); } }} placeholder={question.placeholder || "Type your answer here..."} className="w-full border-b-2 bg-transparent py-2.5 text-lg outline-none sm:text-xl" style={inputStyle} />;
}
