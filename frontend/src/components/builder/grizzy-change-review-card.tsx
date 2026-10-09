"use client";

import * as React from "react";
import { Check, Undo2, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { FormChangeItem } from "@/store/grizzy-chat-store";

interface GrizzyChangeReviewCardProps {
  messageId: string;
  changeItems?: FormChangeItem[];
  appliedChanges?: string[];
  status?: "pending" | "accepted" | "rejected";
  isLoading?: boolean;
  onAccept: (id: string) => Promise<void> | void;
  onReject: (id: string) => Promise<void> | void;
}

export function GrizzyChangeReviewCard({
  messageId,
  changeItems,
  appliedChanges,
  status = "pending",
  isLoading = false,
  onAccept,
  onReject,
}: GrizzyChangeReviewCardProps) {
  // Normalize items from structured changeItems or fallback strings
  const items: FormChangeItem[] = React.useMemo(() => {
    if (changeItems && changeItems.length > 0) {
      return changeItems;
    }
    if (appliedChanges && appliedChanges.length > 0) {
      return appliedChanges.map((text) => {
        const lower = text.toLowerCase();
        let type: FormChangeItem["type"] = "update";
        if (lower.startsWith("added")) type = "add";
        else if (lower.startsWith("deleted")) type = "delete";
        else if (lower.includes("constraint") || lower.includes("validation")) type = "validation";

        return { type, label: text };
      });
    }
    return [];
  }, [changeItems, appliedChanges]);

  if (items.length === 0) return null;

  const isAccepted = status === "accepted";
  const isRejected = status === "rejected";
  const isPending = !status || status === "pending";

  return (
    <div
      className={cn(
        "mt-2.5 rounded-md border text-xs overflow-hidden transition-colors",
        isPending && "border-border bg-muted/40",
        isAccepted && "border-emerald-500/30 bg-emerald-500/5",
        isRejected && "border-border/60 bg-muted/20 opacity-75",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-border/50 bg-muted/30">
        <span className="font-medium text-foreground text-[11px] tracking-tight">
          {isAccepted
            ? "Saved changes"
            : isRejected
              ? "Reverted changes"
              : `Proposed changes (${items.length})`}
        </span>
        {isPending && (
          <span className="text-[10px] text-muted-foreground font-mono">
            Pending review
          </span>
        )}
      </div>

      {/* Change list — styled cleanly like git diff items */}
      <div className="divide-y divide-border/30 px-2.5 py-1 max-h-48 overflow-y-auto">
        {items.map((item, idx) => {
          const isAdd = item.type === "add";
          const isDelete = item.type === "delete";

          return (
            <div
              key={idx}
              className={cn(
                "py-1.5 flex items-start gap-2",
                isRejected && "line-through text-muted-foreground/70",
              )}
            >
              {/* Diff marker */}
              <span
                className={cn(
                  "font-mono text-xs font-semibold shrink-0 select-none mt-0.5",
                  isAdd && "text-emerald-600 dark:text-emerald-400",
                  isDelete && "text-rose-600 dark:text-rose-400",
                  !isAdd && !isDelete && "text-muted-foreground",
                )}
              >
                {isAdd ? "+" : isDelete ? "-" : "•"}
              </span>

              {/* Detail content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-medium text-foreground text-xs truncate">
                    {item.label}
                  </span>
                  {item.tag && (
                    <span className="text-[10px] font-mono text-muted-foreground px-1 py-0 rounded bg-background border border-border/60">
                      {item.tag}
                    </span>
                  )}
                </div>
                {item.detail && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug break-words">
                    {item.detail}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer action bar */}
      <div className="px-2.5 py-1.5 border-t border-border/50 bg-background/50 flex items-center justify-between gap-2">
        {isPending && (
          <div className="flex items-center gap-2 w-full">
            <Button
              type="button"
              size="xs"
              disabled={isLoading}
              onClick={() => onAccept(messageId)}
              className="h-6.5 px-2.5 text-xs font-medium cursor-pointer"
            >
              {isLoading ? (
                <Loader2 className="size-3 animate-spin mr-1" />
              ) : (
                <Check className="size-3 mr-1" />
              )}
              Accept
            </Button>
            <Button
              type="button"
              size="xs"
              variant="outline"
              disabled={isLoading}
              onClick={() => onReject(messageId)}
              className="h-6.5 px-2.5 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
            >
              Discard
            </Button>
          </div>
        )}

        {isAccepted && (
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
              <Check className="size-3" /> Saved to form
            </span>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              disabled={isLoading}
              onClick={() => onReject(messageId)}
              className="h-6 px-1.5 text-[11px] text-muted-foreground hover:text-destructive cursor-pointer"
            >
              <Undo2 className="size-3 mr-1" />
              Undo
            </Button>
          </div>
        )}

        {isRejected && (
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-muted-foreground">
              Reverted
            </span>
            <Button
              type="button"
              size="xs"
              variant="ghost"
              disabled={isLoading}
              onClick={() => onAccept(messageId)}
              className="h-6 px-1.5 text-[11px] text-primary hover:text-primary cursor-pointer"
            >
              <RotateCcw className="size-3 mr-1" />
              Re-apply
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
