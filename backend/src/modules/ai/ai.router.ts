import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { requireAuth, requireOrgMember } from "../../middlewares/require-auth";
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

// POST /api/ai/generate-form   — kick off async generation, returns jobId
router.post("/generate-form", validate(generateFormSchema), controller.generateForm);

// GET  /api/ai/jobs/:jobId/status — poll job status
router.get("/jobs/:jobId/status", controller.getJobStatus);

// POST /api/ai/analyze-responses/turn — one Grizzy analytics Q&A turn (SSE stream)
// Auth required — only org members can query their form's response data
router.post(
  "/analyze-responses/turn",
  validate(analyzeResponsesTurnSchema),
  analyzeResponsesController.analyzeResponsesTurn,
);

// POST /api/ai/builder/turn — one Grizzy form builder conversation turn (SSE stream)
// Auth required — only org members can edit forms
router.post(
  "/builder/turn",
  validate(builderChatTurnSchema),
  builderChatController.builderChatTurn,
);

export default router;
