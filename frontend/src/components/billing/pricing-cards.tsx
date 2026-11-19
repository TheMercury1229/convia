"use client";

import * as React from "react";
import Link from "next/link";
import { Check, Zap, ArrowRight, Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { useOrgBilling, useBillingPlans } from "@/hooks/use-billing";
import { createCheckoutSession, openCustomerPortal, type Plan } from "@/lib/api/billing";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PricingCardsProps {
  className?: string;
  onSuccess?: () => void;
  variant?: "dashboard" | "landing";
}

export function PricingCards({ className, variant = "dashboard" }: PricingCardsProps) {
  const isLanding = variant === "landing";
  const { data: billing } = useOrgBilling();
  const { data: plansData } = useBillingPlans();
  const { data: activeOrg } = authClient.useActiveOrganization();
  const { data: session } = authClient.useSession();

  const [loadingSlug, setLoadingSlug] = React.useState<string | null>(null);
  const [isPortalLoading, setIsPortalLoading] = React.useState(false);

  // Check role: only owner & admin can upgrade billing
  const currentRole = (activeOrg as any)?.members?.find(
    (m: any) => m.userId === session?.user?.id,
  )?.role;
  const isOwnerOrAdmin = currentRole === "owner" || currentRole === "admin";

  const currentPlan: Plan | null =
    isLanding && !session?.user ? null : (billing?.plan ?? (isLanding ? null : "free"));

  // Fallback plans if API hasn't loaded yet
  const plans = plansData ?? [
    {
      id: "free",
      name: "Free",
      price: 0,
      creditsPerMonth: 100,
      maxOrgs: 1,
      features: [
        "100 Grizzy Credits / month",
        "1 organisation",
        "Unlimited forms & submissions",
        "AI-assisted form filling",
        "AI form generation (10 credits each)",
        "Standard analytics",
      ],
    },
    {
      id: "builder",
      name: "Builder",
      price: 12,
      creditsPerMonth: 600,
      maxOrgs: 5,
      features: [
        "600 Grizzy Credits / month",
        "Up to 5 organisations",
        "Unlimited forms & submissions",
        "AI-assisted form filling",
        "AI form generation",
        "Analytics AI chat (0.5 credits/turn)",
        "Builder AI chat (0.5 credits/turn)",
        "Response CSV & Excel export",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      price: 29,
      creditsPerMonth: 2000,
      maxOrgs: null,
      features: [
        "2,000 Grizzy Credits / month",
        "Unlimited organisations",
        "Everything in Builder",
        "Fastest AI priority processing",
        "Dedicated priority support",
      ],
    },
  ];

  const handleCheckout = async (slug: "builder" | "pro") => {
    if (!activeOrg?.id) {
      toast.error("Please select an organisation first");
      return;
    }

    if (!isOwnerOrAdmin) {
      toast.error("Only organisation owners and admins can upgrade plans");
      return;
    }

    try {
      setLoadingSlug(slug);
      toast.loading("Preparing checkout...", { id: "dodo-checkout" });
      const checkoutUrl = await createCheckoutSession(slug, activeOrg.id);
      toast.success("Redirecting to checkout...", { id: "dodo-checkout" });
      window.location.href = checkoutUrl;
    } catch (err: any) {
      console.error("Checkout error:", err);
      toast.error(err.message || "Failed to launch checkout. Please try again.", {
        id: "dodo-checkout",
      });
      setLoadingSlug(null);
    }
  };

  const handleOpenPortal = async () => {
    try {
      setIsPortalLoading(true);
      toast.loading("Opening subscription portal...", { id: "dodo-portal" });
      const portalUrl = await openCustomerPortal();
      window.location.href = portalUrl;
    } catch (err: any) {
      console.error("Customer portal error:", err);
      toast.error(err.message || "Failed to open customer portal.", {
        id: "dodo-portal",
      });
      setIsPortalLoading(false);
    }
  };

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch", className)}>
      {plans.map((plan) => {
        const isCurrent = currentPlan === plan.id;
        const isPro = plan.id === "pro";
        const isLoadingThis = loadingSlug === plan.id;

        return (
          <Card
            key={plan.id}
            className={cn(
              "flex flex-col justify-between transition-all duration-200 border",
              isLanding
                ? isPro
                  ? "border-primary/60 shadow-[0_8px_30px_-8px_rgba(20,184,166,0.15)] dark:shadow-[0_8px_30px_-8px_rgba(45,212,191,0.2)] ring-1 ring-primary/30 bg-card hover:border-primary/80"
                  : "border-border/80 bg-card hover:border-foreground/25 hover:shadow-xs"
                : isPro
                  ? "border-primary/50 shadow-sm ring-1 ring-primary/20"
                  : isCurrent
                    ? "border-foreground/30 bg-muted/15"
                    : "border-border/70 hover:border-border",
            )}
          >
            <div>
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg font-bold text-foreground">
                    {plan.name}
                  </CardTitle>

                  {isCurrent ? (
                    <Badge variant="secondary" className="font-semibold text-xs border">
                      Current Plan
                    </Badge>
                  ) : isPro ? (
                    <Badge variant="outline" className="text-xs font-semibold border-primary/40 text-primary bg-primary/10">
                      Popular
                    </Badge>
                  ) : null}
                </div>

                <CardDescription className="text-xs min-h-[32px] mt-1">
                  {plan.id === "free"
                    ? "For individuals & test projects"
                    : plan.id === "builder"
                      ? "For growing teams & power users"
                      : "For scale, unlimited orgs & high volume"}
                </CardDescription>

                {/* Price */}
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold tracking-tight text-foreground">
                    ${plan.price}
                  </span>
                  <span className="text-xs text-muted-foreground font-normal">
                    / month
                  </span>
                </div>

                {/* Credit highlight */}
                <div className="mt-3 flex items-center gap-2 py-2 px-3 rounded-lg bg-muted/40 border border-border/40 text-xs">
                  <Zap className="size-3.5 text-primary fill-primary/20 shrink-0" />
                  <span className="font-semibold text-foreground">
                    {plan.creditsPerMonth.toLocaleString()} Credits / mo
                  </span>
                </div>
              </CardHeader>

              {/* Feature list */}
              <CardContent className="pt-0 space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Features
                </p>
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-foreground/90">
                      <Check className="size-3.5 text-primary shrink-0 mt-0.5" />
                      <span className="leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </div>

            {/* Bottom action button */}
            <CardFooter className="pt-4 border-t border-border/40 mt-auto flex flex-col gap-1.5">
              {isLanding && !session?.user ? (
                plan.id === "free" ? (
                  <Button
                    variant="outline"
                    asChild
                    className="w-full h-9 text-xs font-semibold cursor-pointer"
                  >
                    <Link href="/sign-up">Get started free</Link>
                  </Button>
                ) : plan.id === "builder" ? (
                  <Button
                    variant="secondary"
                    asChild
                    className="w-full h-9 text-xs font-semibold gap-1.5 cursor-pointer"
                  >
                    <Link href="/sign-up">
                      Get started with Builder
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    asChild
                    className="w-full h-9 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Link href="/sign-up">
                      Get started with Pro
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                )
              ) : isCurrent ? (
                plan.id === "free" ? (
                  <Button variant="outline" disabled className="w-full h-9 text-xs font-medium">
                    Current Plan
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={handleOpenPortal}
                    disabled={isPortalLoading}
                    className="w-full h-9 text-xs font-medium gap-1.5 cursor-pointer"
                  >
                    {isPortalLoading ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <>
                        Manage Subscription
                        <ExternalLink className="size-3" />
                      </>
                    )}
                  </Button>
                )
              ) : plan.id === "free" ? (
                <Button
                  variant="outline"
                  onClick={handleOpenPortal}
                  disabled={isPortalLoading}
                  className="w-full h-9 text-xs font-medium cursor-pointer"
                >
                  Downgrade in Portal
                </Button>
              ) : isLanding && (!activeOrg?.id || !isOwnerOrAdmin) ? (
                <Button
                  variant={isPro ? "default" : "secondary"}
                  asChild
                  className="w-full h-9 text-xs font-semibold gap-1.5 cursor-pointer"
                >
                  <Link href="/billing/plans">
                    Upgrade to {plan.name}
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              ) : (
                <Button
                  variant={isPro ? "default" : "secondary"}
                  onClick={() => handleCheckout(plan.id as "builder" | "pro")}
                  disabled={isLoadingThis || loadingSlug !== null || !isOwnerOrAdmin}
                  className="w-full h-9 text-xs font-semibold gap-1.5 cursor-pointer"
                >
                  {isLoadingThis ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Starting Checkout...
                    </>
                  ) : (
                    <>
                      Upgrade to {plan.name}
                      <ArrowRight className="size-3.5" />
                    </>
                  )}
                </Button>
              )}

              {!isLanding && !isOwnerOrAdmin && !isCurrent && (
                <p className="text-[10px] text-center text-muted-foreground">
                  Only org owners/admins can change subscription
                </p>
              )}
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
