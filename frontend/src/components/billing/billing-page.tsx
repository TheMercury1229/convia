"use client";

import * as React from "react";
import Link from "next/link";
import {
  ExternalLink,
  Building2,
  Calendar,
  ArrowRight,
  ArrowUpRight,
} from "lucide-react";
import {
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { UsageLog } from "./usage-log";
import { useOrgBilling } from "@/hooks/use-billing";
import { openCustomerPortal } from "@/lib/api/billing";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const chartConfig = {
  credits: {
    label: "Credits",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function BillingPage() {
  const { data: billing } = useOrgBilling();
  const { data: activeOrg } = authClient.useActiveOrganization();
  const { data: session } = authClient.useSession();

  const [isPortalLoading, setIsPortalLoading] = React.useState(false);

  const currentRole = (activeOrg as any)?.members?.find(
    (m: any) => m.userId === session?.user?.id,
  )?.role;
  const isOwnerOrAdmin = currentRole === "owner" || currentRole === "admin";

  const handleOpenPortal = async () => {
    try {
      setIsPortalLoading(true);
      toast.loading("Opening subscription management portal...", { id: "portal-cta" });
      const portalUrl = await openCustomerPortal();
      window.location.href = portalUrl;
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Unable to open billing portal.", { id: "portal-cta" });
      setIsPortalLoading(false);
    }
  };

  if (!activeOrg) {
    return (
      <div className="w-full max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Billing & Usage
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage your subscription, monitor credit usage, and upgrade your plan.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-muted/10 p-12 text-center space-y-4">
          <Building2 className="size-8 text-muted-foreground" />
          <h3 className="text-base font-semibold">No Organisation Selected</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Select an organisation from the sidebar switcher to view its billing and credit balance.
          </p>
        </div>
      </div>
    );
  }

  const plan = billing?.plan ?? "free";
  const creditsRemaining = billing?.creditsRemaining ?? 0;
  const creditsTotal = billing?.creditsTotal ?? 100;
  const percentage = Math.min(100, Math.max(0, (creditsRemaining / creditsTotal) * 100));
  const isLow = creditsRemaining <= creditsTotal * 0.15 || creditsRemaining < 5;
  const isZero = creditsRemaining <= 0;

  const planDisplay =
    plan === "pro" ? "Pro Plan" : plan === "builder" ? "Builder Plan" : "Free Plan";

  const chartData = [
    {
      name: "credits",
      value: creditsRemaining,
      fill: isZero ? "#ef4444" : isLow ? "#f59e0b" : "var(--primary)",
    },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 pb-12">
      {/* SECTION 1: Subscription & Plan */}
      <div className="space-y-4">
        {/* Section Heading outside the card */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Billing & Usage
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Subscription plan and shared credit pool for {activeOrg.name}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {plan !== "free" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenPortal}
                disabled={isPortalLoading}
                className="gap-1.5 text-xs font-medium cursor-pointer"
              >
                <ExternalLink className="size-3.5" />
                Manage Subscription
              </Button>
            )}

            {plan !== "pro" && isOwnerOrAdmin && (
              <Button asChild size="sm" className="gap-1.5 text-xs font-semibold shadow-xs cursor-pointer">
                <Link href="/billing/plans">
                  <ArrowUpRight className="size-3.5" />
                  Upgrade Plan
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Minimal Plan & Radial Chart Card */}
        <Card className="border-border/70 shadow-xs overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              {/* Left Column: Plan details, price, status */}
              <div className="space-y-4 max-w-lg">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                      {planDisplay}
                    </h2>
                    <Badge
                      variant="outline"
                      className={cn(
                        "font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5",
                        plan === "pro"
                          ? "border-purple-500/40 bg-purple-500/10 text-purple-600 dark:text-purple-400"
                          : plan === "builder"
                            ? "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400"
                            : "border-border text-muted-foreground bg-muted/40",
                      )}
                    >
                      {plan === "free" ? "Free" : "Active"}
                    </Badge>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {plan === "free"
                      ? "100 Grizzy Credits provided every monthly cycle. Upgrade anytime for higher allowances and multi-organisation support."
                      : "Your plan renews automatically each month via Dodo Payments. Credits are shared among active organisation members."}
                  </p>
                </div>

                <div className="flex items-center gap-6 pt-1 text-xs">
                  <div>
                    <span className="text-2xl font-black text-foreground tracking-tight">
                      {plan === "free" ? "$0" : plan === "builder" ? "$12" : "$29"}
                    </span>
                    <span className="text-muted-foreground ml-1">/ month</span>
                  </div>

                  <div className="h-4 w-px bg-border/60" />

                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Calendar className="size-3.5" />
                    {billing?.cycleEnd ? (
                      <span>
                        Resets on{" "}
                        <strong className="text-foreground font-medium">
                          {new Date(billing.cycleEnd).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </strong>
                      </span>
                    ) : (
                      <span>Resets on monthly cycle</span>
                    )}
                  </div>
                </div>

                {plan !== "pro" && isOwnerOrAdmin && (
                  <div className="pt-1">
                    <Link
                      href="/billing/plans"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      Compare plans & unlock more capacity
                      <ArrowRight className="size-3" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Right Column: Radial Chart Usage Gauge */}
              <div className="flex flex-col items-center justify-center md:pr-4">
                <div className="relative flex items-center justify-center">
                  <ChartContainer
                    config={chartConfig}
                    className="aspect-square size-36"
                  >
                    <RadialBarChart
                      data={chartData}
                      startAngle={90}
                      endAngle={-270}
                      innerRadius={50}
                      outerRadius={64}
                      barSize={8}
                    >
                      <PolarAngleAxis
                        type="number"
                        domain={[0, creditsTotal]}
                        angleAxisId={0}
                        tick={false}
                      />
                      <RadialBar
                        background={{ fill: "hsl(var(--muted))" }}
                        dataKey="value"
                        cornerRadius={6}
                      />
                    </RadialBarChart>
                  </ChartContainer>

                  {/* Centered Numbers */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                    <span className="text-2xl font-black tracking-tight tabular-nums text-foreground">
                      {creditsRemaining.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-medium">
                      of {creditsTotal.toLocaleString()} left
                    </span>
                  </div>
                </div>

                <span className="text-[11px] font-medium text-muted-foreground mt-1">
                  {Math.round(percentage)}% credit pool remaining
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 2: Credit Usage History (Heading is outside the card in UsageLog) */}
      <UsageLog />
    </div>
  );
}
