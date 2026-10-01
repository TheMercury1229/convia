import { useQuery } from "@tanstack/react-query";
import {
  getFormAnalytics,
  getOrgFormsAnalytics,
  type FormAnalyticsData,
  type OrgFormAnalyticsSummary,
} from "@/lib/api/analytics";
import { authClient } from "@/lib/auth-client";

export const analyticsKeys = {
  all: ["analytics"] as const,
  orgOverview: (orgId?: string) =>
    orgId
      ? ([...analyticsKeys.all, "org", orgId] as const)
      : ([...analyticsKeys.all, "org"] as const),
  form: (formId: string) => [...analyticsKeys.all, "form", formId] as const,
};

/**
 * Fetch high-level analytics summary for all forms in the active organisation.
 */
export function useOrgFormsAnalytics() {
  const { data: activeOrg } = authClient.useActiveOrganization();
  const orgId = activeOrg?.id;

  return useQuery<OrgFormAnalyticsSummary[]>({
    queryKey: analyticsKeys.orgOverview(orgId),
    queryFn: () => getOrgFormsAnalytics(),
    enabled: !!orgId,
  });
}

/**
 * Fetch granular analytics data (views, sessions, funnel, per-question distributions, heatmap) for a form.
 */
export function useFormAnalytics(formId?: string | null) {
  return useQuery<FormAnalyticsData>({
    queryKey: analyticsKeys.form(formId ?? ""),
    queryFn: () => getFormAnalytics(formId!),
    enabled: !!formId,
    staleTime: 30000,
  });
}
