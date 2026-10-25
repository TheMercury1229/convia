import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { sendResponse } from "../../utils/api-response";
import { ApiError } from "../../utils/api-error";
import type { AuthenticatedRequest } from "../../types/index";
import * as billingService from "./billing.service";
import { PLAN_CREDITS } from "../../db/schema/billing-schema";

const authReq = (req: Request): AuthenticatedRequest => req as AuthenticatedRequest;

// ---------------------------------------------------------------------------
// GET /api/billing/org
// Returns the current org's plan + credit state (all members)
// ---------------------------------------------------------------------------

export const getOrgBilling = asyncHandler(async (req: Request, res: Response) => {
  const { orgId } = authReq(req);
  if (!orgId) throw ApiError.badRequest("No active organisation");

  const credits = await billingService.getOrgCredits(orgId);

  return sendResponse(res, 200, "Billing info fetched", {
    plan: credits.plan,
    creditsRemaining: credits.creditsRemaining,
    creditsTotal: credits.creditsTotal,
    cycleStart: credits.cycleStart,
    cycleEnd: credits.cycleEnd,
  });
});

// ---------------------------------------------------------------------------
// GET /api/billing/org/transactions?page=1&limit=20
// Returns paginated usage log — owner/admin only (enforced in router)
// ---------------------------------------------------------------------------

export const getOrgTransactions = asyncHandler(async (req: Request, res: Response) => {
  const { orgId } = authReq(req);
  if (!orgId) throw ApiError.badRequest("No active organisation");

  const page = Math.max(1, parseInt(String(req.query.page ?? 1), 10));
  const limit = Math.min(50, Math.max(1, parseInt(String(req.query.limit ?? 20), 10)));

  const result = await billingService.getOrgTransactions(orgId, page, limit);
  return sendResponse(res, 200, "Transactions fetched", result);
});

// ---------------------------------------------------------------------------
// GET /api/billing/plans
// Public — returns plan comparison data (no auth needed)
// ---------------------------------------------------------------------------

export const getPlans = asyncHandler(async (_req: Request, res: Response) => {
  const plans = [
    {
      id: "free",
      name: "Free",
      price: 0,
      creditsPerMonth: PLAN_CREDITS.free,
      maxOrgs: 1,
      features: [
        `${PLAN_CREDITS.free} Grizzy Credits/month`,
        "1 organisation",
        "Unlimited forms",
        "AI-assisted form filling",
        "AI form generation (10 credits each)",
      ],
    },
    {
      id: "builder",
      name: "Builder",
      price: 12,
      creditsPerMonth: PLAN_CREDITS.builder,
      maxOrgs: 5,
      features: [
        `${PLAN_CREDITS.builder} Grizzy Credits/month`,
        "Up to 5 organisations",
        "Unlimited forms",
        "AI-assisted form filling",
        "AI form generation",
        "Grizzy Analytics chat",
        "Export responses",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      price: 29,
      creditsPerMonth: PLAN_CREDITS.pro,
      maxOrgs: null,
      features: [
        `${PLAN_CREDITS.pro} Grizzy Credits/month`,
        "Unlimited organisations",
        "Everything in Builder",
        "Priority support",
      ],
    },
  ];

  return sendResponse(res, 200, "Plans fetched", plans);
});
