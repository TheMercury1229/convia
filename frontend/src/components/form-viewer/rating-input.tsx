"use client";

import * as React from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Question } from "@/types/builder";
import type { FormThemeResolved } from "@/lib/builder-themes";

interface RatingInputProps {
  question: Question;
  theme: FormThemeResolved;
  value: unknown;
  onChange: (value: unknown) => void;
  onSubmit?: (value?: unknown) => void;
  isDark?: boolean;
}

export function RatingInput({
  question,
  theme,
  value,
  onChange,
  onSubmit,
  isDark = false,
}: RatingInputProps) {
  const max = question.validation?.maxRating || 5;
  const currentRating = typeof value === "number" ? value : 0;
  const [hoverRating, setHoverRating] = React.useState(0);

  const selectRating = React.useCallback(
    (rating: number) => {
      onChange(rating);
      window.setTimeout(() => onSubmit?.(rating), 180);
    },
    [onChange, onSubmit],
  );

  // Keyboard shortcut listener: pressing 1-9 directly selects the rating
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (["INPUT", "TEXTAREA"].includes(target.tagName)) return;

      const num = parseInt(event.key, 10);
      if (!isNaN(num) && num >= 1 && num <= max) {
        event.preventDefault();
        selectRating(num);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [max, selectRating]);

  const activeValue = hoverRating || currentRating;

  return (
    <div className="flex flex-col items-start gap-2.5 py-1">
      <div className="flex items-center gap-2 sm:gap-2.5">
        {Array.from({ length: max }, (_, index) => index + 1).map((rating) => {
          const isFilled = rating <= activeValue;
          return (
            <button
              key={rating}
              type="button"
              id={`rating-star-${question.id}-${rating}`}
              onMouseEnter={() => setHoverRating(rating)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => selectRating(rating)}
              className="group cursor-pointer rounded-xl p-1.5 transition-all duration-150 hover:scale-115 active:scale-95 focus-visible:outline-none"
              style={{
                boxShadow: "none",
              }}
              aria-label={`${rating} of ${max} stars`}
            >
              <Star
                className={cn(
                  "size-8 transition-all duration-150 sm:size-9",
                  isFilled ? "fill-current drop-shadow-xs" : "fill-none",
                )}
                style={{
                  color: isFilled ? theme.colors.primary : theme.colors.cardInputBorder,
                }}
              />
            </button>
          );
        })}
      </div>

      {/* Subtle rating indicator text */}
      <div
        className="flex items-center gap-2 text-xs font-medium"
        style={{ color: theme.colors.cardMuted }}
      >
        <span>
          {activeValue > 0
            ? `${activeValue} of ${max} stars`
            : `Rate from 1 to ${max}`}
        </span>
        <span className="opacity-60">• (or press 1–{max})</span>
      </div>
    </div>
  );
}

