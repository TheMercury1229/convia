"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useForm, useForms } from "@/hooks/use-forms";
import { useFormResponses } from "@/hooks/use-responses";
import { ResponsesView } from "@/components/responses/responses-view";
import { Skeleton } from "@/components/ui/skeleton";
import { useBreadcrumbStore } from "@/store/breadcrumb-store";
import { FormUnavailableState } from "@/components/form-viewer/form-unavailable-state";

export default function FormResponsesPage() {
  const params = useParams();
  const rawSlug = String(params?.slug || "");
  const setBreadcrumbTitle = useBreadcrumbStore((s) => s.setBreadcrumbTitle);

  // 1. Check if rawSlug matches any form in the user's organisation
  const { data: allForms, isLoading: formsLoading } = useForms();
  const matchedFormMeta = (allForms || []).find(
    (f) => f.id === rawSlug || f.slug === rawSlug
  );

  const effectiveFormId = matchedFormMeta?.id || rawSlug;

  // 2. Fetch full form details (sections + questions) from backend API
  const {
    data: liveFormData,
    isLoading: formLoading,
    refetch: refetchForm,
  } = useForm(effectiveFormId);

  // 3. Fetch live responses from backend API
  const {
    data: liveResponses,
    isLoading: responsesLoading,
    refetch: refetchResponses,
  } = useFormResponses(effectiveFormId);

  // Sync breadcrumb with clean form title (never show raw UUID)
  React.useEffect(() => {
    const realTitle = liveFormData?.title || matchedFormMeta?.title;
    if (realTitle) {
      setBreadcrumbTitle(rawSlug, realTitle);
    }
  }, [rawSlug, liveFormData?.title, matchedFormMeta?.title, setBreadcrumbTitle]);

  const handleRefresh = () => {
    refetchForm();
    refetchResponses();
  };

  const isInitialLoading = (formLoading || formsLoading) && !liveFormData;

  if (isInitialLoading) {
    return (
      <div className="space-y-6 animate-pulse p-2">
        <div className="space-y-2">
          <Skeleton className="h-6 w-60 rounded" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  // Not found state if the form doesn't exist
  if (!liveFormData) {
    return <FormUnavailableState dashboard />;
  }

  return (
    <ResponsesView
      form={liveFormData}
      responses={liveResponses || []}
      onRefresh={handleRefresh}
      isLoading={responsesLoading}
    />
  );
}
