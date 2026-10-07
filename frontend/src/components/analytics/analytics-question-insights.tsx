"use client";

import * as React from "react";
import {
  Star,
  TrendingDown,
  Search,
  CheckSquare,
  CircleDot,
  ListFilter,
  ToggleLeft,
  Type,
  Hash,
  Mail,
  Phone,
  Link as LinkIcon,
  Calendar,
  Upload,
  AlignLeft,
  Sliders,
  CircleHelp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import type { QuestionInsight, FunnelStep } from "@/lib/api/analytics";

interface AnalyticsQuestionInsightsProps {
  insights: QuestionInsight[];
  funnel?: FunnelStep[];
}

// ---------------------------------------------------------------------------
// Helper: Map question types to icons & human-readable labels
// ---------------------------------------------------------------------------
function getQuestionTypeMeta(type: string): {
  label: string;
  icon: React.ElementType;
} {
  const normalized = type.toLowerCase().replace(/[- ]/g, "_");

  switch (normalized) {
    case "rating":
      return { label: "Rating", icon: Star };
    case "scale":
      return { label: "Scale", icon: Sliders };
    case "checkbox":
    case "multiple_choice":
      return { label: "Multi Choice", icon: CheckSquare };
    case "radio":
    case "single_choice":
      return { label: "Single Choice", icon: CircleDot };
    case "select":
    case "dropdown":
      return { label: "Dropdown", icon: ListFilter };
    case "yes_no":
      return { label: "Yes / No", icon: ToggleLeft };
    case "number":
      return { label: "Number", icon: Hash };
    case "email":
      return { label: "Email", icon: Mail };
    case "phone":
      return { label: "Phone", icon: Phone };
    case "url":
      return { label: "URL", icon: LinkIcon };
    case "date":
    case "datetime":
      return { label: "Date", icon: Calendar };
    case "file":
      return { label: "File", icon: Upload };
    case "textarea":
    case "paragraph":
      return { label: "Long Text", icon: AlignLeft };
    case "text":
    default:
      return {
        label: normalized.replace("_", " "),
        icon: Type,
      };
  }
}

export function AnalyticsQuestionInsights({
  insights,
  funnel,
}: AnalyticsQuestionInsightsProps) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [trackingFilter, setTrackingFilter] = React.useState<"all" | "trackable" | "non-trackable">("all");

  const isQuestionTrackable = React.useCallback((q: QuestionInsight) => {
    const hasDistribution = Boolean(q.distribution && q.distribution.length > 0);
    const hasKeywords = Boolean(q.topWords && q.topWords.length > 0);
    const hasScores = q.averageScore !== null || q.npsScore !== null;
    return hasDistribution || hasKeywords || hasScores;
  }, []);

  const trackableCount = React.useMemo(() => {
    return insights.filter(isQuestionTrackable).length;
  }, [insights, isQuestionTrackable]);

  const nonTrackableCount = insights.length - trackableCount;

  // Quick lookup for question drop-off from funnel
  const funnelMap = React.useMemo(() => {
    const map = new Map<string, FunnelStep>();
    if (funnel) {
      for (const step of funnel) {
        if (step.step.startsWith("q_")) {
          const qId = step.step.replace("q_", "");
          map.set(qId, step);
        }
      }
    }
    return map;
  }, [funnel]);

  // Filtered insights by search query and tracking filter
  const filteredInsights = React.useMemo(() => {
    let list = insights;
    if (trackingFilter === "trackable") {
      list = list.filter(isQuestionTrackable);
    } else if (trackingFilter === "non-trackable") {
      list = list.filter((q) => !isQuestionTrackable(q));
    }

    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q)
    );
  }, [insights, trackingFilter, searchQuery, isQuestionTrackable]);

  if (!insights || insights.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center text-muted-foreground text-sm bg-card/30">
        <CircleHelp className="size-8 text-muted-foreground/40 mx-auto mb-3" />
        <h4 className="font-heading text-sm font-semibold text-foreground">
          No answerable questions found
        </h4>
        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
          Add input questions to your form to collect and track question-by-question metrics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ────────────────────────────────────────────────────────── */}
      {/* 1. MINIMAL HEADER: Title, Subtitle, & Question Count       */}
      {/* ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="font-heading text-base sm:text-lg font-bold tracking-tight text-foreground">
              Question Performance
            </h3>
            <span className="font-sans text-xs font-mono text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full border border-border/40">
              {insights.length} questions
            </span>
          </div>
          <p className="font-sans text-xs sm:text-sm text-muted-foreground">
            Breakdown of answer distributions, ratings, and drop-off per question
          </p>
        </div>

        {/* Filter controls: Segmented pills for Trackable / Non-trackable & Search */}
        <div className="flex flex-wrap items-center gap-2">
          {nonTrackableCount > 0 && (
            <div className="inline-flex items-center rounded-xl border border-border/70 bg-muted/40 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setTrackingFilter("all")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer",
                  trackingFilter === "all"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                All ({insights.length})
              </button>
              <button
                type="button"
                onClick={() => setTrackingFilter("trackable")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer",
                  trackingFilter === "trackable"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Trackable ({trackableCount})
              </button>
              <button
                type="button"
                onClick={() => setTrackingFilter("non-trackable")}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer",
                  trackingFilter === "non-trackable"
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Non-trackable ({nonTrackableCount})
              </button>
            </div>
          )}

          {/* Clean, unobtrusive search input */}
          {insights.length > 3 && (
            <div className="relative w-full sm:w-56">
              <Search className="size-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter questions..."
                className="h-8 pl-8.5 pr-3 text-xs rounded-xl bg-background/60 border-border/70"
              />
            </div>
          )}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* 2. MINIMAL ACCORDION LIST                                  */}
      {/* ────────────────────────────────────────────────────────── */}
      {filteredInsights.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center text-muted-foreground text-xs bg-card/20">
          No questions match &ldquo;{searchQuery}&rdquo;.
        </div>
      ) : (
        <Accordion
          type="multiple"
          className="rounded-2xl border border-border/50 bg-card overflow-hidden divide-y divide-border/40"
        >
          {filteredInsights.map((q, idx) => {
            const funnelStep = funnelMap.get(q.questionId);
            const dropRate = funnelStep?.dropoffRate ?? 0;
            const isHighDrop = dropRate >= 15;
            const typeMeta = getQuestionTypeMeta(q.type);
            const TypeIcon = typeMeta.icon;
            const isTrackable = isQuestionTrackable(q);

            if (!isTrackable) {
              return (
                <div
                  key={q.questionId}
                  className="px-4 sm:px-5 py-3.5 sm:py-4 bg-muted/10 border-b-0 not-last:border-b not-last:border-border/40 select-none cursor-default"
                >
                  <div className="flex items-center justify-between w-full text-left gap-3 sm:gap-6">
                    {/* Left: Question index, Type hint badge, Non-trackable badge, Label */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="font-mono text-xs text-muted-foreground/70 shrink-0 w-5 text-center">
                        #{idx + 1}
                      </span>
                      <span className="text-[10px] uppercase font-mono font-medium tracking-wider text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-md border border-border/50 shrink-0 inline-flex items-center gap-1.5">
                        <TypeIcon className="size-3 opacity-70" />
                        <span>{typeMeta.label}</span>
                      </span>
                      <span className="text-[10px] font-mono font-medium text-muted-foreground/80 bg-muted/70 px-2 py-0.5 rounded-md border border-dashed border-border/70 shrink-0">
                        Non-trackable
                      </span>
                      <span className="font-sans text-xs sm:text-sm font-medium text-foreground truncate">
                        {q.label}
                      </span>
                      {q.isRequired && (
                        <span
                          className="text-destructive text-xs font-bold leading-none shrink-0"
                          title="Required"
                        >
                          *
                        </span>
                      )}
                    </div>

                    {/* Right: Responses count & Drop-off % */}
                    <div className="flex items-center gap-3 sm:gap-5 shrink-0 text-xs font-sans">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="font-semibold text-foreground tabular-nums">
                          {q.totalAnswered}
                        </span>
                        <span className="hidden sm:inline">answered</span>
                        <span className="text-muted-foreground/50 hidden sm:inline">•</span>
                        <span className="font-mono text-muted-foreground">
                          {q.answerRate}%
                        </span>
                      </div>

                      {dropRate > 0 && (
                        <span
                          className={`font-mono text-[11px] sm:text-xs inline-flex items-center gap-1 ${
                            isHighDrop
                              ? "text-destructive font-semibold"
                              : "text-muted-foreground"
                          }`}
                        >
                          <TrendingDown className="size-3 shrink-0" />
                          <span>{dropRate}% drop</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <AccordionItem
                key={q.questionId}
                value={q.questionId}
                className="border-b-0 not-last:border-b-0"
              >
                <AccordionTrigger className="px-4 sm:px-5 py-3.5 sm:py-4 hover:no-underline hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between w-full pr-2 text-left gap-3 sm:gap-6">
                    {/* Left: Question index, Type hint badge, Label */}
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="font-mono text-xs text-muted-foreground/70 shrink-0 w-5 text-center">
                        #{idx + 1}
                      </span>
                      <span className="text-[10px] uppercase font-mono font-medium tracking-wider text-muted-foreground bg-muted/80 px-2 py-0.5 rounded-md border border-border/50 shrink-0 inline-flex items-center gap-1.5">
                        <TypeIcon className="size-3 opacity-70" />
                        <span>{typeMeta.label}</span>
                      </span>
                      <span className="font-sans text-xs sm:text-sm font-medium text-foreground truncate">
                        {q.label}
                      </span>
                      {q.isRequired && (
                        <span
                          className="text-destructive text-xs font-bold leading-none shrink-0"
                          title="Required"
                        >
                          *
                        </span>
                      )}
                    </div>

                    {/* Right: Responses count & Drop-off % */}
                    <div className="flex items-center gap-3 sm:gap-5 shrink-0 text-xs font-sans">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <span className="font-semibold text-foreground tabular-nums">
                          {q.totalAnswered}
                        </span>
                        <span className="hidden sm:inline">answered</span>
                        <span className="text-muted-foreground/50 hidden sm:inline">•</span>
                        <span className="font-mono text-muted-foreground">
                          {q.answerRate}%
                        </span>
                      </div>

                      {dropRate > 0 && (
                        <span
                          className={`font-mono text-[11px] sm:text-xs inline-flex items-center gap-1 ${
                            isHighDrop
                              ? "text-destructive font-semibold"
                              : "text-muted-foreground"
                          }`}
                        >
                          <TrendingDown className="size-3 shrink-0" />
                          <span>{dropRate}% drop</span>
                        </span>
                      )}
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent className="px-4 sm:px-5 pt-2 pb-5 border-t border-border/30 bg-muted/10">
                  <QuestionDetailContent
                    question={q}
                    typeLabel={typeMeta.label}
                    dropRate={dropRate}
                    isHighDrop={isHighDrop}
                  />
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Minimalist Question Detail Content (No bulky card nesting)
// ---------------------------------------------------------------------------
interface QuestionDetailContentProps {
  question: QuestionInsight;
  typeLabel: string;
  dropRate: number;
  isHighDrop: boolean;
}

function QuestionDetailContent({
  question,
  typeLabel,
  dropRate,
  isHighDrop,
}: QuestionDetailContentProps) {
  const hasDistribution =
    question.distribution && question.distribution.length > 0;
  const hasKeywords = question.topWords && question.topWords.length > 0;
  const hasScores =
    question.averageScore !== null || question.npsScore !== null;

  return (
    <div className="space-y-3.5 pt-1">
      {/* Question metadata hint */}
      <div className="flex items-center justify-between text-[11px] font-sans text-muted-foreground/75 pb-2 border-b border-border/25">
        <span>
          Format: <strong className="font-medium text-foreground">{typeLabel}</strong>
          {question.isRequired ? " • Required" : " • Optional"}
        </span>
        <span className="font-mono text-[10px]">
          {question.totalAnswered} answered • {question.totalSkipped} skipped
        </span>
      </div>

      {/* 1. Option Choice Distribution Bars */}
      {hasDistribution && (
        <div className="space-y-2.5">
          {question.distribution.map((item, dIdx) => (
            <div key={dIdx} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-sans">
                <span className="text-foreground font-medium truncate max-w-[240px] sm:max-w-md">
                  {item.label}
                </span>
                <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground shrink-0">
                  <span>{item.count}</span>
                  <span className="font-semibold text-foreground">
                    {item.percent}%
                  </span>
                </div>
              </div>
              <div className="w-full h-1.5 rounded-full bg-muted/60 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/80 transition-all duration-300"
                  style={{ width: `${Math.max(2, item.percent)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. Rating & Score Visualization */}
      {hasScores && (
        <div className="flex items-center gap-4 flex-wrap pt-1 text-xs">
          {question.averageScore !== null && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`size-3.5 ${
                      i < Math.round(question.averageScore ?? 0)
                        ? "fill-amber-400 text-amber-500"
                        : "text-muted-foreground/20 fill-muted-foreground/10"
                    }`}
                  />
                ))}
              </div>
              <span className="font-mono font-semibold text-foreground">
                {question.averageScore} / 5.0 avg
              </span>
            </div>
          )}

          {question.npsScore !== null && (
            <Badge
              variant="outline"
              className="font-mono text-xs px-2.5 py-0.5 rounded-full border-border/60 bg-muted/40"
            >
              NPS:{" "}
              <span className="font-bold ml-1">
                {question.npsScore > 0
                  ? `+${question.npsScore}`
                  : question.npsScore}
              </span>
            </Badge>
          )}
        </div>
      )}

      {/* 3. Top Keywords for Open-Ended Inputs */}
      {hasKeywords && (
        <div className="space-y-2 pt-1">
          <div className="text-xs font-medium text-muted-foreground">
            Top mentions & keywords
          </div>
          <div className="flex flex-wrap gap-1.5">
            {question.topWords.map((tw, tIdx) => (
              <span
                key={tIdx}
                className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs bg-muted/60 text-foreground border border-border/40"
              >
                <span className="font-medium">{tw.word}</span>
                <span className="text-[10px] font-mono text-muted-foreground font-semibold px-1 py-0.2 bg-background rounded">
                  {tw.count}
                </span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 4. Minimal Drop-off Friction Warning */}
      {isHighDrop && (
        <div className="flex items-center gap-2 text-xs text-destructive bg-destructive/5 px-3 py-2 rounded-xl border border-destructive/20 mt-2">
          <TrendingDown className="size-3.5 shrink-0" />
          <span>
            High drop-off rate ({dropRate}%): respondents frequently abandon the form at this step.
          </span>
        </div>
      )}

      {/* Empty State */}
      {!hasDistribution && !hasKeywords && !hasScores && (
        <p className="text-xs text-muted-foreground/60 italic py-1">
          No answers recorded for this question yet.
        </p>
      )}
    </div>
  );
}
