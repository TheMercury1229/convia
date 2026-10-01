import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { sendResponse } from "../../utils/api-response";
import * as responseService from "./response.service";
import type { SubmitResponseInput } from "./response.schema";
import type { AuthenticatedRequest } from "../../types/index";
import { ApiError } from "../../utils/api-error";

/** Safely cast to the authenticated request shape. */
const authReq = (req: Request): AuthenticatedRequest => req as AuthenticatedRequest;

/** Narrow Express v5 params to a plain string. */
const param = (req: Request, key: string): string => String(req.params[key]);

// ---------------------------------------------------------------------------
// POST /responses/:formId  — public, no auth required
// ---------------------------------------------------------------------------
export const submitResponse = asyncHandler(async (req: Request, res: Response) => {
  const formId = param(req, "formId");
  const input = req.body as SubmitResponseInput;
  const result = await responseService.submitResponse(formId, input);
  return sendResponse(res, 201, "Response submitted", result);
});

// ---------------------------------------------------------------------------
// GET /responses  — org-member only (all responses across all forms in org)
// ---------------------------------------------------------------------------
export const getAllOrgResponses = asyncHandler(async (req: Request, res: Response) => {
  const { orgId } = authReq(req);
  if (!orgId) throw ApiError.badRequest("No active organisation");
  const data = await responseService.getAllOrgResponses(orgId);
  return sendResponse(res, 200, "All responses fetched", data);
});

// ---------------------------------------------------------------------------
// GET /responses/form/:formId  — org-member only
// ---------------------------------------------------------------------------
export const getFormResponses = asyncHandler(async (req: Request, res: Response) => {
  const { orgId } = authReq(req);
  if (!orgId) throw ApiError.badRequest("No active organisation");
  const formId = param(req, "formId");
  const responses = await responseService.getFormResponses(formId, orgId);
  return sendResponse(res, 200, "Responses fetched", responses);
});

// ---------------------------------------------------------------------------
// GET /responses/:id  — org-member only
// ---------------------------------------------------------------------------
export const getResponse = asyncHandler(async (req: Request, res: Response) => {
  const { orgId } = authReq(req);
  if (!orgId) throw ApiError.badRequest("No active organisation");
  const responseId = param(req, "id");
  const data = await responseService.getResponseById(responseId, orgId);
  return sendResponse(res, 200, "Response fetched", data);
});

// ---------------------------------------------------------------------------
// GET /responses/form/:formId/completion  — org-member only
// ---------------------------------------------------------------------------
export const getCompletionRate = asyncHandler(async (req: Request, res: Response) => {
  const { orgId } = authReq(req);
  if (!orgId) throw ApiError.badRequest("No active organisation");
  const formId = param(req, "formId");
  const stats = await responseService.getFormCompletionRate(formId, orgId);
  return sendResponse(res, 200, "Completion rate fetched", stats);
});

// ---------------------------------------------------------------------------
// DELETE /responses/:id  — org-member only
// ---------------------------------------------------------------------------
export const deleteResponse = asyncHandler(async (req: Request, res: Response) => {
  const { orgId } = authReq(req);
  if (!orgId) throw ApiError.badRequest("No active organisation");
  const responseId = param(req, "id");
  await responseService.deleteResponse(responseId, orgId);
  return sendResponse(res, 200, "Response deleted");
});
