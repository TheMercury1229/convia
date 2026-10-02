"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  type ChartConfig,
} from "@/components/ui/chart";
import type { ViewsAndSubmissionsOverTime } from "@/lib/api/analytics";

const trendChartConfig = {
  views: {
    label: "Views",
    color: "var(--muted-foreground)",
  },
  submissions: {
    label: "Submissions",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

interface AnalyticsTrendChartProps {
  data: ViewsAndSubmissionsOverTime[];
}

function formatDateLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

export function AnalyticsTrendChart({ data }: AnalyticsTrendChartProps) {
  const [range, setRange] = React.useState<"7d" | "14d" | "30d" | "all">("14d");

  const filteredData = React.useMemo(() => {
    if (range === "all") return data;
    const days = range === "7d" ? 7 : range === "14d" ? 14 : 30;
    return data.slice(-days);
  }, [data, range]);

  const totalViewsInRange = React.useMemo(
    () => filteredData.reduce((acc, curr) => acc + curr.views, 0),
    [filteredData],
  );

  const totalSubmissionsInRange = React.useMemo(
    () => filteredData.reduce((acc, curr) => acc + curr.submissions, 0),
    [filteredData],
  );

  return (
    <div className="space-y-4">
      {/* Section Header: Title, Legend Totals, and Date Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-heading text-base sm:text-lg font-bold tracking-tight text-foreground">
              Activity & Submissions Trend
            </h3>
            <div className="flex flex-wrap items-center gap-3 text-xs font-sans text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full border border-muted-foreground/60" />
                <span>Views:</span>
                <span className="font-semibold text-foreground tabular-nums">
                  {totalViewsInRange.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-primary" />
                <span>Submissions:</span>
                <span className="font-semibold text-foreground tabular-nums">
                  {totalSubmissionsInRange.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <p className="font-sans text-xs sm:text-sm text-muted-foreground">
            Daily views vs completed form submissions over time
          </p>
        </div>

        {/* Date range filter pills */}
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-full border border-border/40 self-start sm:self-auto shrink-0">
          {(
            [
              { key: "7d", label: "7D" },
              { key: "14d", label: "14D" },
              { key: "30d", label: "30D" },
              { key: "all", label: "All" },
            ] as const
          ).map((btn) => (
            <Button
              key={btn.key}
              variant="ghost"
              size="sm"
              onClick={() => setRange(btn.key)}
              className={`h-7 px-3 text-xs font-medium rounded-full transition-all ${
                range === btn.key
                  ? "bg-background text-foreground shadow-2xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {btn.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="rounded-2xl border border-border/50 bg-card p-4 sm:p-6 shadow-none">
        <div className="h-[280px] sm:h-[300px] w-full min-w-0">
          <ChartContainer
            config={trendChartConfig}
            className="h-[280px] sm:h-[300px] w-full aspect-auto"
            initialDimension={{ width: 600, height: 300 }}
          >
            <AreaChart
              data={filteredData}
              margin={{ top: 12, right: 12, left: -10, bottom: 4 }}
            >
              <defs>
                <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="currentColor" stopOpacity={0.12} />
                  <stop offset="95%" stopColor="currentColor" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="submissionsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="currentColor"
                className="stroke-border/30"
              />

              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                dy={8}
                tickFormatter={formatDateLabel}
                tick={{ fontSize: 12, fill: "currentColor" }}
                className="text-muted-foreground font-sans"
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                dx={-4}
                tick={{ fontSize: 12, fill: "currentColor" }}
                className="text-muted-foreground font-sans"
              />

              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const item = payload[0].payload as ViewsAndSubmissionsOverTime;
                  const convRate =
                    item.views > 0
                      ? ((item.submissions / item.views) * 100).toFixed(0)
                      : "0";
                  return (
                    <div className="rounded-xl border border-border/70 bg-popover/95 p-3 shadow-lg backdrop-blur-md text-xs space-y-2 min-w-[150px]">
                      <div className="font-heading font-semibold text-foreground pb-1.5 border-b border-border/40 text-[13px]">
                        {formatDateLabel(item.date)}
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <span className="size-2 rounded-full border border-muted-foreground/60" />
                          <span>Views</span>
                        </span>
                        <span className="font-semibold text-foreground tabular-nums text-sm">
                          {item.views}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <span className="size-2 rounded-full bg-primary" />
                          <span>Submissions</span>
                        </span>
                        <span className="font-semibold text-foreground tabular-nums text-sm">
                          {item.submissions}
                        </span>
                      </div>
                      <div className="pt-1 border-t border-border/40 text-[11px] text-muted-foreground flex justify-between">
                        <span>Conversion</span>
                        <span className="font-medium text-foreground">
                          {convRate}%
                        </span>
                      </div>
                    </div>
                  );
                }}
              />

              {/* Views Area: Subtle neutral dashed line */}
              <Area
                type="monotone"
                dataKey="views"
                stroke="currentColor"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                className="text-muted-foreground"
                fillOpacity={1}
                fill="url(#viewsGradient)"
              />
              {/* Submissions Area: Primary app brand line */}
              <Area
                type="monotone"
                dataKey="submissions"
                stroke="var(--primary)"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#submissionsGradient)"
              />
            </AreaChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
