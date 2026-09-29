"use client";

import * as React from "react";
import { useDrag } from "react-dnd";
import { GripVertical, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DND_TYPES } from "./dnd-types";
import type { QuestionType } from "@/types/builder";
import { PALETTE_GROUPS, type PaletteEntry } from "@/lib/question-registry";

// --------------------------------------------------------
// Individual draggable palette item
// --------------------------------------------------------

function DraggablePaletteItem({ entry }: { entry: PaletteEntry }) {
  const [{ isDragging }, drag] = useDrag<
    { type: string; questionType: string },
    void,
    { isDragging: boolean }
  >(() => ({
    type: DND_TYPES.PALETTE_COMPONENT,
    item: { type: DND_TYPES.PALETTE_COMPONENT, questionType: entry.type },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }));

  const { Icon } = entry;

  return (
    <div
      ref={drag as unknown as React.Ref<HTMLDivElement>}
      className={cn(
        "group flex cursor-grab items-center gap-2.5 rounded-lg border border-transparent px-3 py-2.5",
        "text-sm text-foreground/80 select-none transition-all",
        "hover:border-border hover:bg-muted hover:text-foreground",
        "active:cursor-grabbing active:border-primary/40 active:bg-primary/5",
        isDragging && "opacity-40 ring-1 ring-primary/30",
      )}
    >
      <Icon className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground transition-colors" />
      <span className="flex-1 font-medium text-sm">{entry.label}</span>
      <GripVertical className="size-3.5 shrink-0 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

// --------------------------------------------------------
// Component Palette panel
// --------------------------------------------------------

export function ComponentPalette({ className }: { className?: string } = {}) {
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isSearchOpen) {
      inputRef.current?.focus();
    }
  }, [isSearchOpen]);

  const query = searchQuery.trim().toLowerCase();

  const filteredGroups = React.useMemo(() => {
    if (!query) return PALETTE_GROUPS;

    return PALETTE_GROUPS.map((group) => ({
      group: group.group,
      items: group.items.filter(
        (item) =>
          item.label.toLowerCase().includes(query) ||
          item.type.toLowerCase().includes(query)
      ),
    })).filter((group) => group.items.length > 0);
  }, [query]);

  return (
    <aside className={cn("flex h-full w-full flex-col bg-background overflow-hidden", className)}>
      {/* Header */}
      <div className="flex h-11 shrink-0 items-center border-b border-border/50 px-3">
        {isSearchOpen ? (
          <div className="flex h-full w-full items-center gap-1.5">
            <Search className="size-3.5 shrink-0 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsSearchOpen(false);
                  setSearchQuery("");
                }
              }}
              placeholder="Search components..."
              className="h-8 w-full min-w-0 bg-transparent text-xs text-foreground placeholder:text-muted-foreground/60 outline-none"
            />
            <button
              type="button"
              onClick={() => {
                setIsSearchOpen(false);
                setSearchQuery("");
              }}
              className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Close search (Esc)"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-between">
            <span className="text-sm font-semibold tracking-wide text-muted-foreground uppercase pl-0.5">
              Components
            </span>
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
              title="Search components"
            >
              <Search className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Groups */}
      <div className="flex-1 overflow-y-auto py-2">
        {filteredGroups.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <Search className="size-6 text-muted-foreground/40 mb-2" />
            <p className="text-xs font-medium text-foreground">No components found</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              No results matching &quot;{searchQuery}&quot;
            </p>
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mt-3 text-xs font-medium text-primary hover:underline cursor-pointer"
            >
              Clear search
            </button>
          </div>
        ) : (
          filteredGroups.map((group) => (
            <div key={group.group} className="mb-1">
              <div className="px-3.5 py-1.5 flex items-center justify-between">
                <span className="text-xs font-semibold tracking-widest text-muted-foreground/60 uppercase">
                  {group.group}
                </span>
                {query && (
                  <span className="text-[10px] text-muted-foreground/50 font-mono">
                    {group.items.length}
                  </span>
                )}
              </div>
              <div className="px-1.5">
                {group.items.map((entry) => (
                  <DraggablePaletteItem key={entry.type} entry={entry} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
