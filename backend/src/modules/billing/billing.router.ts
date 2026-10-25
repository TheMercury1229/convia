import { Router } from "express";
import { requireAuth, requireOrgMember } from "../../middlewares/require-auth";
import * as controller from "./billing.controller";

const router = Router();

// ---------------------------------------------------------------------------
// PUBLIC — no auth required
// ---------------------------------------------------------------------------

// GET /api/billing/plans — plan comparison data
router.get("/plans", controller.getPlans);

// ---------------------------------------------------------------------------
// AUTHENTICATED — all org members
// ---------------------------------------------------------------------------

router.use(requireAuth, requireOrgMember);

// GET /api/billing/org — current plan + credit state
router.get("/org", controller.getOrgBilling);

// ---------------------------------------------------------------------------
// OWNER / ADMIN ONLY — usage log with member attribution
// Role check is done inline: only owner and admin roles can access
// ---------------------------------------------------------------------------

// GET /api/billing/org/transactions — paginated credit usage log
router.get("/org/transactions", async (req, res, next) => {
  const role = (req as any).orgRole as string | undefined;
  if (role !== "owner" && role !== "admin") {
    const { ApiError } = await import("../../utils/api-error");
    return next(ApiError.forbidden("Only owners and admins can view the usage log"));
  }
  return controller.getOrgTransactions(req, res, next);
});

export default router;
