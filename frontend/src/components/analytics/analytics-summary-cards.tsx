"use client";

import * as React from "react";
import { Eye, PlayCircle, CheckCircle2, TrendingUp } from "lucide-react";
import type { FormAnalyticsSummary } from "@/lib/api/analytics";

interface AnalyticsSummaryCardsProps {
  summary: FormAnalyticsSummary;
}

export function AnalyticsSummaryCards({ summary }: AnalyticsSummaryCardsProps) {
  const engagementRate =
    typeof summary.engagementRate === "number"
      ? summary.engagementRate
      : summary.totalViews > 0
        ? Number(((summary.totalStarts / summary.totalViews) * 100).toFixed(1))
        : 0;

  const completionRate =
    typeof summary.completionRate === "number"
      ? summary.completionRate
      : summary.totalStarts > 0
        ? Number(
            (
              ((summary.completedSubmissions ?? summary.totalSubmissions) /
                summary.totalStarts) *
              100
            ).toFixed(1),
          )
        : 0;

  const completedCount =
    summary.completedSubmissions ?? summary.totalSubmissions;
  const partialCount = summary.partialSubmissions ?? 0;

  const metrics = [
    {
      label: "Views",
      value: summary.totalViews.toLocaleString(),
      subtext: `${summary.uniqueVisitors.toLocaleString()} unique visitor${summary.uniqueVisitors === 1 ? "" : "s"}`,
      icon: Eye,
    },
    {
      label: "Starts",
      value: summary.totalStarts.toLocaleString(),
      subtext: `${Math.min(100, engagementRate)}% engagement rate`,
      icon: PlayCircle,
    },
    {
      label: "Submissions",
      value: completedCount.toLocaleString(),
      subtext:
        partialCount > 0
          ? `${partialCount} partial excluded (${summary.totalSubmissions} total)`
          : "All submissions completed",
      icon: CheckCircle2,
    },
    {
      label: "Completion Rate",
      value: `${Math.min(100, completionRate)}%`,
      subtext: `${Math.min(100, summary.visitToSubmissionRate)}% overall conversion`,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden">
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border/40">
        {metrics.map((m, idx) => (
          <div key={idx} className="p-5 sm:p-6 flex flex-col gap-3">
            {/* Top row: label + icon */}
            <div className="flex items-center justify-between">
              <span className="font-sans text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70">
                {m.label}
              </span>
              <m.icon className="size-3.5 text-muted-foreground/40" />
            </div>

            {/* Big metric number */}
            <div className="font-sans text-2xl sm:text-3xl font-bold tracking-tight text-foreground tabular-nums leading-none">
              {m.value}
            </div>

            {/* Sub-label */}
            <p className="font-sans text-xs text-muted-foreground truncate leading-tight">
              {m.subtext}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
