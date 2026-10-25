"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Check, ArrowRight, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useOrgBilling, useInvalidateBilling } from "@/hooks/use-billing";

export default function BillingSuccessPage() {
  const searchParams = useSearchParams();
  const checkoutId = searchParams.get("checkout_id");

  const { data: billing, refetch } = useOrgBilling();
  const { invalidateCredits, invalidateTransactions } = useInvalidateBilling();

  // Invalidate and refetch billing credits on mount so the newly granted credits appear
  React.useEffect(() => {
    invalidateCredits();
    invalidateTransactions();
    const timer = setTimeout(() => {
      refetch();
    }, 2000);
    return () => clearTimeout(timer);
  }, [invalidateCredits, invalidateTransactions, refetch]);

  return (
    <div className="w-full max-w-md mx-auto py-16 px-4">
      <Card className="border-border/70 shadow-sm text-center">
        <CardContent className="pt-8 pb-7 px-6 space-y-5">
          <div className="mx-auto size-11 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Check className="size-5 stroke-[2.5]" />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Subscription Activated
            </h1>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs mx-auto">
              Your payment has been processed successfully. Your new plan and credits are now ready to use.
            </p>
          </div>

          {billing && (
            <div className="py-2.5 px-3 rounded-lg bg-muted/40 border border-border/40 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 font-medium text-foreground capitalize">
                <Zap className="size-3.5 text-primary fill-primary/20" />
                {billing.plan} Plan
              </span>
              <span className="font-semibold tabular-nums text-foreground">
                {billing.creditsRemaining.toLocaleString()} Credits Available
              </span>
            </div>
          )}

          {checkoutId && (
            <p className="text-[10px] font-mono text-muted-foreground/80 truncate">
              ID: {checkoutId}
            </p>
          )}

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
            <Button asChild className="w-full h-9 text-xs font-semibold gap-1.5 cursor-pointer">
              <Link href="/billing">
                View Billing Details
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full h-9 text-xs font-medium cursor-pointer">
              <Link href="/my-forms">
                Go to Forms
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
