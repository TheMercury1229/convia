"use client";

import * as React from "react";
import Image from "next/image";
import { motion, AnimatePresence, useScroll, useTransform, MotionValue } from "motion/react";
import { cn } from "@/lib/utils";

interface StepItem {
  number: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  imageAlt: string;
}

const STEPS: StepItem[] = [
  {
    number: "01",
    title: "Draft with AI or Visual Builder",
    subtitle: "Idea to schema in seconds",
    description:
      "Tell Grizzy what you're trying to achieve in plain English. Grizzy creates the sections, selects input types, and drafts validation rules. Prefer full control? Customize every detail manually.",
    image: "/grizzy/1.png",
    imageAlt: "Grizzy structuring sections and form layout",
  },
  {
    number: "02",
    title: "Share a Dual-Experience Link",
    subtitle: "Conversational chat or classic form",
    description:
      "Publish with one click and share a single URL. Respondents choose their favorite way to answer: an interactive AI conversation or a clean, focused form.",
    image: "/grizzy/2.png",
    imageAlt: "Grizzy configuring question options and publishing",
  },
  {
    number: "03",
    title: "Collect Clean, Structured Data",
    subtitle: "Zero messy answers, instant export",
    description:
      "Every response—whether typed in chat or filled in standard fields—maps strictly to your validated schema. Track completion rates live and download to Excel anytime.",
    image: "/grizzy/3.png",
    imageAlt: "Grizzy analyzing responses and completion metrics",
  },
];

interface CardProps {
  i: number;
  step: StepItem;
  progress: MotionValue<number>;
  range: [number, number];
  targetScale: number;
  isActive: boolean;
}

function Card({
  i,
  step,
  progress,
  range,
  targetScale,
  isActive,
}: CardProps) {
  const cardContainer = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress: cardScrollProgress } = useScroll({
    target: cardContainer,
    offset: ["start end", "start start"],
  });

  // Smoothly fade in on initial entrance (0 -> 0.35), clamped to 1.0 well before stacking
  const opacity = useTransform(cardScrollProgress, [0, 0.35], [0, 1], {
    clamp: true,
  });
  const scale = useTransform(progress, range, [1, targetScale]);

  return (
    <div
      ref={cardContainer}
      className="h-[65vh] sm:h-[72vh] flex items-center justify-center sticky top-24"
    >
      <motion.div
        style={{
          scale,
          opacity,
          top: `calc(${i * 24}px)`,
        }}
        className={cn(
          "flex min-h-[290px] sm:min-h-[310px] w-full flex-col justify-between rounded-2xl border p-7 sm:p-9 transition-colors duration-200 origin-top",
          "bg-card opacity-100",
          "border-border/80",
          "shadow-[0_12px_32px_-8px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.08),inset_0_0_18px_rgba(0,0,0,0.02)]",
          "dark:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.06),inset_0_0_24px_rgba(0,0,0,0.35)]",
          isActive ? "border-primary/60 shadow-[0_16px_36px_-8px_rgba(0,0,0,0.18)] dark:shadow-[0_16px_36px_-8px_rgba(0,0,0,0.95)]" : "border-border/60"
        )}
      >
        <div>
          <div className="flex items-center justify-between gap-4">
            <span className="font-mono text-xs font-semibold text-primary">
              {step.number}
            </span>
            <span className="font-mono text-xs text-muted-foreground">
              {step.subtitle}
            </span>
          </div>
          <h3 className="mt-4 font-heading text-xl font-medium text-foreground sm:text-2xl">
            {step.title}
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {step.description}
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export function HowItWorks() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = React.useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // Track active step based on scroll progress (bidirectional)
  React.useEffect(() => {
    const unsubscribe = scrollYProgress.on("change", (latest) => {
      if (latest < 0.35) {
        setActiveStep(0);
      } else if (latest < 0.7) {
        setActiveStep(1);
      } else {
        setActiveStep(2);
      }
    });

    const current = scrollYProgress.get();
    if (current < 0.35) setActiveStep(0);
    else if (current < 0.7) setActiveStep(1);
    else setActiveStep(2);

    return unsubscribe;
  }, [scrollYProgress]);

  return (
    <section id="how-it-works" className="border-t border-border/60 py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Section Heading */}
        <div className="max-w-2xl mb-12 sm:mb-16">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Workflow
          </p>
          <h2 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            From idea to responses in 3 simple steps.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Scroll down to see how Grizzy streamlines the entire lifecycle from prompt to verified data.
          </p>
        </div>

        {/* 2-Column Split: Sticky Stacking Cards on Left, Sticky Floating Grizzy on Right */}
        <div
          ref={containerRef}
          className="relative grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16"
        >
          {/* Left Column: Stacking Cards following Olivier Larose's pattern */}
          <div className="relative lg:col-span-7">
            {STEPS.map((step, i) => {
              const targetScale = i === 2 ? 1 : 1 - (STEPS.length - i) * 0.04;
              return (
                <Card
                  key={step.number}
                  i={i}
                  step={step}
                  progress={scrollYProgress}
                  range={[i * 0.33, 1]}
                  targetScale={targetScale}
                  isActive={activeStep === i}
                />
              );
            })}
          </div>

          {/* Right Column: Clean Floating Grizzy (Sticky, No opacity animation, purely reactive) */}
          <div className="sticky top-28 hidden lg:flex lg:col-span-5 items-center justify-center py-6 min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={STEPS[activeStep].image}
                initial={{ scale: 0.94 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.94 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="relative flex items-center justify-center w-full"
              >
                <Image
                  src={STEPS[activeStep].image}
                  alt={STEPS[activeStep].imageAlt}
                  width={380}
                  height={380}
                  className="max-h-[340px] xl:max-h-[400px] w-auto object-contain select-none"
                  priority
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
