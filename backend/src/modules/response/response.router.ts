import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { requireAuth, requireOrgMember } from "../../middlewares/require-auth";
import { submitResponseSchema } from "./response.schema";
import * as controller from "./response.controller";

const router = Router();

// ---------------------------------------------------------------------------
// Public route — no auth required (respondents submitting via share link)
// ---------------------------------------------------------------------------
router.post("/:formId", validate(submitResponseSchema), controller.submitResponse);

// ---------------------------------------------------------------------------
// Org-member routes — authentication + org membership required
// ---------------------------------------------------------------------------
router.use(requireAuth, requireOrgMember);

router.get("/", controller.getAllOrgResponses);
router.get("/form/:formId", controller.getFormResponses);
router.get("/form/:formId/completion", controller.getCompletionRate);
router.get("/:id", controller.getResponse);
router.delete("/:id", controller.deleteResponse);

export default router;
