import type { ComponentType, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  footer?: ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  footer,
}: EmptyStateProps) {
  return (
    <div className="col-span-full flex flex-col items-center justify-center gap-4 py-20 text-center">
      <div className="rounded-full bg-muted p-5">
        <Icon className="size-8 text-muted-foreground" />
      </div>
      <div>
        <p className="text-base font-semibold">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {actionLabel && (onAction || actionHref) ? (
        <Button asChild={Boolean(actionHref)} onClick={onAction} size="sm">
          {actionHref ? <a href={actionHref}>{actionLabel}</a> : actionLabel}
        </Button>
      ) : null}
      {footer}
    </div>
  );
}
