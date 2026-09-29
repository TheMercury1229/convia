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
import { useForms } from "@/hooks/use-forms";

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
      className="group border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-5 flex flex-col items-center justify-center gap-3 transition-all duration-200 hover:bg-primary/5 min-h-[140px] cursor-pointer"
    >
      <div className="rounded-full bg-muted group-hover:bg-primary/10 p-3 transition-colors duration-200">
        <Plus className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      <span className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
        Create a form
      </span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loader for form cards
// ---------------------------------------------------------------------------
function FormCardSkeleton() {
  return (
    <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <div className="flex items-center justify-between mt-2">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-3 w-24" />
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
  const [filter, setFilter] = useState<"all" | "published" | "draft">("all");

  const { data: forms, isLoading, isError, error } = useForms();

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

    if (filter === "published") result = result.filter((f) => f.isPublished);
    if (filter === "draft") result = result.filter((f) => !f.isPublished);

    return result;
  }, [forms, search, filter]);

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Header                                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">
              My Forms
            </h1>
            <p className="text-muted-foreground mt-0.5 text-sm">
              All forms belonging to your organisation.
            </p>
          </div>

          <Button onClick={() => setDialogOpen(true)} id="btn-add-form">
            <Plus className="h-4 w-4 mr-1.5" />
            Add a Form
          </Button>
        </div>

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
                    filtered.map((form) => <FormCard key={form.id} form={form} />)
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Create Form Dialog                                                   */}
      {/* ------------------------------------------------------------------ */}
      <CreateFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </>
  );
}
