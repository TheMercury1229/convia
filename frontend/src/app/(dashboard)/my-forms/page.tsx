"use client";

import { useState, useMemo } from "react";
import { Plus, Search, SlidersHorizontal, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormCard } from "@/components/my-forms/form-card";
import { CreateFormDialog } from "@/components/my-forms/create-form-dialog";
import { PageHeading } from "@/components/dashboard/page-heading";
import { useForms } from "@/hooks/use-forms";
import { useAllOrgResponses } from "@/hooks/use-responses";

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------
function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
  return (
    <div className="col-span-3 flex flex-col items-center justify-center py-20 text-center gap-4">
      <div className="rounded-full bg-muted p-5">
        <FileText className="h-8 w-8 text-muted-foreground" />
      </div>
      <div>
        <p className="font-semibold text-base">No forms yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Create your first form to start collecting responses.
        </p>
      </div>
      <Button onClick={onCreateClick} size="sm">
        <Plus className="h-4 w-4 mr-1.5" />
        Create a form
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Create card (first slot in the grid)
// ---------------------------------------------------------------------------
function CreateFormCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group border border-dashed border-border/80 hover:border-primary/50 bg-card/40 hover:bg-primary/5 rounded-2xl p-5 flex flex-col items-center justify-center gap-3.5 transition-all duration-200 min-h-[190px] cursor-pointer text-center"
    >
      <div className="size-11 rounded-xl bg-muted/80 group-hover:bg-primary/10 border border-border/60 group-hover:border-primary/20 flex items-center justify-center transition-all duration-200 group-hover:scale-105">
        <Plus className="size-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <div className="space-y-0.5">
        <p className="text-sm font-semibold text-foreground/80 group-hover:text-primary transition-colors">
          Create a form
        </p>
        <p className="text-xs text-muted-foreground">
          Start from scratch
        </p>
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loader for form cards
// ---------------------------------------------------------------------------
function FormCardSkeleton() {
  return (
    <div className="bg-card border border-border/70 rounded-2xl p-5 flex flex-col justify-between gap-4 min-h-[185px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Skeleton className="size-1.5 rounded-full" />
          <Skeleton className="h-3.5 w-14 rounded" />
        </div>
        <div className="flex items-center gap-1">
          <Skeleton className="size-7 rounded-lg" />
          <Skeleton className="size-7 rounded-lg" />
          <Skeleton className="size-7 rounded-lg" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4 rounded-lg" />
        <Skeleton className="h-3.5 w-full rounded" />
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        <Skeleton className="h-6 w-24 rounded-lg" />
        <Skeleton className="h-3.5 w-16 rounded" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function MyFormsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "published" | "draft" | "closed">("all");

  const { data: forms, isLoading, isError, error } = useForms();
  const { data: responsesData } = useAllOrgResponses();

  const responseCounts = useMemo(() => {
    const map: Record<string, number> = {};
    (responsesData?.responses || []).forEach((r) => {
      map[r.formId] = (map[r.formId] || 0) + 1;
    });
    return map;
  }, [responsesData]);

  // Client-side filtering
  const filtered = useMemo(() => {
    if (!forms) return [];
    let result = forms;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          (f.description ?? "").toLowerCase().includes(q),
      );
    }

    if (filter === "published") {
      result = result.filter(
        (f) => f.isPublished && !(f.deadline && new Date() > new Date(f.deadline))
      );
    }
    if (filter === "draft") {
      result = result.filter((f) => !f.isPublished);
    }
    if (filter === "closed") {
      result = result.filter(
        (f) => f.deadline && new Date() > new Date(f.deadline)
      );
    }

    return result;
  }, [forms, search, filter]);

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                               */}
      {/* ------------------------------------------------------------------ */}
      <PageHeading
        title="My Forms"
        description="All forms belonging to your organisation."
        actions={
          <Button onClick={() => setDialogOpen(true)} id="btn-add-form">
            <Plus className="h-4 w-4 mr-1.5" />
            Add a Form
          </Button>
        }
      />

      {/* ---------------------------------------------------------------- */}
      {/* Search + Filter bar                                               */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            id="search-forms"
            placeholder="Search forms…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <Select
            value={filter}
            onValueChange={(v) => setFilter(v as typeof filter)}
          >
            <SelectTrigger
              id="filter-forms"
              className="w-36"
            >
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All forms</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Grid                                                              */}
      {/* ---------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Error state */}
        {isError && (
          <div className="col-span-3 text-center py-16 text-sm text-destructive">
            {(error as Error)?.message ?? "Failed to load forms."}
          </div>
        )}

        {/* Loading skeletons */}
        {isLoading && (
          <>
            <FormCardSkeleton />
            <FormCardSkeleton />
            <FormCardSkeleton />
            <FormCardSkeleton />
            <FormCardSkeleton />
            <FormCardSkeleton />
          </>
        )}

        {/* Loaded */}
        {!isLoading && !isError && (
          <>
            {/* Case 1: Org has no forms at all → full empty state, no create card */}
            {forms?.length === 0 ? (
              <EmptyState onCreateClick={() => setDialogOpen(true)} />
            ) : (
              <>
                {/* Case 2 & 3: Org has forms → always show the create card first */}
                <CreateFormCard onClick={() => setDialogOpen(true)} />

                {/* Case 2: Search/filter produced no results */}
                {filtered.length === 0 ? (
                  <div className="col-span-2 flex items-center justify-center py-16 text-sm text-muted-foreground">
                    No forms match your search.
                  </div>
                ) : (
                  /* Case 3: Normal — render matching form cards */
                  filtered.map((form) => (
                    <FormCard
                      key={form.id}
                      form={form}
                      responseCount={responseCounts[form.id] ?? 0}
                    />
                  ))
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Create Form Dialog                                                   */}
      {/* ------------------------------------------------------------------ */}
      <CreateFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
