import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PricingCards } from "@/components/billing/pricing-cards";
import { PageHeading } from "@/components/dashboard/page-heading";

export const metadata: Metadata = {
  title: "Subscription Plans | Convia",
  description: "Upgrade your Convia organisation with shared credits, multi-org support, and advanced features.",
};

export default function PlansPage() {
  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 pb-12">
      <div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="gap-1.5 text-xs -ml-2 mb-2 text-muted-foreground hover:text-foreground h-8 cursor-pointer"
        >
          <Link href="/billing">
            <ArrowLeft className="size-3.5" />
            Back to Billing
          </Link>
        </Button>
        <PageHeading
          title="Subscription Plans"
          description="Choose the plan that fits your organisation's workload. Upgrade, downgrade, or cancel anytime."
        />
      </div>

      <PricingCards />
    </div>
  );
}
