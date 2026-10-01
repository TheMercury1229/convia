import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { sendResponse } from "../../utils/api-response";
import { ApiError } from "../../utils/api-error";
import type { AuthenticatedRequest } from "../../types/index";
import * as analyticsService from "./analytics.service";
import type {
  RecordViewInput,
  StartSessionInput,
  UpdateSessionInput,
  CompleteSessionInput,
} from "./analytics.schema";

const authReq = (req: Request): AuthenticatedRequest => req as AuthenticatedRequest;
const param = (req: Request, key: string): string => String(req.params[key]);

// ---------------------------------------------------------------------------
// Ingestion Endpoints (Public — No Auth)
// ---------------------------------------------------------------------------

export const recordView = asyncHandler(async (req: Request, res: Response) => {
  const formId = param(req, "formId");
  const input = req.body as RecordViewInput;
  const result = await analyticsService.recordView(formId, input);
  return sendResponse(res, 200, "View recorded", result);
});

export const startSession = asyncHandler(async (req: Request, res: Response) => {
  const formId = param(req, "formId");
  const input = req.body as StartSessionInput;
  const result = await analyticsService.startSession(formId, input);
  return sendResponse(res, 201, "Session started", result);
});

export const updateSession = asyncHandler(async (req: Request, res: Response) => {
  const formId = param(req, "formId");
  const input = req.body as UpdateSessionInput;
  const result = await analyticsService.updateSession(formId, input);
  return sendResponse(res, 200, "Session progress updated", result);
});

export const completeSession = asyncHandler(async (req: Request, res: Response) => {
  const formId = param(req, "formId");
  const input = req.body as CompleteSessionInput;
  const result = await analyticsService.completeSession(formId, input);
  return sendResponse(res, 200, "Session marked complete", result);
});

// ---------------------------------------------------------------------------
// Analytics Retrieval (Org Authenticated)
// ---------------------------------------------------------------------------

export const getFormAnalytics = asyncHandler(async (req: Request, res: Response) => {
  const { orgId } = authReq(req);
  if (!orgId) throw ApiError.badRequest("No active organisation");

  const formId = param(req, "formId");
  const analytics = await analyticsService.getFormAnalytics(formId, orgId);
  return sendResponse(res, 200, "Form analytics fetched", analytics);
});

export const getOrgFormsOverview = asyncHandler(async (req: Request, res: Response) => {
  const { orgId } = authReq(req);
  if (!orgId) throw ApiError.badRequest("No active organisation");

  const overview = await analyticsService.getOrgFormsAnalyticsOverview(orgId);
  return sendResponse(res, 200, "Organisation forms analytics fetched", overview);
});
