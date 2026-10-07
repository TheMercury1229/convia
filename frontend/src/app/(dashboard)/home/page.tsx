"use client";

import * as React from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  Inbox,
  Globe,
  Percent,
  Search,
  ArrowUpRight,
  Plus,
  RotateCcw,
  Eye,
  FileText,
  Loader2,
} from "lucide-react";

import { useForms, useForm } from "@/hooks/use-forms";
import { useAllOrgResponses } from "@/hooks/use-responses";
import type { OrgResponseItem } from "@/lib/api/responses";
import type { ApiQuestion } from "@/lib/api/forms";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { CreateFormDialog } from "@/components/my-forms/create-form-dialog";
import {
  BuildWithGrizzyDialog,
  BuildWithGrizzyButton,
} from "@/components/my-forms/build-with-grizzy-dialog";
import { ResponseDetailDialog } from "@/components/responses/response-detail-dialog";
import { PageHeading } from "@/components/dashboard/page-heading";

export default function HomePage() {
  // 1. Data hooks
  const {
    data: forms,
    isLoading: formsLoading,
    refetch: refetchForms,
    isRefetching: formsRefetching,
  } = useForms();

  const {
    data: orgResponsesData,
    isLoading: responsesLoading,
    refetch: refetchResponses,
    isRefetching: responsesRefetching,
  } = useAllOrgResponses();

  const isInitialLoading = (formsLoading || responsesLoading) && (!forms || !orgResponsesData);
  const isRefreshing = formsRefetching || responsesRefetching;

  // 2. Local State
  const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
  const [grizzyDialogOpen, setGrizzyDialogOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedResponse, setSelectedResponse] = React.useState<OrgResponseItem | null>(null);
  const [loadingResponseId, setLoadingResponseId] = React.useState<string | null>(null);

  // 3. Form details for selected response dialog
  const { data: activeFormDetails, isLoading: isFormDetailsLoading } = useForm(selectedResponse?.formId || "");
  const activeQuestions = React.useMemo<ApiQuestion[]>(() => {
    if (!activeFormDetails?.sections) return [];
    return activeFormDetails.sections
      .flatMap((s) => s.questions || [])
      .filter((q) => q.type !== "heading");
  }, [activeFormDetails]);

  const handleSelectResponse = (item: OrgResponseItem) => {
    setLoadingResponseId(item.id);
    setSelectedResponse(item);
  };

  React.useEffect(() => {
    if (!isFormDetailsLoading) {
      setLoadingResponseId(null);
    }
  }, [isFormDetailsLoading, selectedResponse]);

  // 4. Metrics computation
  const formsList = forms || [];
  const publishedForms = formsList.filter((f) => f.isPublished).length;
  const draftForms = formsList.length - publishedForms;

  const totalSubmissions = orgResponsesData?.metrics.totalResponses ?? 0;
  const allResponses = orgResponsesData?.responses || [];
  const completedSubmissions = allResponses.filter((r) => (r.completionRate ?? 100) >= 100).length;
  const partialSubmissions = Math.max(0, totalSubmissions - completedSubmissions);
  const completionRate = orgResponsesData?.metrics.averageCompletionRate ?? 0;

  // 5. Helper to resolve respondent name
  const getDisplayName = (item: OrgResponseItem) => {
    const firstAnswer = item.answers?.find(
      (a) => a.value && typeof a.value === "string" && a.value.trim().length > 0
    )?.value as string | undefined;

    const emailAnswer = item.answers?.find(
      (a) =>
        a.fieldName.toLowerCase().includes("email") ||
        (typeof a.value === "string" && a.value.includes("@"))
    )?.value as string | undefined;

    return emailAnswer || firstAnswer || "Anonymous Respondent";
  };

  // 6. Filter recent responses (take up to latest 8)
  const recentResponses = React.useMemo(() => {
    const list = orgResponsesData?.responses || [];
    if (!searchQuery.trim()) {
      return list.slice(0, 8);
    }
    const q = searchQuery.toLowerCase();
    return list
      .filter((r) => {
        if (r.formTitle.toLowerCase().includes(q)) return true;
        const name = getDisplayName(r).toLowerCase();
        if (name.includes(q)) return true;
        return r.answers?.some((a) => String(a.value || "").toLowerCase().includes(q));
      })
      .slice(0, 8);
  }, [orgResponsesData?.responses, searchQuery]);

  const handleRefresh = () => {
    refetchForms();
    refetchResponses();
  };

  // 7. Loading skeleton
  if (isInitialLoading) {
    return (
      <div className="space-y-8 animate-pulse pb-12">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-40 rounded-lg" />
            <Skeleton className="h-4 w-72 rounded" />
          </div>
          <Skeleton className="h-9 w-28 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
          <Skeleton className="h-32 rounded-2xl" />
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-44 rounded" />
            <Skeleton className="h-9 w-60 rounded-xl" />
          </div>
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-8 pb-12">
        {/* ------------------------------------------------------------------ */}
        <PageHeading
          title="Dashboard"
          description="Overview of your forms, submission activity, and performance."
          actions={
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="size-8.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <RotateCcw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} />
                    <span className="sr-only">Refresh data</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh data</TooltipContent>
              </Tooltip>

              <BuildWithGrizzyButton
                onTrigger={() => setGrizzyDialogOpen(true)}
                className="h-8.5 text-xs sm:text-sm rounded-xl"
              />

              <Button
                size="sm"
                onClick={() => setCreateDialogOpen(true)}
                className="gap-1.5 h-8.5 text-xs sm:text-sm rounded-xl font-medium shadow-xs"
              >
                <Plus className="size-4" />
                <span>Create Form</span>
              </Button>
            </>
          }
        />

        {/* ------------------------------------------------------------------ */}
        {/* 3 Clean KPI Cards (Theme-aligned)                                   */}
        {/* ------------------------------------------------------------------ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Submissions */}
          <div className="group rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/40 flex flex-col justify-between gap-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Total Submissions
              </span>
              <Inbox className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>

            <div className="space-y-1.5">
              <div className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-mono">
                {totalSubmissions.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {completedSubmissions} complete · {partialSubmissions} partial
              </p>
            </div>
          </div>

          {/* Card 2: Active Forms */}
          <div className="group rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/40 flex flex-col justify-between gap-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Active Forms
              </span>
              <Globe className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>

            <div className="space-y-1.5">
              <div className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-mono">
                {publishedForms}
              </div>
              <p className="text-xs text-muted-foreground">
                {publishedForms} published · {draftForms} draft{draftForms === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          {/* Card 3: Avg Completion Rate */}
          <div className="group rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/40 flex flex-col justify-between gap-5 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Avg Completion Rate
              </span>
              <Percent className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>

            <div className="space-y-1.5">
              <div className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-mono">
                {completionRate}%
              </div>
              <p className="text-xs text-muted-foreground">
                Across all forms and submissions
              </p>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Recent Activity Stream: Focused Submissions Table (Option B)       */}
        {/* ------------------------------------------------------------------ */}
        <div className="space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
                Recent Submissions
              </h2>
              <p className="text-xs text-muted-foreground">
                Latest responses submitted across your published forms.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-56">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Filter submissions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8.5 h-8.5 text-xs bg-card border-border rounded-xl"
                />
              </div>

              <Button
                asChild
                variant="ghost"
                size="sm"
                className="gap-1 text-xs text-muted-foreground hover:text-foreground h-8.5 shrink-0"
              >
                <Link href="/responses">
                  <span>View all</span>
                  <ArrowUpRight className="size-3.5" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Table Container */}
          <div className="rounded-2xl border border-border/80 bg-card overflow-hidden shadow-xs">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className="w-[200px] sm:w-[240px] text-xs font-semibold uppercase tracking-wider text-muted-foreground pl-5">
                    Form
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Respondent
                  </TableHead>
                  <TableHead className="w-[130px] text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Completion
                  </TableHead>
                  <TableHead className="w-[160px] text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Submitted
                  </TableHead>
                  <TableHead className="w-[70px] text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground pr-5">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {recentResponses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-44 text-center">
                      <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2">
                        <Inbox className="size-8 stroke-[1.5] text-muted-foreground/40" />
                        <p className="text-sm font-medium">No submissions yet</p>
                        <p className="text-xs text-muted-foreground/80 max-w-sm">
                          {searchQuery
                            ? "No submissions matched your search query."
                            : "Share your published forms to start collecting responses."}
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  recentResponses.map((item) => {
                    const isCompleted = (item.completionRate ?? 100) >= 100;
                    const submittedDate = item.submittedAt
                      ? new Date(item.submittedAt)
                      : new Date();
                    const displayName = getDisplayName(item);

                    return (
                      <TableRow
                        key={item.id}
                        className="hover:bg-muted/30 cursor-pointer transition-colors group border-border/60"
                        onClick={() => handleSelectResponse(item)}
                      >
                        {/* Form Title */}
                        <TableCell className="pl-5">
                          <Link
                            href={`/responses/${item.formSlug || item.formId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-medium text-foreground text-sm hover:text-primary transition-colors truncate max-w-[180px] sm:max-w-[220px] block"
                            title="View all responses for this form"
                          >
                            {item.formTitle}
                          </Link>
                        </TableCell>

                        {/* Respondent Display Name */}
                        <TableCell>
                          <span className="font-normal text-muted-foreground text-sm truncate max-w-[200px] block">
                            {displayName}
                          </span>
                        </TableCell>

                        {/* Completion Column */}
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className={`size-1.5 rounded-full shrink-0 ${
                                isCompleted ? "bg-primary" : "bg-muted-foreground/40"
                              }`}
                            />
                            <span className="font-mono text-xs font-semibold text-foreground">
                              {item.completionRate ?? 100}%
                            </span>
                          </div>
                        </TableCell>

                        {/* Submitted At */}
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-default">
                                {formatDistanceToNow(submittedDate, { addSuffix: true })}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              {format(submittedDate, "PPP 'at' p")}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>

                        {/* Action: Quick View */}
                        <TableCell className="text-right pr-5">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectResponse(item);
                                }}
                                disabled={loadingResponseId === item.id}
                                className="size-8 text-muted-foreground hover:text-foreground hover:bg-muted/70 rounded-lg transition-colors"
                              >
                                {loadingResponseId === item.id ? (
                                  <Loader2 className="size-4 animate-spin text-primary" />
                                ) : (
                                  <Eye className="size-4" />
                                )}
                                <span className="sr-only">View response</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View response</TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Modals & Dialogs                                                   */}
        {/* ------------------------------------------------------------------ */}
        <CreateFormDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
        />

        <BuildWithGrizzyDialog
          open={grizzyDialogOpen}
          onOpenChange={setGrizzyDialogOpen}
        />

        <ResponseDetailDialog
          isOpen={Boolean(selectedResponse)}
          onClose={() => {
            setSelectedResponse(null);
            setLoadingResponseId(null);
          }}
          response={selectedResponse}
          questions={activeQuestions}
          sections={activeFormDetails?.sections}
          isLoading={isFormDetailsLoading && Boolean(selectedResponse)}
        />
      </div>
    </TooltipProvider>
  );
}
