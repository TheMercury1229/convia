"use client";

import * as React from "react";
import { useAllOrgResponses } from "@/hooks/use-responses";
import { useForms } from "@/hooks/use-forms";
import { AllResponsesView } from "@/components/responses/all-responses-view";
import { Skeleton } from "@/components/ui/skeleton";

export default function AllResponsesPage() {
  const {
    data: orgResponsesData,
    isLoading: responsesLoading,
    refetch: refetchResponses,
  } = useAllOrgResponses();

  const {
    data: forms,
    isLoading: formsLoading,
    refetch: refetchForms,
  } = useForms();

  const handleRefresh = () => {
    refetchResponses();
    refetchForms();
  };

  const isInitialLoading = responsesLoading && !orgResponsesData;

  if (isInitialLoading) {
    return (
      <div className="space-y-7 animate-pulse p-2">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 rounded-lg" />
          <Skeleton className="h-4 w-96 rounded-md" />
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-9.5 w-72 rounded-xl" />
            <Skeleton className="h-9.5 w-44 rounded-xl" />
          </div>
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    );
  }

  const responses = orgResponsesData?.responses || [];
  const metrics = orgResponsesData?.metrics || {
    totalForms: forms?.length || 0,
    totalResponses: 0,
    activeFormsWithResponses: 0,
    averageCompletionRate: 0,
    responsesToday: 0,
  };

  return (
    <AllResponsesView
      responses={responses}
      metrics={metrics}
      forms={forms || []}
      onRefresh={handleRefresh}
      isLoading={responsesLoading || formsLoading}
    />
  );
}
