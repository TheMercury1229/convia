"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Clock,
  FileText,
  PenSquare,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { FormTemplate } from "./template-data";

interface TemplateCardProps {
  template: FormTemplate;
}

export function TemplateCard({ template }: TemplateCardProps) {
  const router = useRouter();

  return (
    <TooltipProvider delayDuration={150}>
      <div
        onClick={() => router.push(`/templates/builder/${template.id}`)}
        className="group relative rounded-2xl border border-border/70 bg-card p-5 flex flex-col justify-between gap-4 transition-all duration-200 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5 min-h-[185px] cursor-pointer select-none"
      >
        {/* ------------------------------------------------------------------ */}
        {/* Top Row: Category (Left) + Action Icons (Right)                    */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex items-center justify-between gap-2">
          {/* Category indicator with dot */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary shrink-0" />
            <span className="text-xs font-medium text-foreground/80">
              {template.category}
            </span>
          </div>

          {/* Quick Action Icons: View in Builder & Fill a Preview */}
          <div
            className="flex items-center gap-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            {/* View in builder icon */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
                  aria-label="View in builder"
                >
                  <Link href={`/templates/builder/${template.id}`}>
                    <PenSquare className="size-3.5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">View in builder</TooltipContent>
            </Tooltip>

            {/* Fill a preview icon */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/70 transition-colors cursor-pointer"
                  aria-label="Fill a preview"
                >
                  <Link href={`/templates/preview/${template.id}`}>
                    <ExternalLink className="size-3.5" />
                  </Link>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">Fill a preview</TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Middle: Title & Description                                        */}
        {/* ------------------------------------------------------------------ */}
        <div className="space-y-1.5 min-w-0">
          <h3 className="font-heading text-base font-bold text-foreground leading-snug tracking-tight group-hover:text-primary transition-colors line-clamp-1">
            {template.title}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {template.description}
          </p>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Bottom Metadata & Stats Bar                                        */}
        {/* ------------------------------------------------------------------ */}
        <div className="border-t border-border/50 pt-3 flex items-center justify-between text-xs text-muted-foreground">
          {/* Question Count Pill */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/40 font-medium text-xs text-muted-foreground">
            <FileText className="size-3.5" />
            <span>{template.questionCount} questions</span>
          </div>

          {/* Estimated Completion Time */}
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="size-3 text-muted-foreground/70" />
            <span>~{template.estimatedMinutes} mins</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
