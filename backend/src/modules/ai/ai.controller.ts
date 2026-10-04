import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { sendResponse } from "../../utils/api-response";
import { ApiError } from "../../utils/api-error";
import type { AuthenticatedRequest } from "../../types/index";
import * as aiService from "./ai.service";
import type { GenerateFormInput } from "./ai.schema";

const authReq = (req: Request): AuthenticatedRequest =>
  req as AuthenticatedRequest;

const param = (req: Request, key: string): string =>
  String(req.params[key]);

// ---------------------------------------------------------------------------
// POST /api/ai/generate-form
// Enqueues a form generation job and returns jobId immediately.
// ---------------------------------------------------------------------------

export const generateForm = asyncHandler(async (req: Request, res: Response) => {
  const ar = authReq(req);
  if (!ar.orgId) throw ApiError.badRequest("No active organisation");

  const { user_query } = req.body as GenerateFormInput;

  const { jobId } = await aiService.startFormGenerationJob(
    user_query,
    ar.orgId,
    ar.user?.id,
  );

  return sendResponse(res, 202, "Form generation started", { jobId });
});

// ---------------------------------------------------------------------------
// GET /api/ai/jobs/:jobId/status
// Lightweight poll — returns { status, formId? } for the given job.
// ---------------------------------------------------------------------------

export const getJobStatus = asyncHandler(async (req: Request, res: Response) => {
  const ar = authReq(req);
  if (!ar.orgId) throw ApiError.badRequest("No active organisation");

  const result = await aiService.getJobStatus(param(req, "jobId"), ar.orgId);

  return sendResponse(res, 200, "Job status fetched", result);
});
