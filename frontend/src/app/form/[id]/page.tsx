"use client";

import * as React from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useForm, usePublicForm } from "@/hooks/use-forms";
import { FormViewer } from "@/components/form-viewer/form-viewer";
import { FormLoadingScreen } from "@/components/form-viewer/form-loading-screen";
import { AlertCircle, Clock, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

function FormPageContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const idOrSlug = params.id;
  const isPreview = searchParams.get("preview") === "true";

  // If preview=true, fetch authenticated form by ID (supports drafts)
  // Else, fetch public form by slug (checks published status + deadline)
  const previewQuery = useForm(isPreview ? idOrSlug : "");
  const publicQuery = usePublicForm(!isPreview ? idOrSlug : "");

  const activeQuery = isPreview ? previewQuery : publicQuery;
  const { data: formData, isLoading, isError, error } = activeQuery;

  // 1. Loading State
  if (isLoading) {
    return <FormLoadingScreen />;
  }

  // 2. Error State (Form not found, closed, expired deadline, unpublished)
  if (isError || !formData) {
    const errorMessage = error?.message || "Unable to load form.";
    const isDeadlinePassed = errorMessage.toLowerCase().includes("deadline");
    const isForbidden =
      errorMessage.toLowerCase().includes("not accepting responses") ||
      errorMessage.toLowerCase().includes("forbidden");

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <div className="w-full max-w-md rounded-3xl border border-border/80 bg-card p-8 shadow-sm">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            {isDeadlinePassed ? (
              <Clock className="size-7" />
            ) : isForbidden ? (
              <Lock className="size-7" />
            ) : (
              <AlertCircle className="size-7" />
            )}
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {isDeadlinePassed
              ? "Form Submission Closed"
              : isForbidden
              ? "Form Not Available"
              : "Form Not Found"}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {isDeadlinePassed
              ? "The deadline for submitting responses to this form has passed."
              : isForbidden
              ? "This form is currently unpublished or not accepting new responses."
              : "We couldn't locate this form. The link may be incorrect or the form has been removed."}
          </p>

          <div className="mt-6 flex justify-center gap-3">
            <Button asChild variant="outline">
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Form Viewer Runner
  return <FormViewer form={formData} isPreview={isPreview} />;
}

export default function FormFillingPage() {
  return (
    <React.Suspense fallback={<FormLoadingScreen />}>
      <FormPageContent />
    </React.Suspense>
  );
}
