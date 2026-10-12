"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DottedGlowBackground } from "@/components/ui/dotted-glow-background";

export function LandingCta() {
  return (
    <section className="border-t border-border/60 py-20 sm:py-24">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {/* Rectangular Dotted Glow Card */}
        <div className="relative overflow-hidden rounded-xl border border-border/80 bg-card px-6 py-12 text-center sm:px-12 sm:py-16 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.08),inset_0_0_18px_rgba(0,0,0,0.02)] dark:shadow-[0_16px_40px_-12px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.06),inset_0_0_24px_rgba(0,0,0,0.35)]">
          {/* Animated Dotted Glow Canvas Background */}
          <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,white_60%,transparent_95%)]">
            <DottedGlowBackground
              gap={14}
              radius={2}
              color="rgba(100, 116, 139, 0.35)"
              darkColor="rgba(148, 163, 184, 0.3)"
              glowColor="rgba(20, 184, 166, 0.75)"
              darkGlowColor="rgba(45, 212, 191, 0.85)"
              opacity={0.65}
              speedScale={0.8}
            />
          </div>

          {/* Card Content */}
          <div className="relative z-10 mx-auto max-w-2xl">
            {/* Headline */}
            <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-[1.15]">
              Ready to create your first conversational form?
            </h2>

            {/* Subtitle */}
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
              Get started in seconds. No complex setup or credit card required.
            </p>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" asChild className="h-11 px-8 font-medium">
                <Link href="/sign-up">
                  Get started free
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="h-11 px-6 font-medium">
                <a href="#how-it-works">See how it works</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
