"use client";

import * as React from "react";
import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import {
  Inbox,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  ExternalLink,
  RotateCcw,
  Layers,
} from "lucide-react";

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

import type { Form, ApiQuestion } from "@/lib/api/forms";
import type { OrgResponseItem, OrgResponseMetrics } from "@/lib/api/responses";
import { useForm } from "@/hooks/use-forms";
import { ResponseDetailDialog } from "./response-detail-dialog";
import { PageHeading } from "@/components/dashboard/page-heading";

interface AllResponsesViewProps {
  responses: OrgResponseItem[];
  metrics: OrgResponseMetrics;
  forms: Form[];
  onRefresh?: () => void;
  isLoading?: boolean;
}

type SortColumn = "formTitle" | "respondent" | "completion" | "submittedAt";
type SortDirection = "asc" | "desc";

export function AllResponsesView({
  responses,
  metrics,
  forms,
  onRefresh,
  isLoading = false,
}: AllResponsesViewProps) {
  // Search and filter states
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedFormFilter, setSelectedFormFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<"all" | "completed" | "partial">("all");

  // In-table sort state
  const [sortColumn, setSortColumn] = React.useState<SortColumn>("submittedAt");
  const [sortDirection, setSortDirection] = React.useState<SortDirection>("desc");

  // Pagination state
  const [currentPage, setCurrentPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  // Selected response for inspection dialog
  const [selectedResponse, setSelectedResponse] = React.useState<OrgResponseItem | null>(null);

  // Fetch full form metadata (questions & sections) for the selected response's dialog
  const { data: activeFormDetails } = useForm(selectedResponse?.formId || "");

  const activeQuestions = React.useMemo<ApiQuestion[]>(() => {
    if (!activeFormDetails?.sections) return [];
    return activeFormDetails.sections
      .flatMap((s) => s.questions || [])
      .filter((q) => q.type !== "heading");
  }, [activeFormDetails]);

  // Handle column header sorting
  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  // Helper to extract respondent display name
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

  // Filter responses by search, form, and status
  const filteredResponses = React.useMemo(() => {
    return responses.filter((item) => {
      // 1. Form Filter
      if (selectedFormFilter !== "all" && item.formId !== selectedFormFilter) {
        return false;
      }

      // 2. Status Filter
      const isCompleted = (item.completionRate ?? 0) >= 100;
      if (statusFilter === "completed" && !isCompleted) return false;
      if (statusFilter === "partial" && isCompleted) return false;

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesForm = item.formTitle?.toLowerCase().includes(q);
        const matchesDisplayName = getDisplayName(item).toLowerCase();
        const matchesAnswers = (item.answers || []).some(
          (a) =>
            a.fieldName.toLowerCase().includes(q) ||
            String(a.value ?? "").toLowerCase().includes(q)
        );
        return matchesForm || matchesDisplayName.includes(q) || matchesAnswers;
      }

      return true;
    });
  }, [responses, selectedFormFilter, statusFilter, searchQuery]);

  // Sort responses
  const sortedResponses = React.useMemo(() => {
    return [...filteredResponses].sort((a, b) => {
      let comparison = 0;
      if (sortColumn === "formTitle") {
        comparison = (a.formTitle || "").localeCompare(b.formTitle || "");
      } else if (sortColumn === "respondent") {
        comparison = getDisplayName(a).localeCompare(getDisplayName(b));
      } else if (sortColumn === "completion") {
        comparison = (a.completionRate ?? 0) - (b.completionRate ?? 0);
      } else if (sortColumn === "submittedAt") {
        const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
        const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
        comparison = dateA - dateB;
      }
      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [filteredResponses, sortColumn, sortDirection]);

  // Pagination slice
  const totalPages = Math.max(1, Math.ceil(sortedResponses.length / pageSize));
  const paginatedResponses = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedResponses.slice(start, start + pageSize);
  }, [sortedResponses, currentPage, pageSize]);

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedFormFilter, statusFilter, pageSize]);

  const renderSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="size-3.5 opacity-40 group-hover:opacity-75" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="size-3.5 text-foreground" />
    ) : (
      <ArrowDown className="size-3.5 text-foreground" />
    );
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-7 pb-12">
        {/* ------------------------------------------------------------------ */}
        {/* Header: Clean Title and Action Icons with Tooltips                 */}
        {/* ------------------------------------------------------------------ */}
        <PageHeading
          title="All Responses"
          description="Consolidated submissions across all forms in your organisation."
          actions={
            onRefresh && (
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
            )
          }
        />

        {/* ------------------------------------------------------------------ */}
        {/* Table Controls (Search, Form Filter, Status Filter)                */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Left: Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search by respondent, answer, or form..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-card border-border/80 focus-visible:ring-primary/40 h-9.5 text-sm rounded-xl"
            />
          </div>

          {/* Right: Form Selector & Status Filter */}
          <div className="flex items-center gap-2">
            {/* Form Filter */}
            <Select value={selectedFormFilter} onValueChange={setSelectedFormFilter}>
              <SelectTrigger className="w-[160px] sm:w-[200px] h-9.5 text-xs sm:text-sm bg-card border-border/80 rounded-xl">
                <Layers className="size-3.5 mr-1.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="All Forms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Forms ({forms.length})</SelectItem>
                {forms.map((f) => (
                  <SelectItem key={f.id} value={f.id} className="truncate max-w-[220px]">
                    {f.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={statusFilter}
              onValueChange={(val: "all" | "completed" | "partial") => setStatusFilter(val)}
            >
              <SelectTrigger className="w-[140px] sm:w-[150px] h-9.5 text-xs sm:text-sm bg-card border-border/80 rounded-xl">
                <Filter className="size-3.5 mr-1.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Complete Only</SelectItem>
                <SelectItem value="partial">Partial Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* All Responses Data Table                                           */}
        {/* ------------------------------------------------------------------ */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-muted/20">
              <TableRow className="border-border/80 hover:bg-transparent">
                {/* Form Column Header */}
                <TableHead className="w-[200px] sm:w-[240px]">
                  <button
                    type="button"
                    onClick={() => handleSort("formTitle")}
                    className="group flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <span>Form</span>
                    {renderSortIndicator("formTitle")}
                  </button>
                </TableHead>

                {/* Respondent Header */}
                <TableHead>
                  <button
                    type="button"
                    onClick={() => handleSort("respondent")}
                    className="group flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <span>Respondent</span>
                    {renderSortIndicator("respondent")}
                  </button>
                </TableHead>

                {/* Completion Header */}
                <TableHead className="w-[140px]">
                  <button
                    type="button"
                    onClick={() => handleSort("completion")}
                    className="group flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <span>Completion</span>
                    {renderSortIndicator("completion")}
                  </button>
                </TableHead>

                {/* Submitted At Header */}
                <TableHead className="w-[160px]">
                  <button
                    type="button"
                    onClick={() => handleSort("submittedAt")}
                    className="group flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    <span>Submitted At</span>
                    {renderSortIndicator("submittedAt")}
                  </button>
                </TableHead>

                {/* Actions */}
                <TableHead className="w-[90px] text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground pr-5">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedResponses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-44 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground space-y-2">
                      <Inbox className="size-8 stroke-[1.5] text-muted-foreground/40" />
                      <p className="text-sm font-medium">No responses found</p>
                      <p className="text-xs text-muted-foreground/80">
                        {searchQuery || selectedFormFilter !== "all" || statusFilter !== "all"
                          ? "Try adjusting your search query or filter"
                          : "No responses have been submitted to any of your forms yet."}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedResponses.map((item) => {
                  const isCompleted = (item.completionRate ?? 0) >= 100;
                  const submittedDate = item.submittedAt
                    ? new Date(item.submittedAt)
                    : new Date();
                  const displayName = getDisplayName(item);

                  return (
                    <TableRow
                      key={item.id}
                      className="hover:bg-muted/30 cursor-pointer transition-colors group border-border/60"
                      onClick={() => setSelectedResponse(item)}
                    >
                      {/* Form Title Column with quick drill-down link */}
                      <TableCell>
                        <Link
                          href={`/responses/${item.formSlug || item.formId}`}
                          onClick={(e) => e.stopPropagation()}
                          className="font-medium text-foreground text-sm hover:text-primary transition-colors truncate max-w-[200px] sm:max-w-[240px] block"
                          title="View all responses for this form"
                        >
                          {item.formTitle}
                        </Link>
                      </TableCell>

                      {/* Respondent Display Name */}
                      <TableCell>
                        <span className="font-normal text-muted-foreground text-sm truncate max-w-[220px] block">
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
                            {item.completionRate ?? 0}%
                          </span>
                        </div>
                      </TableCell>

                      {/* Submitted At (Single-Line Relative Time with Exact Timestamp Tooltip) */}
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

                      {/* Actions */}
                      <TableCell className="text-right pr-5">
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedResponse(item);
                                }}
                                className="size-8 text-muted-foreground hover:text-foreground hover:bg-muted/70 rounded-lg transition-colors"
                              >
                                <Eye className="size-4" />
                                <span className="sr-only">View response values</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View response values</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                asChild
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-foreground hover:bg-muted/70 rounded-lg transition-colors"
                              >
                                <Link
                                  href={`/responses/${item.formSlug || item.formId}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <ExternalLink className="size-4" />
                                  <span className="sr-only">Go to form responses</span>
                                </Link>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Go to form responses</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* ------------------------------------------------------------------ */}
          {/* Table Footer: Summary & Pagination Controls                        */}
          {/* ------------------------------------------------------------------ */}
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
              submissions
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Rows per page:</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(val) => setPageSize(Number(val))}
                >
                  <SelectTrigger className="h-8 w-16 text-xs bg-background">
                    <SelectValue />
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
        {selectedResponse && (
          <ResponseDetailDialog
            isOpen={!!selectedResponse}
            onClose={() => setSelectedResponse(null)}
            response={selectedResponse}
            questions={activeQuestions}
            sections={activeFormDetails?.sections}
          />
        )}
      </div>
    </TooltipProvider>
  );
}
