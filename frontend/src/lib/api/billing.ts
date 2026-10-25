import { api } from "@/lib/api";
import { authClient } from "@/lib/auth-client";

export type Plan = "free" | "builder" | "pro";

export interface OrgBillingInfo {
  plan: Plan;
  creditsRemaining: number;
  creditsTotal: number;
  cycleStart: string;
  cycleEnd: string;
}

export interface CreditTransaction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userImage?: string | null;
  amount: number;
  reason: string;
  createdAt: string;
}

export interface PaginatedTransactions {
  transactions: CreditTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PlanDefinition {
  id: Plan;
  name: string;
  price: number;
  creditsPerMonth: number;
  maxOrgs: number | null;
  features: string[];
}

/**
 * Fetch current organisation's billing info & credit pool.
 * Visible to all members of the active organisation.
 */
export async function getOrgCredits(): Promise<OrgBillingInfo> {
  const res = await api.get<{ success: boolean; data: OrgBillingInfo }>("/billing/org");
  return res.data.data;
}

/**
 * Fetch paginated usage log with member attribution.
 * Visible to owner & admin roles only.
 */
export async function getOrgTransactions(
  page = 1,
  limit = 20,
): Promise<PaginatedTransactions> {
  const res = await api.get<{ success: boolean; data: PaginatedTransactions }>(
    `/billing/org/transactions?page=${page}&limit=${limit}`,
  );
  return res.data.data;
}

/**
 * Public plan comparison list
 */
export async function getPlans(): Promise<PlanDefinition[]> {
  const res = await api.get<{ success: boolean; data: PlanDefinition[] }>("/billing/plans");
  return res.data.data;
}

/**
 * Trigger Dodo Payments hosted checkout for the active organisation.
 * Redirects the user to Dodo's hosted checkout page.
 */
export async function createCheckoutSession(
  slug: "builder" | "pro",
  orgId: string,
): Promise<string> {
  const dodo = (authClient as any).dodopayments;
  const checkoutFn =
    dodo?.checkoutSession ?? dodo?.dodoCheckoutSession ?? dodo?.checkout;

  const res = await checkoutFn({
    slug,
    metadata: {
      org_id: orgId,
    },
  });

  if (res?.error) {
    throw new Error(res.error.message || "Failed to initialize checkout session");
  }

  const url = res?.data?.url ?? res?.url;
  if (!url) {
    throw new Error("No checkout URL returned from payment provider");
  }

  return url;
}

/**
 * Open Dodo Payments customer portal for managing existing subscription.
 */
export async function openCustomerPortal(): Promise<string> {
  const res = await (authClient as any).dodopayments.customer.portal();
  if (res.error) {
    throw new Error(res.error.message || "Failed to open customer portal");
  }
  const url = res.data?.url;
  if (!url) {
    throw new Error("No customer portal URL returned");
  }
  return url;
}
