"use client";

import Link from "next/link";
import { AlertCircle, Clock, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

type FormUnavailableReason = "not-found" | "closed" | "unpublished";

interface FormUnavailableStateProps {
  reason?: FormUnavailableReason;
  dashboard?: boolean;
}

const content: Record<
  FormUnavailableReason,
  { title: string; description: string; icon: typeof AlertCircle }
> = {
  "not-found": {
    title: "Form Not Found",
    description:
      "We couldn't locate this form. The link may be incorrect or the form has been removed.",
    icon: AlertCircle,
  },
  closed: {
    title: "Form Submission Closed",
    description: "The deadline for submitting responses to this form has passed.",
    icon: Clock,
  },
  unpublished: {
    title: "Form Not Available",
    description: "This form is currently unpublished or not accepting new responses.",
    icon: Lock,
  },
};

export function FormUnavailableState({
  reason = "not-found",
  dashboard = false,
}: FormUnavailableStateProps) {
  const state = content[reason];
  const Icon = state.icon;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xs sm:p-8">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
          <Icon className="size-6" />
        </div>
        <h1 className="font-heading text-xl font-bold tracking-tight text-foreground sm:text-2xl">
          {state.title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {state.description}
        </p>
        <div className="mt-6 flex justify-center">
          <Button asChild variant="outline" size="sm">
            <Link href={dashboard ? "/my-forms" : "/"}>
              {dashboard ? "Back to My Forms" : "Back to Home"}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
