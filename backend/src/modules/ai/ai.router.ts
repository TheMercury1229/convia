import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { requireAuth, requireOrgMember } from "../../middlewares/require-auth";
import { generateFormSchema } from "./ai.schema";
import * as controller from "./ai.controller";

const router = Router();

// All AI routes require an authenticated org member
router.use(requireAuth, requireOrgMember);

// POST /api/ai/generate-form   — kick off async generation, returns jobId
router.post("/generate-form", validate(generateFormSchema), controller.generateForm);

// GET  /api/ai/jobs/:jobId/status — poll job status
router.get("/jobs/:jobId/status", controller.getJobStatus);

export default router;
