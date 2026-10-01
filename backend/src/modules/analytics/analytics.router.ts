import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { requireAuth, requireOrgMember } from "../../middlewares/require-auth";
import {
  recordViewSchema,
  startSessionSchema,
  updateSessionSchema,
  completeSessionSchema,
} from "./analytics.schema";
import * as controller from "./analytics.controller";

const router = Router();

// ---------------------------------------------------------------------------
// Public Tracking Endpoints (Anonymous form respondents)
// ---------------------------------------------------------------------------
router.post("/:formId/view", validate(recordViewSchema), controller.recordView);
router.post("/:formId/session", validate(startSessionSchema), controller.startSession);
router.patch("/:formId/session", validate(updateSessionSchema), controller.updateSession);
router.post("/:formId/session/progress", validate(updateSessionSchema), controller.updateSession);
router.post("/:formId/complete", validate(completeSessionSchema), controller.completeSession);

// ---------------------------------------------------------------------------
// Authenticated Organisation Routes
// ---------------------------------------------------------------------------
router.use(requireAuth, requireOrgMember);

router.get("/", controller.getOrgFormsOverview);
router.get("/:formId", controller.getFormAnalytics);

export default router;
