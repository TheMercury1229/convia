import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getOrgCredits,
  getOrgTransactions,
  getPlans,
  type OrgBillingInfo,
  type PaginatedTransactions,
  type PlanDefinition,
} from "@/lib/api/billing";
import { authClient } from "@/lib/auth-client";

export const BILLING_QUERY_KEYS = {
  orgCredits: (orgId?: string) => ["billing", "org-credits", orgId] as const,
  transactions: (orgId?: string, page = 1, limit = 20) =>
    ["billing", "transactions", orgId, page, limit] as const,
  plans: () => ["billing", "plans"] as const,
};

/**
 * Hook to retrieve the current active organisation's billing plan and credit pool.
 * Automatically enables only when an active organization is selected.
 */
export function useOrgBilling() {
  const { data: activeOrg } = authClient.useActiveOrganization();
  const orgId = activeOrg?.id;

  return useQuery<OrgBillingInfo>({
    queryKey: BILLING_QUERY_KEYS.orgCredits(orgId),
    queryFn: () => getOrgCredits(),
    enabled: Boolean(orgId),
    staleTime: 1000 * 30, // 30 seconds
    refetchOnWindowFocus: true,
  });
}

/**
 * Hook to retrieve the paginated transaction log for owners and admins.
 */
export function useOrgTransactions(page = 1, limit = 20) {
  const { data: activeOrg } = authClient.useActiveOrganization();
  const orgId = activeOrg?.id;

  return useQuery<PaginatedTransactions>({
    queryKey: BILLING_QUERY_KEYS.transactions(orgId, page, limit),
    queryFn: () => getOrgTransactions(page, limit),
    enabled: Boolean(orgId),
    staleTime: 1000 * 15,
  });
}

/**
 * Hook to fetch available pricing plans (public).
 */
export function useBillingPlans() {
  return useQuery<PlanDefinition[]>({
    queryKey: BILLING_QUERY_KEYS.plans(),
    queryFn: () => getPlans(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}

/**
 * Helper hook to invalidate billing cache (e.g. after AI operations or checkout).
 */
export function useInvalidateBilling() {
  const queryClient = useQueryClient();
  const { data: activeOrg } = authClient.useActiveOrganization();
  const orgId = activeOrg?.id;

  return {
    invalidateCredits: () =>
      queryClient.invalidateQueries({
        queryKey: BILLING_QUERY_KEYS.orgCredits(orgId),
      }),
    invalidateTransactions: () =>
      queryClient.invalidateQueries({
        queryKey: ["billing", "transactions", orgId],
      }),
  };
}
