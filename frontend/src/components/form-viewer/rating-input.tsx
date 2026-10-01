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

  return (
    <div className="flex items-center gap-1.5 py-1 sm:gap-2">
      {Array.from({ length: max }, (_, index) => index + 1).map((rating) => {
        const isFilled = rating <= (hoverRating || currentRating);
        return (
          <button
            key={rating}
            type="button"
            id={`rating-star-${question.id}-${rating}`}
            onMouseEnter={() => setHoverRating(rating)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => {
              onChange(rating);
              setTimeout(() => onSubmit?.(rating), 180);
            }}
            className="group cursor-pointer rounded-lg p-1.5 transition-transform duration-150 hover:scale-115 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            aria-label={`${rating} star`}
          >
            <Star
              className={cn(
                "size-7 transition-colors duration-150 sm:size-8",
                isFilled ? "fill-current" : "fill-none",
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
