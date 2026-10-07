"use client";

import * as React from "react";
import Link from "next/link";
import {
  ExternalLink,
  Inbox,
  RefreshCw,
  BarChart2,
  Filter,
  FileEdit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/components/dashboard/page-heading";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AnalyticsSummaryCards } from "./analytics-summary-cards";
import { AnalyticsTrendChart } from "./analytics-trend-chart";
import { AnalyticsDropoffFunnel } from "./analytics-dropoff-funnel";
import { AnalyticsQuestionInsights } from "./analytics-question-insights";
import { AnalyticsActivityHeatmap } from "./analytics-activity-heatmap";
import { AskGrizzyButton } from "./ask-grizzy-button";
import { GrizzyAnalyticsSheet } from "./grizzy-analytics-sheet";
import type { FormAnalyticsData, OrgFormAnalyticsSummary } from "@/lib/api/analytics";
import { EmptyState } from "@/components/dashboard/empty-state";

interface AnalyticsViewProps {
  forms: OrgFormAnalyticsSummary[];
  selectedFormId: string;
  onSelectForm: (formId: string) => void;
  analyticsData?: FormAnalyticsData;
  isLoading?: boolean;
  onRefresh: () => void;
}

export function AnalyticsView({
  forms,
  selectedFormId,
  onSelectForm,
  analyticsData,
  isLoading = false,
  onRefresh,
}: AnalyticsViewProps) {
  const [activeTab, setActiveTab] = React.useState("overview");
  const [isGrizzyOpen, setIsGrizzyOpen] = React.useState(false);

  const currentFormMeta = forms.find((f) => f.id === selectedFormId);
  const isFormPublished = Boolean(analyticsData?.form?.isPublished ?? currentFormMeta?.isPublished);

  // If org has zero forms
  if (forms.length === 0) {
    return (
      <EmptyState
        icon={BarChart2}
        title="No forms yet"
        description="Create your first form to start collecting responses and unlock analytics."
        actionLabel="Create a form"
        actionHref="/my-forms"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* ────────────────────────────────────────────────────────── */}
      {/* TOP HEADER: PageHeading + Form Selector + Ghost Links      */}
      {/* ────────────────────────────────────────────────────────── */}
      <TooltipProvider delayDuration={150}>
        <PageHeading
          title="Form Analytics"
          description="Conversion rates, drop-off bottlenecks, and answer distributions"
          actions={
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {/* Form Picker Dropdown */}
              <div className="flex items-center gap-1.5 mr-1">
                <Filter className="size-3.5 text-muted-foreground shrink-0" />
                <Select value={selectedFormId} onValueChange={onSelectForm}>
                  <SelectTrigger className="w-[180px] sm:w-[240px] h-8.5 text-xs rounded-xl bg-background/80 border-border/80">
                    <SelectValue placeholder="Choose a form..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {forms.map((f) => (
                      <SelectItem key={f.id} value={f.id} className="text-xs">
                        <div className="flex items-center justify-between w-full gap-2">
                          <span className="truncate max-w-[150px] font-medium">
                            {f.title || "Untitled Form"}
                          </span>
                          <span className="text-[10px] font-mono text-muted-foreground">
                            {f.totalSubmissions} resp
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Ask Grizzy AI Button */}
              <AskGrizzyButton onOpen={() => setIsGrizzyOpen(true)} />

              {/* Refresh Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="size-8.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <RefreshCw
                      className={`size-4 ${isLoading ? "animate-spin text-primary" : ""}`}
                    />
                    <span className="sr-only">Refresh analytics</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh analytics</TooltipContent>
              </Tooltip>

              {/* Quick link: View responses table (ghost icon link) */}
              {currentFormMeta && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="size-8.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    >
                      <Link href={`/responses/${currentFormMeta.slug || currentFormMeta.id}`}>
                        <Inbox className="size-4" />
                        <span className="sr-only">View responses</span>
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>View responses</TooltipContent>
                </Tooltip>
              )}

              {/* Quick link: Edit in Builder (ghost icon link) */}
              {currentFormMeta && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="size-8.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    >
                      <Link href={`/builder/${currentFormMeta.id}?mode=edit`}>
                        <FileEdit className="size-4" />
                        <span className="sr-only">Edit form</span>
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit form in builder</TooltipContent>
                </Tooltip>
              )}

              {/* Quick link: Open public form (ghost icon link — only when published) */}
              {currentFormMeta && isFormPublished && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="size-8.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    >
                      <Link
                        href={`/form/${currentFormMeta.slug || currentFormMeta.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="size-4" />
                        <span className="sr-only">Open live form</span>
                      </Link>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Open live form</TooltipContent>
                </Tooltip>
              )}
            </div>
          }
        />
      </TooltipProvider>

      {/* ────────────────────────────────────────────────────────── */}
      {/* SECTION TABS: SUMMARY / FUNNEL / HEATMAP */}
      {/* ────────────────────────────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="inline-flex h-10 p-1 rounded-full gap-1">
          <TabsTrigger
            value="overview"
            className="h-full rounded-full border-0 px-3.5 sm:px-4 text-xs sm:text-sm font-medium data-active:shadow-xs"
          >
            Summary
          </TabsTrigger>
          <TabsTrigger
            value="funnel"
            className="h-full rounded-full border-0 px-3.5 sm:px-4 text-xs sm:text-sm font-medium data-active:shadow-xs"
          >
            Drop-off Funnel
          </TabsTrigger>
          <TabsTrigger
            value="heatmap"
            className="h-full rounded-full border-0 px-3.5 sm:px-4 text-xs sm:text-sm font-medium data-active:shadow-xs"
          >
            Activity Heatmap
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: SUMMARY (The complete Typeform / Tally dashboard) */}
        <TabsContent value="overview" className="space-y-8 mt-0">
          {analyticsData && (
            <>
              {/* 1. Respondent Journey Pipeline */}
              <AnalyticsSummaryCards summary={analyticsData.summary} />

              {/* 2. Activity & Submissions Trend Chart */}
              <AnalyticsTrendChart
                data={analyticsData.viewsAndSubmissionsOverTime}
              />

              {/* 3. Question-by-Question Performance with Drop-off & Distributions */}
              <AnalyticsQuestionInsights
                insights={analyticsData.questionInsights}
                funnel={analyticsData.funnel}
              />
            </>
          )}
        </TabsContent>

        {/* Tab 2: DROP-OFF FUNNEL (Dedicated Conversion Waterfall) */}
        <TabsContent value="funnel" className="space-y-6 mt-0">
          {analyticsData && (
            <AnalyticsDropoffFunnel funnel={analyticsData.funnel} />
          )}
        </TabsContent>

        {/* Tab 3: ACTIVITY HEATMAP (Day x Hour Matrix) */}
        <TabsContent value="heatmap" className="space-y-6 mt-0">
          {analyticsData && (
            <AnalyticsActivityHeatmap heatmap={analyticsData.activityHeatmap} />
          )}
        </TabsContent>
      </Tabs>

      {/* Grizzy AI Analytics Sheet */}
      <GrizzyAnalyticsSheet
        key={selectedFormId}
        open={isGrizzyOpen}
        onOpenChange={setIsGrizzyOpen}
        formId={selectedFormId}
        formTitle={currentFormMeta?.title || "Form"}
        analyticsData={analyticsData}
      />
    </div>
  );
}
