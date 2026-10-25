import type { Request, Response, NextFunction } from "express";
import type { AuthenticatedRequest } from "../types/index";
import { deductCredits } from "../modules/billing/billing.service";
import type { CreditReason } from "../db/schema/billing-schema";

/**
 * requireCredits(amount, reason)
 *
 * Factory middleware — deducts `amount` credits from the active org's pool
 * and logs the triggering user for owner/admin attribution.
 *
 * Must be used AFTER requireAuth + requireOrgMember (both must be in the chain
 * before this middleware so req.orgId and req.user.id are available).
 *
 * Throws 402 Payment Required if the org has insufficient credits.
 *
 * Usage (router):
 *   router.post("/generate-form", requireAuth, requireOrgMember, requireCredits(10, "ai_generate_form"), ...)
 */
export const requireCredits =
  (amount: number, reason: CreditReason) =>
  async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      // orgId is resolved and attached by requireOrgMember
      // user.id is resolved and attached by requireAuth
      await deductCredits(authReq.orgId!, authReq.user.id, amount, reason);
      next();
    } catch (err) {
      next(err);
    }
  };
