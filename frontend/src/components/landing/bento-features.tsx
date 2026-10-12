"use client";

import * as React from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { Sparkles, MessagesSquare, CheckCircle2, TrendingUp, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface BentoFeatureItem {
  id: string;
  title: string;
  description: string;
  className: string;
  tag?: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  iconClassName: string;
}

const BENTO_FEATURES: BentoFeatureItem[] = [
  {
    id: "grizzy-builder",
    title: "Describe what you need. Grizzy builds it.",
    description:
      "Skip the tedious drag-and-drop setup. Tell Grizzy your goal in plain words, and get a complete, validated form ready to share in seconds.",
    className: "md:col-span-2 min-h-[220px]",
    icon: Sparkles,
    iconClassName: "size-32 text-foreground/[0.04] dark:text-foreground/[0.04]",
  },
  {
    id: "conversational-filling",
    title: "Feels like a chat, not a chore",
    description:
      "Respondents answer conversationally on mobile or desktop without form fatigue. Convia maps everything into clean structured fields automatically.",
    className: "md:col-span-1 md:row-span-2 min-h-[280px]",
    icon: MessagesSquare,
    iconClassName: "size-36 text-primary/[0.08] dark:text-primary/[0.12]",
  },
  {
    id: "smart-followups",
    title: "No more incomplete answers",
    description:
      "When someone gives a vague reply, Convia asks for clarification on the spot so you never get useless submissions.",
    className: "md:col-span-1 min-h-[220px]",
    icon: CheckCircle2,
    iconClassName: "size-32 text-foreground/[0.04] dark:text-foreground/[0.04]",
  },
  {
    id: "high-conversions",
    title: "3x higher completion rates",
    description:
      "Conversational pacing keeps respondents engaged until the end. Export clean spreadsheets anytime.",
    className: "md:col-span-1 min-h-[220px]",
    icon: TrendingUp,
    iconClassName: "size-32 text-emerald-500/[0.08] dark:text-emerald-500/[0.12]",
  },
  {
    id: "unified-workspace",
    title: "Everything in one place. Powered by Grizzy.",
    description:
      "From AI generation and drag-and-drop editing to conversational distribution and one-click spreadsheet exports—manage your entire form lifecycle in a single workspace.",
    className: "md:col-span-3 min-h-[180px]",
    icon: Layers,
    iconClassName: "size-36 text-foreground/[0.04] dark:text-foreground/[0.04]",
  },
];

interface BentoCardProps {
  feature: BentoFeatureItem;
}

function BentoCard({ feature }: BentoCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Responsive spring physics for subtle 3D card tilt
  const springX = useSpring(x, { stiffness: 280, damping: 28 });
  const springY = useSpring(y, { stiffness: 280, damping: 28 });

  const rotateX = useTransform(springY, [-0.5, 0.5], ["4deg", "-4deg"]);
  const rotateY = useTransform(springX, [-0.5, 0.5], ["-4deg", "4deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / rect.width - 0.5;
    const yPct = mouseY / rect.height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const Icon = feature.icon;

  return (
    <div style={{ perspective: "1000px" }} className={feature.className}>
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className={cn(
          "group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl",
          // Card border and hover state
          "border border-border/80 hover:border-foreground/35",
          // Innershadow and depth styling
          "bg-card p-6 sm:p-8 transition-colors duration-200",
          "shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),inset_0_0_24px_rgba(0,0,0,0.03)]",
          "dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),inset_0_0_30px_rgba(0,0,0,0.45)]",
          "hover:shadow-[0_20px_40px_-14px_rgba(0,0,0,0.12),inset_0_1px_2px_rgba(255,255,255,0.2),inset_0_0_32px_rgba(0,0,0,0.05)]",
          "dark:hover:shadow-[0_20px_40px_-14px_rgba(0,0,0,0.7),inset_0_1px_2px_rgba(255,255,255,0.15),inset_0_0_36px_rgba(0,0,0,0.6)]"
        )}
      >
        {/* Static half-clipped background icon, cleanly anchored to bottom-right */}
        <div
          aria-hidden="true"
          style={{ transform: "translateZ(6px)" }}
          className="pointer-events-none absolute -bottom-6 -right-6 z-0 select-none overflow-hidden"
        >
          <Icon className={feature.iconClassName} strokeWidth={1.25} />
        </div>

        {/* Floating text content with parallax depth */}
        <div
          style={{ transform: "translateZ(18px)" }}
          className="relative z-10 flex h-full flex-col justify-between"
        >
          <div className="max-w-xl">
            <h3 className="font-heading text-xl font-medium text-foreground sm:text-2xl">
              {feature.title}
            </h3>
            <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
              {feature.description}
            </p>
          </div>

          {feature.tag && (
            <div className="mt-8 text-xs font-mono text-muted-foreground/75">
              {feature.tag}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export function BentoFeatures() {
  return (
    <section id="features" className="border-t border-border/60 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Heading */}
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Why Teams Choose Convia
          </p>
          <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            Forms people actually want to fill.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Eliminate tedious questionnaires. Build in seconds with Grizzy, collect responses through natural conversations, and get clean structured data every time.
          </p>
        </div>

        {/* Unified Bento Grid */}
        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
          {BENTO_FEATURES.map((feature) => (
            <BentoCard key={feature.id} feature={feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
