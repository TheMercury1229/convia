"use client";

import * as React from "react";
import Link from "next/link";
import { Zap, ArrowUpRight, AlertTriangle } from "lucide-react";
import { useOrgBilling } from "@/hooks/use-billing";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CreditBadgeProps {
  variant?: "header" | "sidebar" | "badge";
  className?: string;
}

export function CreditBadge({ variant = "sidebar", className }: CreditBadgeProps) {
  const { data: billing, isLoading } = useOrgBilling();

  if (isLoading) {
    if (variant === "sidebar") {
      return (
        <div className="px-2 py-2 rounded-lg border border-sidebar-border/30 bg-sidebar-accent/10 animate-pulse space-y-1.5 group-data-[collapsible=icon]:hidden">
          <div className="h-3 bg-muted rounded w-16" />
          <div className="h-1 bg-muted rounded w-full" />
        </div>
      );
    }
    return null;
  }

  if (!billing) return null;

  const { creditsRemaining, creditsTotal, plan } = billing;
  const percentage = Math.min(100, Math.max(0, (creditsRemaining / creditsTotal) * 100));
  const isLow = creditsRemaining <= creditsTotal * 0.15 || creditsRemaining < 5;
  const isZero = creditsRemaining <= 0;
  const planLabel = plan === "pro" ? "Pro" : plan === "builder" ? "Builder" : "Free";

  // Sidebar variant: Minimal, sleek row placed right below OrgSwitcher
  if (variant === "sidebar") {
    return (
      <>
        {/* Expanded sidebar view: clean, low-profile, integrated indicator */}
        <div
          className={cn(
            "rounded-lg px-2.5 py-2 border transition-all text-sidebar-foreground",
            "group-data-[collapsible=icon]:hidden",
            isZero
              ? "border-destructive/30 bg-destructive/5"
              : isLow
                ? "border-amber-500/30 bg-amber-500/5"
                : "border-sidebar-border/50 bg-sidebar-accent/20 hover:bg-sidebar-accent/40",
            className,
          )}
        >
          <div className="flex items-center justify-between gap-1 mb-1.5 text-xs">
            <Link
              href="/billing"
              className="flex items-center gap-1.5 font-medium hover:text-primary transition-colors truncate"
            >
              <Zap
                className={cn(
                  "size-3.5 shrink-0",
                  isZero
                    ? "text-destructive"
                    : isLow
                      ? "text-amber-500"
                      : "text-primary fill-primary/30",
                )}
              />
              <span className="truncate">Credits</span>
            </Link>

            <div className="flex items-center gap-1.5 shrink-0 text-xs">
              <span className="font-semibold tabular-nums text-foreground">
                {creditsRemaining.toLocaleString()}
                <span className="text-muted-foreground font-normal text-[11px]">
                  /{creditsTotal.toLocaleString()}
                </span>
              </span>

              {plan !== "pro" ? (
                <Link
                  href="/billing/plans"
                  className="text-[10px] font-semibold text-primary hover:underline flex items-center gap-0.5 ml-1"
                >
                  Upgrade
                  <ArrowUpRight className="size-2.5" />
                </Link>
              ) : (
                <span className="text-[10px] uppercase font-bold text-purple-400 bg-purple-500/10 px-1 rounded">
                  Pro
                </span>
              )}
            </div>
          </div>

          {/* Micro 1.5px sleek progress bar */}
          <div className="w-full h-1 bg-sidebar-border/60 rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-300",
                isZero
                  ? "bg-destructive"
                  : isLow
                    ? "bg-amber-500"
                    : "bg-primary",
              )}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Collapsed sidebar view (icon only): sleek tooltip icon */}
        <div className="hidden group-data-[collapsible=icon]:!flex justify-center my-0.5">
          <TooltipProvider delayDuration={150}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/billing"
                  className="flex size-8 items-center justify-center rounded-md hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
                >
                  <Zap
                    className={cn(
                      "size-4",
                      isZero
                        ? "text-destructive"
                        : isLow
                          ? "text-amber-500"
                          : "text-primary",
                    )}
                  />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                <p className="font-semibold">
                  {creditsRemaining} / {creditsTotal} Credits
                </p>
                <p className="text-[10px] text-muted-foreground capitalize">
                  {planLabel} Plan · Click for billing
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </>
    );
  }

  // Header / inline badge fallback (if ever needed)
  return (
    <Link
      href="/billing"
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-colors",
        isZero
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : isLow
            ? "border-amber-500/30 bg-amber-500/10 text-amber-500"
            : "border-border/60 bg-muted/40 text-foreground hover:bg-muted/70",
        className,
      )}
    >
      <Zap className="size-3 text-primary fill-primary/30" />
      <span className="tabular-nums font-semibold">{creditsRemaining}</span>
      <span className="text-muted-foreground">/{creditsTotal}</span>
    </Link>
  );
}
