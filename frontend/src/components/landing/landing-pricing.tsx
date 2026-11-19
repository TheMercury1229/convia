"use client";

import { PricingCards } from "@/components/billing/pricing-cards";

export function LandingPricing() {
  return (
    <section id="pricing" className="border-t border-border/60 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Heading */}
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Pricing
          </p>
          <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            Choose the plan that fits your organisation. Start for free and upgrade as your response volume and AI needs scale.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mt-12 sm:mt-16 max-w-5xl mx-auto">
          <PricingCards variant="landing" />
        </div>
      </div>
    </section>
  );
}
