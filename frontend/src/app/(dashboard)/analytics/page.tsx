"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useOrgFormsAnalytics, useFormAnalytics } from "@/hooks/use-analytics";
import { AnalyticsView } from "@/components/analytics/analytics-view";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useBreadcrumbStore } from "@/store/breadcrumb-store";

function AnalyticsDashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse p-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48 rounded-lg" />
          <Skeleton className="h-4 w-72 rounded-md" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-60 rounded-xl" />
          <Skeleton className="h-9 w-20 rounded-xl" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-28 rounded-2xl" />
      </div>

      <Skeleton className="h-[340px] rounded-2xl" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}

function AnalyticsDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setBreadcrumbTitle = useBreadcrumbStore((s) => s.setBreadcrumbTitle);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Set breadcrumb title
  React.useEffect(() => {
    setBreadcrumbTitle("analytics", "Analytics");
  }, [setBreadcrumbTitle]);

  // 1. Fetch overview list of org forms
  const {
    data: forms,
    isLoading: formsLoading,
    isRefetching: formsRefetching,
    refetch: refetchForms,
  } = useOrgFormsAnalytics();

  const formParam = searchParams.get("form");

  // Determine active form
  const selectedFormId = React.useMemo(() => {
    if (!forms || forms.length === 0) return "";
    if (formParam) {
      const match = forms.find(
        (f) => f.id === formParam || f.slug === formParam,
      );
      if (match) return match.id;
    }
    return forms[0].id;
  }, [forms, formParam]);

  // 2. Fetch granular analytics for selected form
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    isRefetching: analyticsRefetching,
    refetch: refetchAnalytics,
  } = useFormAnalytics(selectedFormId || null);

  const handleSelectForm = (newFormId: string) => {
    const matched = (forms || []).find((f) => f.id === newFormId);
    const slugOrId = matched?.slug || newFormId;
    router.replace(`/analytics?form=${encodeURIComponent(slugOrId)}`, {
      scroll: false,
    });
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchForms(),
        selectedFormId ? refetchAnalytics() : Promise.resolve(),
      ]);
      toast.success("Analytics data refreshed");
    } catch {
      toast.error("Failed to refresh analytics");
    } finally {
      setIsRefreshing(false);
    }
  };

  if (formsLoading && !forms) {
    return <AnalyticsDashboardSkeleton />;
  }

  const isBusy = analyticsLoading || formsRefetching || analyticsRefetching || isRefreshing;

  return (
    <AnalyticsView
      forms={forms || []}
      selectedFormId={selectedFormId}
      onSelectForm={handleSelectForm}
      analyticsData={analyticsData}
      isLoading={isBusy}
      onRefresh={handleRefresh}
    />
  );
}

export default function AnalyticsPage() {
  return (
    <React.Suspense fallback={<AnalyticsDashboardSkeleton />}>
      <AnalyticsDashboardContent />
    </React.Suspense>
  );
}
