import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { requireAuth, requireOrgMember } from "../../middlewares/require-auth";
import { requireCredits } from "../../middlewares/require-credits";
import { CREDIT_COSTS } from "../../db/schema/billing-schema";
import { generateFormSchema } from "./ai.schema";
import { fillFormTurnSchema } from "./fill-form.schema";
import { analyzeResponsesTurnSchema } from "./analyze-responses.schema";
import { builderChatTurnSchema } from "./builder-chat.schema";
import * as controller from "./ai.controller";
import * as fillFormController from "./fill-form.controller";
import * as analyzeResponsesController from "./analyze-responses.controller";
import * as builderChatController from "./builder-chat.controller";

const router = Router();

// ---------------------------------------------------------------------------
// PUBLIC routes — no auth required (respondents are anonymous)
// Must be registered BEFORE the requireAuth middleware below
// ---------------------------------------------------------------------------

// POST /api/ai/fill-form/turn — one AI conversation turn (SSE stream)
router.post(
  "/fill-form/turn",
  validate(fillFormTurnSchema),
  fillFormController.fillFormTurn,
);

// ---------------------------------------------------------------------------
// AUTHENTICATED routes — org members only
// ---------------------------------------------------------------------------

router.use(requireAuth, requireOrgMember);

// POST /api/ai/generate-form — kick off async generation (costs 10 credits)
router.post(
  "/generate-form",
  requireCredits(CREDIT_COSTS.AI_GENERATE_FORM, "ai_generate_form"),
  validate(generateFormSchema),
  controller.generateForm,
);

// GET  /api/ai/jobs/:jobId/status — poll job status
router.get("/jobs/:jobId/status", controller.getJobStatus);

// POST /api/ai/analyze-responses/turn — one Grizzy analytics Q&A turn (costs 0.5 credits)
router.post(
  "/analyze-responses/turn",
  requireCredits(CREDIT_COSTS.GRIZZY_ANALYTICS, "grizzy_analytics"),
  validate(analyzeResponsesTurnSchema),
  analyzeResponsesController.analyzeResponsesTurn,
);

// POST /api/ai/builder/turn — one Grizzy builder chat turn (costs 0.5 credits)
router.post(
  "/builder/turn",
  requireCredits(CREDIT_COSTS.GRIZZY_BUILDER, "grizzy_builder"),
  validate(builderChatTurnSchema),
  builderChatController.builderChatTurn,
);

export default router;
