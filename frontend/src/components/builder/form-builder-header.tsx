"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Eye,
  Loader2,
  Pencil,
  Settings2,
  Share2,
  Sparkles,
  Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ShareDialog } from "./share-dialog";
import { useBuilderStore } from "@/store/builder-store";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormBuilderHeaderProps {
  /** Back-navigation href. Defaults to /my-forms. */
  backHref?: string;
  /** Real form title from the API. Falls back to "Untitled Form". */
  title?: string;
  /** Autosave indicator state. Defaults to "saved". */
  saveState?: "saved" | "saving" | "unsaved";
}

// ---------------------------------------------------------------------------
// Inline-editable title
// ---------------------------------------------------------------------------

function EditableTitle({ initialTitle = "Untitled Form" }: { initialTitle?: string }) {
  // The store is the single source of truth for the form title.
  // Local state is used only while the input is open (the in-progress draft).
  const { form, updateForm } = useBuilderStore();
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(form.title);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const startEditing = () => {
    setDraft(form.title);
    setEditing(true);
  };

  const commit = () => {
    const trimmed = draft.trim();
    updateForm({ title: trimmed || "Untitled Form" });
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") commit();
    if (e.key === "Escape") {
      setEditing(false);
    }
  };

  React.useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  // One-way bridge: sync an API-provided title into the store on mount / prop change.
  // The store is authoritative afterwards — no need to mirror into local state.
  React.useEffect(() => {
    if (initialTitle && !editing) {
      updateForm({ title: initialTitle });
    }
  }, [initialTitle]); // eslint-disable-line react-hooks/exhaustive-deps

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className={cn(
          "font-heading text-base font-semibold tracking-tight text-foreground",
          "min-w-0 max-w-56 border-none bg-transparent outline-none",
          "border-b border-primary/60 pb-px focus:border-primary",
        )}
        style={{ width: `${Math.max(draft.length, 8)}ch` }}
        aria-label="Form title"
        id="form-title-input"
      />
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={startEditing}
          className={cn(
            "group/title inline-flex items-center gap-1.5 rounded-md px-1 py-0.5",
            "font-heading text-base font-semibold tracking-tight text-foreground",
            "transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            "max-w-56 truncate",
          )}
          id="form-title-display"
          aria-label="Click to edit form title"
        >
          <span className="truncate">{form.title}</span>
          <Pencil
            className="size-3 shrink-0 opacity-0 transition-opacity group-hover/title:opacity-40"
            aria-hidden="true"
          />
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom">Click to rename</TooltipContent>
    </Tooltip>
  );
}

// --------------------------------------------------------
// Autosave indicator
// --------------------------------------------------------

type SaveState = "saved" | "saving" | "unsaved";

function SaveIndicator({ state }: { state: SaveState }) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-xs text-muted-foreground",
        state === "unsaved" && "text-amber-500 dark:text-amber-400",
      )}
      aria-live="polite"
    >
      {state === "saving" ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Check className="size-3.5" />
      )}
      <span className="hidden sm:inline">
        {state === "saving" ? "Saving…" : state === "unsaved" ? "Unsaved" : "Saved"}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main header export
// ---------------------------------------------------------------------------

export function FormBuilderHeader({
  backHref = "/my-forms",
  title,
  saveState = "saved",
}: FormBuilderHeaderProps) {
  const [shareOpen, setShareOpen] = React.useState(false);
  const { rightPanelTab, setRightPanelTab } = useBuilderStore();

  return (
    <header
      className={cn(
        "relative z-50 flex h-13 shrink-0 items-center gap-2 border-b border-border/60 px-3",
        "bg-background/90 backdrop-blur-md",
        // subtle shimmer strip along the bottom edge
        "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px",
        "after:bg-gradient-to-r after:from-transparent after:via-primary/20 after:to-transparent",
      )}
    >
      {/* ------------------------------------------------------------------ */}
      {/* LEFT — back + title + autosave                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5">
        {/* Back button */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              asChild
              variant="ghost"
              size="icon-sm"
              className="shrink-0 text-muted-foreground hover:text-foreground"
              id="builder-back-btn"
              aria-label="Back to forms"
            >
              <Link href={backHref}>
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Back to My Forms</TooltipContent>
        </Tooltip>

        {/* Divider */}
        <div
          className="h-4 w-px shrink-0 bg-border/70"
          role="separator"
          aria-hidden="true"
        />

        {/* Editable title */}
        <EditableTitle initialTitle={title} />

        {/* Autosave indicator */}
        <SaveIndicator state={saveState} />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* RIGHT — action buttons                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-1">
        {/* AI */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              id="builder-ai-btn"
              className="gap-1.5 text-muted-foreground hover:text-foreground"
              aria-label="AI assistant"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline font-medium">AI</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">AI Assistant</TooltipContent>
        </Tooltip>

        {/* Divider */}
        <div
          className="mx-0.5 h-4 w-px shrink-0 bg-border/70"
          role="separator"
          aria-hidden="true"
        />

        {/* Settings */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={rightPanelTab === "settings" ? "secondary" : "ghost"}
              size="icon-sm"
              id="builder-settings-btn"
              className={cn(
                "text-muted-foreground hover:text-foreground transition-colors",
                rightPanelTab === "settings" && "bg-muted text-primary hover:bg-muted"
              )}
              aria-label="Form settings"
              onClick={() => setRightPanelTab(rightPanelTab === "settings" ? "properties" : "settings")}
            >
              <Settings2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {rightPanelTab === "settings" ? "Close settings" : "Form settings"}
          </TooltipContent>
        </Tooltip>

        {/* Preview */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              id="builder-preview-btn"
              className="gap-1.5 text-muted-foreground hover:text-foreground"
              aria-label="Preview form"
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Preview</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Preview form</TooltipContent>
        </Tooltip>

        {/* Share */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              id="builder-share-btn"
              className="gap-1.5"
              aria-label="Share form"
              onClick={() => setShareOpen(true)}
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Share</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Share form</TooltipContent>
        </Tooltip>

        {/* Publish — primary CTA */}
        <Button
          size="sm"
          id="builder-publish-btn"
          className="gap-1.5"
          aria-label="Publish form"
        >
          <Globe className="h-3.5 w-3.5" />
          Publish
        </Button>
      </div>

      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} />
    </header>
  );
}
