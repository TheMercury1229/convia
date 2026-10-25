import { ApiError } from "../../utils/api-error";
import type { Plan, CreditReason } from "../../db/schema/billing-schema";
import * as repo from "./billing.repository";

// ---------------------------------------------------------------------------
// Read current org credit state
// ---------------------------------------------------------------------------

export const getOrgCredits = async (orgId: string) => {
  const credits = await repo.findOrgCredits(orgId);
  if (!credits) throw ApiError.notFound("Billing record not found for this organisation");
  return credits;
};

// ---------------------------------------------------------------------------
// Deduct credits from the org pool, attributing the action to userId
// Throws 402 Payment Required if insufficient credits
// ---------------------------------------------------------------------------

export const deductCredits = async (
  orgId: string,
  userId: string,
  amount: number,
  reason: CreditReason,
): Promise<void> => {
  const success = await repo.deductOrgCredits(orgId, userId, amount, reason);
  if (!success) {
    throw new ApiError(
      402,
      "Insufficient Grizzy Credits. Upgrade your plan to continue.",
    );
  }
};

// ---------------------------------------------------------------------------
// Grant full plan credits — called by webhook on subscription.created / renewed
// ---------------------------------------------------------------------------

export const grantPlanCredits = async (
  orgId: string,
  plan: Plan,
  dodoCustomerId?: string,
  dodoSubscriptionId?: string,
): Promise<void> => {
  await repo.grantPlanCredits(orgId, plan, dodoCustomerId, dodoSubscriptionId);
};

// ---------------------------------------------------------------------------
// Downgrade / change plan — called by webhook on cancellation or plan change
// ---------------------------------------------------------------------------

export const setOrgPlan = async (orgId: string, plan: Plan): Promise<void> => {
  await repo.setOrgPlan(orgId, plan);
};

// ---------------------------------------------------------------------------
// Paginated transaction log (owner/admin dashboard)
// ---------------------------------------------------------------------------

export const getOrgTransactions = async (
  orgId: string,
  page: number,
  limit: number,
) => {
  const { rows, total } = await repo.findOrgTransactions(orgId, page, limit);
  return {
    data: rows,
    total,
    page,
    limit,
    hasNextPage: page * limit < total,
  };
};
