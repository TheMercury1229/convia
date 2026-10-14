"use client";

import * as React from "react";
import Image from "next/image";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface FormBuildStage {
  image: string;
  step: number;
  title: string;
  description: string;
}

export const BUILD_STAGES: FormBuildStage[] = [
  {
    image: "/grizzy/1.png",
    step: 1,
    title: "Structuring sections & layout",
    description: "Grizzy is organizing your requirements into a clean, logical flow…",
  },
  {
    image: "/grizzy/2.png",
    step: 2,
    title: "Selecting question types",
    description: "Choosing the right inputs—choice questions, scales, ratings, and text fields…",
  },
  {
    image: "/grizzy/3.png",
    step: 3,
    title: "Crafting clear questions",
    description: "Writing concise questions, helpful placeholders, and validation rules…",
  },
  {
    image: "/grizzy/4.png",
    step: 4,
    title: "Optimizing for responses",
    description: "Refining the form structure and pacing for high completion rates…",
  },
  {
    image: "/grizzy/5.png",
    step: 5,
    title: "Putting on the finishing touches",
    description: "Finalizing your form and preparing the builder canvas…",
  },
];

export const BUILDER_LOADING_STAGES: FormBuildStage[] = [
  {
    image: "/grizzy/1.png",
    step: 1,
    title: "Loading form workspace",
    description: "Grizzy is retrieving your questions, sections, and theme settings…",
  },
  {
    image: "/grizzy/2.png",
    step: 2,
    title: "Preparing builder canvas",
    description: "Setting up question types, layout controls, and interactive tools…",
  },
  {
    image: "/grizzy/5.png",
    step: 3,
    title: "Almost ready",
    description: "Finalizing your form environment and preparing the canvas…",
  },
];

const STAGE_INTERVAL_MS = 2800;

export interface AiGenerationLoaderProps {
  stages?: FormBuildStage[];
  intervalMs?: number;
}

export function AiGenerationLoader({
  stages = BUILD_STAGES,
  intervalMs = STAGE_INTERVAL_MS,
}: AiGenerationLoaderProps = {}) {
  const [currentStageIndex, setCurrentStageIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStageIndex((prev) => (prev + 1) % stages.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [stages.length, intervalMs]);

  const currentStage = stages[currentStageIndex] || stages[0];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-md select-none px-6"
      role="status"
      aria-live="polite"
    >
      {/* Hidden preloader for all 5 mascot images to guarantee instant transitions */}
      <div className="hidden" aria-hidden="true">
        {BUILD_STAGES.map((s) => (
          <Image
            key={s.image}
            src={s.image}
            alt="preloaded mascot"
            width={320}
            height={320}
            priority
          />
        ))}
      </div>

      <div className="flex flex-col items-center max-w-md text-center">
        {/* Mascot Image Showcase with Soft Glow */}
        <div className="relative mb-6 flex size-52 sm:size-60 items-center justify-center">
          <div
            key={currentStage.image}
            className="relative size-full animate-in fade-in zoom-in-95 duration-400"
          >
            <Image
              src={currentStage.image}
              alt={`Grizzy - ${currentStage.title}`}
              fill
              sizes="(max-width: 640px) 208px, 240px"
              priority
              className="object-contain drop-shadow-sm"
            />
          </div>
        </div>

        {/* 5-Step Minimal Progress Indicators */}
        {/* <div className="flex items-center gap-1.5 mb-5" aria-hidden="true">
          {BUILD_STAGES.map((stage, idx) => {
            const isActive = idx === currentStageIndex;
            const isCompleted = idx < currentStageIndex;

            return (
              <div
                key={stage.step}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  isActive
                    ? "w-7 bg-primary"
                    : isCompleted
                      ? "w-3 bg-primary/40"
                      : "w-3 bg-muted",
                )}
              />
            );
          })}
        </div> */}

        {/* Dynamic Step Title & Description */}
        <div className="min-h-16 flex flex-col items-center justify-center">
          <h2
            key={`title-${currentStageIndex}`}
            className="font-heading text-lg sm:text-xl font-bold tracking-tight text-foreground transition-all duration-300 animate-in fade-in slide-in-from-bottom-2"
          >
            {currentStage.title}
          </h2>

          <p
            key={`desc-${currentStageIndex}`}
            className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-xs transition-all duration-300 animate-in fade-in slide-in-from-bottom-1"
          >
            {currentStage.description}
          </p>
        </div>

      </div>
    </div>
  );
}
