"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Eye,
  Loader2,
  Pencil,
  Save,
  Settings,
  Share2,
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
import { BuildWithGrizzyDialog } from "@/components/my-forms/build-with-grizzy-dialog";
import { useBuilderStore } from "@/store/builder-store";
import { useTogglePublish } from "@/hooks/use-forms";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FormBuilderHeaderProps {
  /** Back-navigation href. Defaults to /my-forms. */
  backHref?: string;
  /** Autosave indicator state. Defaults to "saved". */
  saveState?: "saved" | "saving" | "unsaved";
  /** Called when the user clicks Save or triggers Ctrl+S. */
  onSave?: () => void;
  /** Called when an AI generation job starts from within the builder. */
  onStartAiJob?: (jobId: string) => void;
}

// ---------------------------------------------------------------------------
// Inline-editable title
// ---------------------------------------------------------------------------

function EditableTitle() {
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
        "flex items-center gap-1.5 text-xs text-muted-foreground select-none",
        state === "unsaved" && "text-amber-500/90 dark:text-amber-400/90",
      )}
      aria-live="polite"
    >
      {state === "saving" ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : state === "unsaved" ? (
        <span className="size-1.5 rounded-full bg-amber-500" />
      ) : (
        <Check className="size-3.5 text-muted-foreground" />
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
  saveState = "saved",
  onSave,
  onStartAiJob,
}: FormBuilderHeaderProps) {
  const [shareOpen, setShareOpen] = React.useState(false);
  const [grizzyOpen, setGrizzyOpen] = React.useState(false);
  const { rightPanelTab, setRightPanelTab, form, updateForm } = useBuilderStore();
  const togglePublishMutation = useTogglePublish();
  const isPublished = Boolean(form.isPublished);

  const handleTogglePublish = () => {
    if (!form.id) return;
    if (saveState === "unsaved") {
      onSave?.();
    }
    togglePublishMutation.mutate(form.id, {
      onSuccess: (updated) => {
        updateForm({ isPublished: updated.isPublished });
      },
    });
  };

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
        <EditableTitle />

        {/* Autosave indicator */}
        <SaveIndicator state={saveState} />

        {/* Manual save button — accessible and consistent with other icons */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              id="builder-save-btn"
              aria-label="Save changes"
              onClick={onSave}
              disabled={saveState === "saving"}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              {saveState === "saving" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {saveState === "unsaved"
              ? "Save changes"
              : saveState === "saving"
              ? "Saving…"
              : "Save"}
          </TooltipContent>
        </Tooltip>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* RIGHT — action buttons                                               */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-1">
        {/* Divider */}
        <div
          className="mx-0.5 h-4 w-px shrink-0 bg-border/70"
          role="separator"
          aria-hidden="true"
        />

        {/* Build with Grizzy */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              id="builder-grizzy-btn"
              aria-label="Build with Grizzy"
              onClick={() => setGrizzyOpen(true)}
            >
              <span className="text-xs font-medium">Build with Grizzy</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Build with Grizzy</TooltipContent>
        </Tooltip>

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
              <Settings className="h-4 w-4" />
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
              asChild
            >
              <Link
                href={`/form/${form.id}?preview=true`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Eye className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Preview</span>
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Preview live form in new tab</TooltipContent>
        </Tooltip>

        {/* Share (only available when published) */}
        {isPublished && (
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
        )}

        {/* Publish / Unpublish Toggle */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              id="builder-publish-btn"
              variant={isPublished ? "outline" : "default"}
              className="gap-1.5 font-medium transition-colors"
              aria-label={isPublished ? "Unpublish form" : "Publish form"}
              disabled={saveState === "saving" || togglePublishMutation.isPending}
              onClick={handleTogglePublish}
            >
              {togglePublishMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isPublished ? (
                <span className="size-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
              ) : (
                <Globe className="h-3.5 w-3.5" />
              )}
              <span>
                {togglePublishMutation.isPending
                  ? "Updating…"
                  : isPublished
                  ? "Published"
                  : "Publish"}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            {isPublished ? "Click to unpublish" : "Publish form"}
          </TooltipContent>
        </Tooltip>
      </div>

      <ShareDialog open={shareOpen} onOpenChange={setShareOpen} />
      <BuildWithGrizzyDialog
        open={grizzyOpen}
        onOpenChange={setGrizzyOpen}
        onJobStarted={onStartAiJob}
      />
    </header>
  );
}
