"use client";

import * as React from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useForm, usePublicForm } from "@/hooks/use-forms";
import { FormViewer } from "@/components/form-viewer/form-viewer";
import { FormLoadingScreen } from "@/components/form-viewer/form-loading-screen";
import { FormUnavailableState } from "@/components/form-viewer/form-unavailable-state";
import { getFormTheme } from "@/lib/builder-themes";

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

  // 2. Error State (Form not found, closed, expired deadline, unpublished, or network error)
  if (isError || !formData) {
    const errorMessage = error?.message || "Unable to load form.";
    const isDeadlinePassed = errorMessage.toLowerCase().includes("deadline");
    const isLimitReached =
      errorMessage.toLowerCase().includes("limit") ||
      errorMessage.toLowerCase().includes("maximum response");
    const isForbidden =
      errorMessage.toLowerCase().includes("not accepting responses") ||
      errorMessage.toLowerCase().includes("forbidden") ||
      errorMessage.toLowerCase().includes("unpublished");
    const isNetworkOrServerError =
      errorMessage.toLowerCase().includes("network") ||
      errorMessage.toLowerCase().includes("failed to fetch") ||
      errorMessage.toLowerCase().includes("server") ||
      errorMessage.toLowerCase().includes("500");

    const reason = isDeadlinePassed || isLimitReached
      ? "closed"
      : isForbidden
      ? "unpublished"
      : isNetworkOrServerError
      ? "error"
      : "not-found";

    return (
      <FormUnavailableState
        reason={reason}
        errorMessage={errorMessage}
        isPreview={isPreview}
        formId={isPreview ? idOrSlug : undefined}
        theme={formData ? getFormTheme(formData.themeId ?? undefined) : undefined}
        onRetry={() => {
          void activeQuery.refetch();
        }}
      />
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
