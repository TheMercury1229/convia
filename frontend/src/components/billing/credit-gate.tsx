"use client";

import * as React from "react";
import Link from "next/link";
import { Zap, ArrowUpRight, ArrowRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useOrgBilling } from "@/hooks/use-billing";
import { cn } from "@/lib/utils";

interface CreditGateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  requiredCredits?: number;
  actionName?: string;
}

/**
 * Modal dialog that appears when an action fails due to 402 Insufficient Credits.
 */
export function CreditGateModal({
  open,
  onOpenChange,
  requiredCredits,
  actionName = "this AI feature",
}: CreditGateProps) {
  const { data: billing } = useOrgBilling();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center sm:text-center space-y-3">
          <div className="mx-auto size-12 rounded-full bg-amber-500/15 text-amber-500 flex items-center justify-center">
            <Zap className="size-6 fill-current" />
          </div>
          <DialogTitle className="text-xl font-bold">
            Insufficient Grizzy Credits
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Your organisation has run out of credits to use {actionName}.
            {requiredCredits ? ` This action requires ${requiredCredits} credits.` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-xl bg-muted/40 p-4 border border-border/50 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Current balance:</span>
            <span className="font-semibold tabular-nums text-foreground">
              {billing?.creditsRemaining ?? 0} / {billing?.creditsTotal ?? 100} credits
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Plan:</span>
            <span className="font-semibold uppercase tracking-wider text-[11px] text-foreground">
              {billing?.plan ?? "free"}
            </span>
          </div>
          {billing?.cycleEnd && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Next reset:</span>
              <span className="text-muted-foreground">
                {new Date(billing.cycleEnd).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2 pt-2">
          <Button asChild className="w-full gap-2 font-semibold">
            <Link href="/billing/plans" onClick={() => onOpenChange(false)}>
              <ArrowUpRight className="size-4" />
              Upgrade Plan For More Credits
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="w-full text-xs text-muted-foreground"
          >
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface CreditGateInlineProps {
  actionName?: string;
  requiredCredits?: number;
  className?: string;
  onClose?: () => void;
}

/**
 * Inline banner suitable for embedding directly inside chat messages or error panels.
 */
export function CreditGateInline({
  actionName = "this AI feature",
  requiredCredits,
  className,
}: CreditGateInlineProps) {
  const { data: billing } = useOrgBilling();

  return (
    <div
      className={cn(
        "rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 space-y-3 text-left",
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <div className="size-6 rounded-md bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
          <Zap className="size-3.5 fill-current" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-semibold text-foreground">
            Insufficient Grizzy Credits
          </h4>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Your organisation has {billing?.creditsRemaining ?? 0} credits remaining.
            {requiredCredits ? ` This action requires ${requiredCredits} credits.` : ""}{" "}
            Upgrade your plan to continue using {actionName}.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Button asChild size="sm" className="h-7 text-xs font-semibold gap-1.5 shadow-xs">
          <Link href="/billing/plans">
            Upgrade Plan
            <ArrowRight className="size-3" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm" className="h-7 text-xs">
          <Link href="/billing">View Billing</Link>
        </Button>
      </div>
    </div>
  );
}
