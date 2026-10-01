"use client";

import * as React from "react";
import { Flame, Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ActivityHeatmapData } from "@/lib/api/analytics";

interface AnalyticsActivityHeatmapProps {
  heatmap: ActivityHeatmapData;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatHour(hr: number): string {
  if (hr === 0) return "12 AM";
  if (hr === 12) return "12 PM";
  return hr < 12 ? `${hr} AM` : `${hr - 12} PM`;
}

export function AnalyticsActivityHeatmap({ heatmap }: AnalyticsActivityHeatmapProps) {
  const { data, maxCount } = heatmap;

  const peakSlot = React.useMemo(() => {
    if (!data || maxCount === 0) return null;
    let peak = data[0];
    for (const d of data) {
      if (d.count > peak.count) peak = d;
    }
    return peak.count > 0 ? peak : null;
  }, [data, maxCount]);

  // Primary-based intensity scale
  const getCellBg = (count: number) => {
    if (count === 0 || maxCount === 0) return "bg-muted/40 hover:bg-muted/70";
    const ratio = count / maxCount;
    if (ratio < 0.25) return "bg-primary/15 hover:bg-primary/25";
    if (ratio < 0.5) return "bg-primary/40 hover:bg-primary/50";
    if (ratio < 0.75) return "bg-primary/70 hover:bg-primary/80";
    return "bg-primary hover:bg-primary/90 shadow-xs";
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground">
              Submission Activity Heatmap
            </h2>
          </div>
          <p className="font-sans text-xs sm:text-sm text-muted-foreground">
            Identify the exact days and peak hours when your respondents are most active
          </p>
        </div>

        {peakSlot && (
          <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl bg-muted/60 border border-border/40 text-foreground self-start sm:self-auto">
            <Flame className="size-3.5 text-muted-foreground shrink-0" />
            <span>
              Peak:{" "}
              <strong>{DAYS[peakSlot.dayOfWeek]} at {formatHour(peakSlot.hour)}</strong>{" "}
              <span className="text-muted-foreground">({peakSlot.count} responses)</span>
            </span>
          </div>
        )}
      </div>

      {/* Grid */}
      <TooltipProvider delayDuration={100}>
        <div className="overflow-x-auto pb-2">
          <div className="min-w-[650px]">
            {/* Hour labels */}
            <div className="grid grid-cols-[50px_repeat(24,1fr)] gap-1 mb-1.5 text-[10px] text-muted-foreground font-mono">
              <div />
              {Array.from({ length: 24 }).map((_, hr) => (
                <div key={hr} className="text-center truncate">
                  {hr % 3 === 0 ? formatHour(hr).replace(" ", "") : ""}
                </div>
              ))}
            </div>

            {/* Day rows */}
            <div className="space-y-1">
              {DAYS.map((dayName, dow) => (
                <div key={dow} className="grid grid-cols-[50px_repeat(24,1fr)] gap-1 items-center">
                  <span className="font-sans text-xs font-medium text-muted-foreground">{dayName}</span>
                  {Array.from({ length: 24 }).map((_, hr) => {
                    const item = data.find((d) => d.dayOfWeek === dow && d.hour === hr) ?? { dayOfWeek: dow, hour: hr, count: 0 };
                    return (
                      <Tooltip key={hr}>
                        <TooltipTrigger asChild>
                          <div className={`h-6 rounded-md transition-all duration-150 cursor-pointer ${getCellBg(item.count)}`} />
                        </TooltipTrigger>
                        <TooltipContent className="text-xs font-sans">
                          <p className="font-semibold">{DAYS[dow]} at {formatHour(hr)}</p>
                          <p className="text-[11px] opacity-70">
                            {item.count} {item.count === 1 ? "submission" : "submissions"}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-4 text-[11px] text-muted-foreground font-sans">
              <span>Less</span>
              <div className="flex items-center gap-1">
                <div className="size-3 rounded-xs bg-muted/40" />
                <div className="size-3 rounded-xs bg-primary/15" />
                <div className="size-3 rounded-xs bg-primary/40" />
                <div className="size-3 rounded-xs bg-primary/70" />
                <div className="size-3 rounded-xs bg-primary" />
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </TooltipProvider>
    </div>
  );
}
