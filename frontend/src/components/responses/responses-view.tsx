"use client";

import * as React from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  ExternalLink,
  Pencil,
  RotateCcw,
  Link2,
  FileText,
  Check,
  Inbox,
  Percent,
  Clock,
  Download,
  FileSpreadsheet,
  FileJson,
  BarChart2,
  Loader2,
} from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { exportFormAsCsv, exportFormAsJson } from "@/lib/export-responses";

import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { FormWithSections, ApiQuestion } from "@/lib/api/forms";
import type { FormResponse } from "@/lib/api/responses";
import { getResponseCompletionRate, getResponseDisplayName, isAnswered } from "@/lib/response-utils";
import { ResponseDetailDialog } from "./response-detail-dialog";
import { toast } from "sonner";

interface ResponsesViewProps {
  form: FormWithSections;
  responses: FormResponse[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

type SortColumn = "index" | "respondent" | "completion" | "submittedAt";
type SortDirection = "asc" | "desc";

export function ResponsesView({
  form,
  responses,
  onRefresh,
  isLoading = false,
}: ResponsesViewProps) {
  // Search and filter state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "completed" | "partial">("all");

  // In-table column sort state (shadcn data table pattern)
  const [sortColumn, setSortColumn] = React.useState<SortColumn>("submittedAt");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("desc");

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Selected response for view dialog
  const [selectedResponse, setSelectedResponse] = React.useState<FormResponse | null>(null);
  const [selectedIndex, setSelectedIndex] = React.useState<number | undefined>(undefined);
  const [loadingResponseId, setLoadingResponseId] = React.useState<string | null>(null);
  const [copiedLink, setCopiedLink] = React.useState(false);

  // Flatten answerable questions
  const allQuestions = React.useMemo<ApiQuestion[]>(() => {
    return (form.sections || []).flatMap((s) => s.questions || []).filter((q) => q.type !== "heading");
  }, [form.sections]);

  const totalAnswerable = allQuestions.length;

  // Derived metrics for summary cards
  const stats = React.useMemo(() => {
    const total = responses.length;
    if (total === 0) {
      return {
        totalResponses: 0,
        completedCount: 0,
        partialCount: 0,
        completionRate: 0,
        avgCompletionTime: "0m 0s",
        lastSubmission: "No submissions yet",
      };
    }

    const completedCount = responses.filter(
      (r) => getResponseCompletionRate(r, totalAnswerable) >= 100,
    ).length;
    const partialCount = total - completedCount;
    const completionRate = Math.round((completedCount / total) * 100);

    const sortedByDate = [...responses].sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
    const lastDate = sortedByDate[0]?.submittedAt;
    const lastSubmission = lastDate
      ? formatDistanceToNow(new Date(lastDate), { addSuffix: true })
      : "No submissions yet";

    return {
      totalResponses: total,
      completedCount,
      partialCount,
      completionRate,
      lastDate,
      lastSubmission,
    };
  }, [responses, totalAnswerable]);

  // Handle in-column header sort toggle
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      // Sensible defaults: completion and dates default to desc, names to asc
      setSortDirection(column === "respondent" || column === "index" ? "asc" : "desc");
    }
  };

  // ---------------------------------------------------------------------------
  // Search & Filter Logic with In-Table Sorting
  // ---------------------------------------------------------------------------
  const filteredResponses = React.useMemo(() => {
    return responses
      .filter((r) => {
        const isComp = getResponseCompletionRate(r, totalAnswerable) >= 100;
        if (statusFilter === "completed" && !isComp) return false;
        if (statusFilter === "partial" && isComp) return false;

        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();

        if (r.submittedAt && format(new Date(r.submittedAt), "PPP p").toLowerCase().includes(q)) {
          return true;
        }

        const matchesAnswer = (r.answers || []).some((ans) => {
          if (!ans.value) return false;
          const valStr = typeof ans.value === "object" ? JSON.stringify(ans.value) : String(ans.value);
          return valStr.toLowerCase().includes(q);
        });

        return matchesAnswer;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortColumn === "submittedAt") {
          diff = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
        } else if (sortColumn === "completion") {
          diff =
            getResponseCompletionRate(a, totalAnswerable) -
            getResponseCompletionRate(b, totalAnswerable);
        } else if (sortColumn === "respondent") {
          const nameA = a.answers?.find((ans) => ans.value && typeof ans.value === "string")?.value as string || "";
          const nameB = b.answers?.find((ans) => ans.value && typeof ans.value === "string")?.value as string || "";
          diff = nameA.localeCompare(nameB);
        } else if (sortColumn === "index") {
          diff = 0;
        }
        return sortDirection === "asc" ? diff : -diff;
      });
  }, [responses, statusFilter, searchQuery, sortColumn, sortDirection, totalAnswerable]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredResponses.length / pageSize));
  const paginatedResponses = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredResponses.slice(start, start + pageSize);
  }, [filteredResponses, currentPage, pageSize]);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, pageSize, sortColumn, sortDirection]);

  const copyShareLink = () => {
    if (typeof window !== "undefined") {
      const shareUrl = `${window.location.origin}/form/${form.slug || form.id}`;
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      toast.success("Form link copied to clipboard");
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-7 pb-12">
        {/* ------------------------------------------------------------------ */}
        {/* Header: Clean Title and Muted Action Icons with Tooltips           */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex items-center justify-between gap-4 border-b border-border/50 pb-5">
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {form.title}
            </h1>
          </div>

          {/* Muted Icon Actions */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="size-8.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                  <Link href={`/analytics?form=${encodeURIComponent(form.slug || form.id)}`}>
                    <BarChart2 className="size-4" />
                    <span className="sr-only">View analytics</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>View form analytics</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="size-8.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                >
                  <Link href={`/builder/${form.id}?mode=edit`}>
                    <Pencil className="size-4" />
                    <span className="sr-only">Edit form in builder</span>
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit form in builder</TooltipContent>
            </Tooltip>

            {/* Only show live form and copy share link if the form is published */}
            {Boolean(form.isPublished) && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="size-8.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    >
                      <Link
                        href={`/form/${form.slug || form.id}`}
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

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={copyShareLink}
                      className="size-8.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    >
                      {copiedLink ? <Check className="size-4 text-primary" /> : <Link2 className="size-4" />}
                      <span className="sr-only">Copy share link</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{copiedLink ? "Link copied!" : "Copy share link"}</TooltipContent>
                </Tooltip>
              </>
            )}

            {/* Export Dropdown */}
            <DropdownMenu>
              <Tooltip>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                      id="export-responses-btn"
                    >
                      <Download className="size-4" />
                      <span className="sr-only">Export responses</span>
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent>Export responses</TooltipContent>
              </Tooltip>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={() => exportFormAsCsv(form, responses)}
                  className="cursor-pointer gap-2"
                >
                  <FileSpreadsheet className="size-4 text-muted-foreground" />
                  <span>Export as CSV</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => exportFormAsJson(form, responses)}
                  className="cursor-pointer gap-2"
                >
                  <FileJson className="size-4 text-muted-foreground" />
                  <span>Export as JSON</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {onRefresh && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="size-8.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                  >
                    <RotateCcw className={`size-4 ${isLoading ? "animate-spin" : ""}`} />
                    <span className="sr-only">Refresh data</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh data</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Modern Clean Stat Cards (No Clutter, Theme-aligned)               */}
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
                {stats.totalResponses.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.completedCount} complete · {stats.partialCount} partial
              </p>
            </div>
          </div>

          {/* Card 2: Completion Rate */}
          <div className="group rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/40 flex flex-col justify-between gap-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Completion Rate
              </span>
              <Percent className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>

            <div className="space-y-1.5">
              <div className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground font-mono">
                {stats.completionRate}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.completedCount} of {stats.totalResponses || 0} reached 100%
              </p>
            </div>
          </div>

          {/* Card 3: Latest Submission (real activity timestamp) */}
          <div className="group rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:border-primary/40 flex flex-col justify-between gap-5 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Latest Submission
              </span>
              <Clock className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>

            <div className="space-y-1.5">
              <div className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono truncate" title={stats.lastSubmission}>
                {stats.lastSubmission}
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {stats.lastDate
                  ? format(new Date(stats.lastDate), "PPP 'at' p")
                  : "Awaiting first response"}
              </p>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Decluttered Filter Bar: Search + Status Filter Only               */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search by respondent or answer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs sm:text-sm bg-card border-border"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(val: "all" | "completed" | "partial") => setStatusFilter(val)}
          >
            <SelectTrigger className="h-9 text-xs w-[160px] bg-card border-border shrink-0">
              <Filter className="size-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Submissions</SelectItem>
              <SelectItem value="completed">Complete Only</SelectItem>
              <SelectItem value="partial">Partial Only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Responses Table with In-Header Sorting (Shadcn Data Table pattern)  */}
        {/* ------------------------------------------------------------------ */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-border">
                {/* Respondent Column */}
                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => handleSort("respondent")}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors group cursor-pointer select-none"
                  >
                    <span>Respondent / Primary Value</span>
                    {sortColumn === "respondent" ? (
                      sortDirection === "asc" ? (
                        <ArrowUp className="size-3 text-primary" />
                      ) : (
                        <ArrowDown className="size-3 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="size-3 opacity-30 group-hover:opacity-100" />
                    )}
                  </button>
                </TableHead>

                {/* Completion Column */}
                <TableHead className="w-[180px] text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => handleSort("completion")}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors group cursor-pointer select-none"
                  >
                    <span>Completion</span>
                    {sortColumn === "completion" ? (
                      sortDirection === "asc" ? (
                        <ArrowUp className="size-3 text-primary" />
                      ) : (
                        <ArrowDown className="size-3 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="size-3 opacity-30 group-hover:opacity-100" />
                    )}
                  </button>
                </TableHead>

                {/* Submitted At Column */}
                <TableHead className="w-[180px] text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <button
                    type="button"
                    onClick={() => handleSort("submittedAt")}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors group cursor-pointer select-none"
                  >
                    <span>Submitted</span>
                    {sortColumn === "submittedAt" ? (
                      sortDirection === "asc" ? (
                        <ArrowUp className="size-3 text-primary" />
                      ) : (
                        <ArrowDown className="size-3 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="size-3 opacity-30 group-hover:opacity-100" />
                    )}
                  </button>
                </TableHead>

                {/* Actions */}
                <TableHead className="w-[70px] text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground pr-5">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedResponses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-44 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2">
                      <FileText className="size-8 stroke-[1.5] text-muted-foreground/40" />
                      <p className="text-sm font-medium">No responses found</p>
                      <p className="text-xs text-muted-foreground/80">
                        {searchQuery || statusFilter !== "all"
                          ? "Try adjusting your search query or filter"
                          : "No responses have been submitted to this form yet."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedResponses.map((item, idx) => {
                  const globalIndex = (currentPage - 1) * pageSize + idx;
                  const rate = getResponseCompletionRate(item, totalAnswerable);
                  const isCompleted = rate >= 100;
                  const submittedDate = item.submittedAt
                    ? new Date(item.submittedAt)
                    : new Date();

                  const displayName = getResponseDisplayName(item);
                  const answeredCount = item.answers?.filter(
                    (a) => isAnswered(a.value),
                  ).length ?? 0;

                  return (
                    <TableRow
                      key={item.id}
                      className="hover:bg-muted/30 cursor-pointer transition-colors group border-border/60"
                      onClick={() => {
                        setLoadingResponseId(item.id);
                        setSelectedResponse(item);
                        setSelectedIndex(globalIndex);
                      }}
                    >

                      {/* Respondent / Primary Value */}
                      <TableCell>
                        <span className="font-medium text-foreground text-sm truncate max-w-[280px] sm:max-w-[420px] block">
                          {displayName}
                        </span>
                      </TableCell>

                      {/* Completion Column */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className={`size-1.5 rounded-full shrink-0 ${isCompleted ? "bg-primary" : "bg-muted-foreground/40"
                              }`}
                          />
                          <span className="font-mono text-xs font-semibold text-foreground">
                            {rate}%
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            ({answeredCount}/{allQuestions.length})
                          </span>
                        </div>
                      </TableCell>

                      {/* Submitted At: Clean Single-Line Relative Time with Exact Timestamp on Tooltip */}
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

                      {/* Actions: Muted Icon Button with Tooltip */}
                      <TableCell className="text-right pr-5">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLoadingResponseId(item.id);
                                setSelectedResponse(item);
                                setSelectedIndex(globalIndex);
                              }}
                              disabled={loadingResponseId === item.id}
                              className="size-8 text-muted-foreground hover:text-foreground hover:bg-muted/70 rounded-lg transition-colors"
                            >
                              {loadingResponseId === item.id ? (
                                <Loader2 className="size-4 animate-spin text-primary" />
                              ) : (
                                <Eye className="size-4" />
                              )}
                              <span className="sr-only">View response values</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>View response values</TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* ---------------------------------------------------------------- */}
          {/* Table Footer: Summary & Pagination Controls                      */}
          {/* ---------------------------------------------------------------- */}
          <div className="p-4 border-t border-border bg-muted/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-muted-foreground">
              Showing{" "}
              <strong className="font-semibold text-foreground font-mono">
                {filteredResponses.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
              </strong>{" "}
              to{" "}
              <strong className="font-semibold text-foreground font-mono">
                {Math.min(currentPage * pageSize, filteredResponses.length)}
              </strong>{" "}
              of{" "}
              <strong className="font-semibold text-foreground font-mono">
                {filteredResponses.length}
              </strong>{" "}
              responses
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span>Per page:</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(val) => setPageSize(Number(val))}
                >
                  <SelectTrigger className="h-8 w-[68px] text-xs bg-card border-border">
                    <SelectValue placeholder={pageSize} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage((p) => p - 1);
                      }}
                      className={currentPage <= 1 ? "pointer-events-none opacity-40" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }).map((_, i) => {
                    const p = i + 1;
                    if (totalPages > 5 && Math.abs(p - currentPage) > 2) {
                      if (p === 1 || p === totalPages) {
                        return (
                          <PaginationItem key={p}>
                            <PaginationLink
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                setCurrentPage(p);
                              }}
                              isActive={currentPage === p}
                            >
                              {p}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                      return null;
                    }

                    return (
                      <PaginationItem key={p}>
                        <PaginationLink
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(p);
                          }}
                          isActive={currentPage === p}
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) setCurrentPage((p) => p + 1);
                      }}
                      className={currentPage >= totalPages ? "pointer-events-none opacity-40" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Response Detail Dialog Modal                                       */}
        {/* ------------------------------------------------------------------ */}
        <ResponseDetailDialog
          isOpen={!!selectedResponse}
          onClose={() => {
            setSelectedResponse(null);
            setSelectedIndex(undefined);
            setLoadingResponseId(null);
          }}
          response={selectedResponse}
          questions={allQuestions}
          sections={form.sections}
          responseIndex={selectedIndex}
        />
      </div>
    </TooltipProvider>
  );
}
