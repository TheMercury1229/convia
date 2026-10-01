"use client";

import * as React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  Users,
  CheckCircle2,
  TrendingDown,
  Lightbulb,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { FunnelStep } from "@/lib/api/analytics";

interface AnalyticsDropoffFunnelProps {
  funnel: FunnelStep[];
}

export function AnalyticsDropoffFunnel({ funnel }: AnalyticsDropoffFunnelProps) {
  if (!funnel || funnel.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl border border-dashed border-border/60 bg-card/40">
        <Users className="size-8 text-muted-foreground/40 mb-3" />
        <h3 className="font-heading text-sm font-semibold text-foreground">No funnel data available yet</h3>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm">
          Once respondents open your form and navigate questions, progression and drop-off rates will appear here.
        </p>
      </div>
    );
  }

  // Safe baseline & overall conversion calculation (clamped between 0 and 100%)
  const lastStep = funnel[funnel.length - 1];
  const maxCount = Math.max(...funnel.map((s) => s.count), 1);
  const overallConversion = Math.min(
    100,
    maxCount > 0 ? Number(((lastStep.count / maxCount) * 100).toFixed(1)) : 0,
  );

  // Identify primary bottleneck (step with worst drop-off > 15%)
  const worstStep = React.useMemo<{ step: FunnelStep; index: number } | null>(() => {
    let worst: { step: FunnelStep; index: number } | null = null;
    let maxDrop = 0;
    funnel.forEach((step, idx) => {
      if (idx > 0 && step.dropoffRate > maxDrop) {
        maxDrop = step.dropoffRate;
        worst = { step, index: idx };
      }
    });
    return maxDrop > 15 ? worst : null;
  }, [funnel]);

  // Clean short label generator to avoid duplicate Q prefixes (e.g. Q2: Q1:)
  const formatShortLabel = (step: FunnelStep, idx: number, isLast: boolean): string => {
    if (idx === 0) return "Opened";
    if (step.step === "started" || step.label.toLowerCase().includes("started")) return "Started";
    if (isLast) return "Submitted";

    const cleaned = step.label.replace(/^Q\d+:\s*/, "");
    const qNum = idx > 1 ? `Q${idx - 1}` : `Q${idx}`;
    const truncated = cleaned.length > 10 ? `${cleaned.slice(0, 10)}…` : cleaned;
    return `${qNum}: ${truncated}`;
  };

  // Chart dataset with formatted labels and clamped percentages
  const chartData = React.useMemo(() => {
    return funnel.map((step, idx) => {
      const isLast = idx === funnel.length - 1;
      const isWorst = worstStep?.index === idx;
      const retentionPercent = Math.min(
        100,
        Math.max(0, Number(((step.count / maxCount) * 100).toFixed(1))),
      );

      return {
        stepKey: step.step,
        label: step.label,
        shortLabel: formatShortLabel(step, idx, isLast),
        count: step.count,
        percent: retentionPercent,
        dropoffRate: step.dropoffRate,
        isWorst,
        isLast,
      };
    });
  }, [funnel, maxCount, worstStep]);

  return (
    <div className="space-y-6">
      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. HEADER: KPI BAR (Clean title & grouped stats)           */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="space-y-2">
        <div className="space-y-1">
          <h2 className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground">
            Conversion Funnel
          </h2>
          <p className="font-sans text-xs sm:text-sm text-muted-foreground">
            Step-by-step visitor progression from initial view to form submission
          </p>
        </div>

        {/* KPI stat badges */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge variant="outline" className="font-sans text-xs font-normal px-3 py-1 rounded-full border-border/60 text-muted-foreground gap-1.5">
            <span className="font-semibold text-foreground tabular-nums">{maxCount.toLocaleString()}</span>
            entrants
          </Badge>
          <Badge variant="outline" className="font-sans text-xs font-normal px-3 py-1 rounded-full border-border/60 text-muted-foreground gap-1.5">
            <span className="font-semibold text-foreground tabular-nums">{lastStep.count.toLocaleString()}</span>
            submissions
          </Badge>
          <Badge variant="outline" className="font-sans text-xs font-normal px-3 py-1 rounded-full border-border/60 text-muted-foreground gap-1.5">
            <span className="font-semibold text-foreground tabular-nums">{overallConversion}%</span>
            completion rate
          </Badge>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. VISUAL FUNNEL BAR CHART                                 */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="space-y-0.5">
          <h3 className="font-heading text-base font-bold tracking-tight text-foreground">
            Stage Retention Volume
          </h3>
          <p className="font-sans text-xs text-muted-foreground">
            Percentage of total entrants surviving each stage
          </p>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card p-4 sm:p-6 shadow-none">
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="currentColor"
                  className="stroke-border/30"
                />
                <XAxis
                  dataKey="shortLabel"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  className="text-muted-foreground font-sans"
                />
                <YAxis
                  unit="%"
                  domain={[0, 100]}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: "currentColor" }}
                  className="text-muted-foreground font-sans"
                />
                {/* Subtle translucent cursor to avoid solid grey blocks on hover */}
                <Tooltip
                  cursor={{ fill: "currentColor", opacity: 0.05 }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const item = payload[0].payload;
                    return (
                      <div className="rounded-xl border border-border/70 bg-popover/95 p-3 shadow-lg backdrop-blur-md text-xs space-y-1.5 min-w-[170px]">
                        <div className="font-heading font-semibold text-foreground pb-1 border-b border-border/40 truncate">
                          {item.label}
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Respondents</span>
                          <span className="font-semibold text-foreground tabular-nums">
                            {item.count}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-muted-foreground">
                          <span>Retention</span>
                          <span className="font-semibold text-foreground tabular-nums">
                            {item.percent}%
                          </span>
                        </div>
                        {item.dropoffRate > 0 && (
                          <div className="flex items-center justify-between pt-1 border-t border-border/30 text-muted-foreground">
                            <span>Stage Drop-off</span>
                            <span className="font-medium text-foreground">
                              -{item.dropoffRate}%
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  }}
                />
                <Bar dataKey="percent" radius={[5, 5, 0, 0]} maxBarSize={44} fill="var(--primary)">
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill="var(--primary)"
                      fillOpacity={entry.isLast ? 1 : 0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 3. STEP-BY-STEP FUNNEL MATRIX (Using Shadcn Table)         */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="font-heading text-base font-bold tracking-tight text-foreground">
              Stage Breakdown
            </h3>
            <p className="font-sans text-xs text-muted-foreground">
              Granular drop-off and conversion rates per stage
            </p>
          </div>
          <span className="font-sans text-xs text-muted-foreground font-mono bg-muted px-2.5 py-0.5 rounded-full border border-border/40">
            {funnel.length} steps
          </span>
        </div>

        <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-none">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border/30">
                <TableHead className="py-3 px-5 text-xs font-medium">Stage</TableHead>
                <TableHead className="py-3 px-4 text-xs font-medium">Respondents</TableHead>
                <TableHead className="py-3 px-4 text-xs font-medium w-[30%]">Retention</TableHead>
                <TableHead className="py-3 px-4 text-xs font-medium">Conversion</TableHead>
                <TableHead className="py-3 px-4 text-xs font-medium">Drop-off</TableHead>
                <TableHead className="py-3 pr-5 text-xs font-medium text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {funnel.map((step, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === funnel.length - 1;
                const isWorst = worstStep?.index === idx;
                const prevCount = idx > 0 ? funnel[idx - 1].count : step.count;
                const lostCount = Math.max(0, prevCount - step.count);
                const retentionPercent = Math.min(
                  100,
                  Math.max(0, Number(((step.count / maxCount) * 100).toFixed(1))),
                );

                return (
                  <TableRow
                    key={step.step}
                    className={`border-b border-border/30 transition-colors ${isWorst ? "bg-muted/25" : ""
                      }`}
                  >
                    {/* Stage Title */}
                    <TableCell className="py-3 px-5 font-medium text-foreground">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`size-5 rounded-md flex items-center justify-center text-[10px] font-semibold shrink-0 ${isLast
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground border border-border/60"
                            }`}
                        >
                          {isLast ? <CheckCircle2 className="size-3" /> : idx + 1}
                        </span>
                        <span className="font-sans truncate max-w-[200px] sm:max-w-none text-xs sm:text-sm">
                          {step.label}
                        </span>
                      </div>
                    </TableCell>

                    {/* Respondent Count */}
                    <TableCell className="py-3 px-4 font-sans font-semibold text-foreground tabular-nums text-xs sm:text-sm">
                      {step.count.toLocaleString()}
                    </TableCell>

                    {/* Proportional Volume Bar */}
                    <TableCell className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-2 w-full rounded-full bg-muted/60 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${isLast ? "bg-primary" : "bg-primary/80"
                              }`}
                            style={{ width: `${Math.max(retentionPercent, 2)}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-mono text-muted-foreground w-10 text-right shrink-0">
                          {retentionPercent}%
                        </span>
                      </div>
                    </TableCell>

                    {/* Conversion from start */}
                    <TableCell className="py-3 px-4 tabular-nums text-foreground font-medium text-xs sm:text-sm">
                      {retentionPercent}%
                    </TableCell>

                    {/* Drop-off relative to previous step */}
                    <TableCell className="py-3 px-4 tabular-nums text-xs">
                      {isFirst ? (
                        <span className="text-muted-foreground font-mono">—</span>
                      ) : lostCount > 0 ? (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <TrendingDown className="size-3 text-muted-foreground/60" />
                          <span className="font-medium text-foreground">
                            -{step.dropoffRate}%
                          </span>
                          <span className="text-[10px] opacity-70">
                            ({lostCount} lost)
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-mono">0%</span>
                      )}
                    </TableCell>

                    {/* Status Badge using Shadcn Badge */}
                    <TableCell className="py-3 pr-5 text-right">
                      {isFirst ? (
                        <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground border-border/50">
                          Baseline
                        </Badge>
                      ) : isLast ? (
                        <Badge variant="outline" className="text-[10px] font-semibold text-foreground border-border/70 bg-muted/40">
                          Completed
                        </Badge>
                      ) : isWorst ? (
                        <Badge variant="outline" className="text-[10px] font-medium text-foreground border-border/70 bg-muted">
                          Top Leak
                        </Badge>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">
                          Normal
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* ────────────────────────────────────────────────────────── */}
        {/* 4. CONTEXTUAL ACTIONABLE INSIGHT BOX                       */}
        {/* ────────────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border/50 bg-muted/20 p-4 sm:p-5 flex items-start gap-3.5">
          <div className="size-8 rounded-xl bg-muted border border-border/60 flex items-center justify-center text-foreground shrink-0 mt-0.5">
            <Lightbulb className="size-4" />
          </div>
          <div className="space-y-1 text-xs">
            <h4 className="font-sans font-semibold text-foreground text-sm">
              Funnel Diagnostic
            </h4>
            {worstStep ? (
              <p className="text-muted-foreground leading-relaxed">
                The primary drop-off occurs at{" "}
                <strong className="text-foreground font-medium">
                  {worstStep.step.label}
                </strong>
                , where{" "}
                <span className="text-foreground font-semibold">
                  {worstStep.step.dropoffRate}%
                </span>{" "}
                of respondents abandoned the form. Consider simplifying the prompt,
                making it optional, or providing a clear explanation to reduce abandonment.
              </p>
            ) : lastStep.count > 0 ? (
              <p className="text-muted-foreground leading-relaxed">
                Your funnel is performing smoothly with consistent progression across all steps and healthy submission retention.
              </p>
            ) : (
              <p className="text-muted-foreground leading-relaxed">
                Visitors have opened the form but haven't completed all steps yet. As more respondents submit answers, completion patterns and drop-off diagnostics will adjust automatically.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
