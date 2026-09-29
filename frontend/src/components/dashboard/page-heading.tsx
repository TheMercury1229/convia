import * as React from "react"
import { cn } from "@/lib/utils"

export interface PageHeadingProps {
  title: React.ReactNode
  description?: React.ReactNode
  badge?: React.ReactNode
  actions?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export function PageHeading({
  title,
  description,
  badge,
  actions,
  children,
  className,
}: PageHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 pb-5 sm:pb-6 md:flex-row md:items-center md:justify-between border-b border-border/40",
        className
      )}
    >
      <div className="space-y-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <h1 className="font-heading text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground truncate">
            {title}
          </h1>
          {badge && <div className="inline-flex shrink-0">{badge}</div>}
        </div>
        {description && (
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{description}</p>
        )}
      </div>

      {(actions || children) && (
        <div className="flex flex-wrap items-center gap-2 pt-1 md:pt-0 w-full sm:w-auto">
          {actions}
          {children}
        </div>
      )}
    </div>
  )
}
