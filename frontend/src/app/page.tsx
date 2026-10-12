import { LandingNavbar } from "@/components/landing/landing-navbar";
import { BentoFeatures } from "@/components/landing/bento-features";
import { HowItWorks } from "@/components/landing/how-it-works";
import { LandingFaq } from "@/components/landing/landing-faq";
import { LandingCta } from "@/components/landing/landing-cta";
import { LandingFooter } from "@/components/landing/landing-footer";
import { HexagonPattern } from "@/components/ui/hexagon-pattern";
import { Hero } from "@/components/landing/hero";

export default function Page() {
  return (
    <div className="relative flex min-h-svh flex-col bg-background text-foreground antialiased selection:bg-primary/15 selection:text-primary">
      {/* First Screen Background: Subtle Hexagon Pattern behind Navbar & Hero */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[1000px] max-h-[115svh] overflow-hidden">
        <HexagonPattern
          radius={44}
          gap={2}
          strokeDasharray="3 3"
          className="stroke-foreground/10 fill-foreground/[0.015] [mask-image:radial-gradient(ellipse_at_top,white_35%,transparent_80%)]"
        />
      </div>

      {/* Navbar */}
      <LandingNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <Hero />

        {/* Platform Bento Grid Features */}
        <BentoFeatures />

        {/* How It Works Stacking Section */}
        <HowItWorks />

        {/* Frequently Asked Questions */}
        <LandingFaq />

        {/* Closing Call to Action Card with Dotted Glow Background */}
        <LandingCta />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
