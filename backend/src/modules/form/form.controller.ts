import type { Request, Response } from "express";
import { asyncHandler } from "../../utils/async-handler";
import { sendResponse } from "../../utils/api-response";
import * as formService from "./form.service";
import type { CreateFormInput, UpdateFormInput } from "./form.schema";
import type { SaveBuilderInput } from "./builder.schema";
import { replaceBuilderState } from "./builder.repository";
import { findFormById } from "./form.repository";
import type { AuthenticatedRequest } from "../../types/index";
import { ApiError } from "../../utils/api-error";

/** Safely cast to the authenticated request shape set by requireAuth + requireOrgMember. */
const authReq = (req: Request): AuthenticatedRequest => req as AuthenticatedRequest;

/** Narrow Express v5 params (string | string[]) to a plain string. */
const param = (req: Request, key: string): string => String(req.params[key]);

// GET /forms
export const listForms = asyncHandler(async (req, res) => {
  const { orgId } = authReq(req);
  if (!orgId) throw ApiError.badRequest("No active organisation");
  const forms = await formService.getAllForms(orgId);
  return sendResponse(res, 200, "Forms fetched", forms);
});

// GET /forms/:id
export const getForm = asyncHandler(async (req, res) => {
  const { orgId } = authReq(req);
  if (!orgId) throw ApiError.badRequest("No active organisation");
  const form = await formService.getFormById(param(req, "id"), orgId);
  return sendResponse(res, 200, "Form fetched", form);
});

// GET /forms/public/:slug  (no auth — respondents)
export const getPublicForm = asyncHandler(async (req, res) => {
  const form = await formService.getPublicForm(param(req, "slug"));
  return sendResponse(res, 200, "Form fetched", form);
});

// POST /forms
export const createForm = asyncHandler(async (req: Request, res: Response) => {
  const ar = authReq(req);
  if (!ar.orgId) throw ApiError.badRequest("No active organisation");
  const input = req.body as CreateFormInput;
  const form = await formService.createForm(input, ar.orgId, ar.user?.id);
  return sendResponse(res, 201, "Form created", form);
});

// PATCH /forms/:id
export const updateForm = asyncHandler(async (req: Request, res: Response) => {
  const ar = authReq(req);
  if (!ar.orgId) throw ApiError.badRequest("No active organisation");
  const input = req.body as UpdateFormInput;
  const form = await formService.updateForm(param(req, "id"), input, ar.orgId, ar.user?.id);
  return sendResponse(res, 200, "Form updated", form);
});

// PATCH /forms/:id/publish
export const togglePublish = asyncHandler(async (req, res) => {
  const { orgId } = authReq(req);
  if (!orgId) throw ApiError.badRequest("No active organisation");
  const form = await formService.togglePublish(param(req, "id"), orgId);
  const message = form.isPublished ? "Form published" : "Form unpublished";
  return sendResponse(res, 200, message, form);
});

// POST /forms/:id/duplicate
export const duplicateForm = asyncHandler(async (req, res) => {
  const ar = authReq(req);
  if (!ar.orgId) throw ApiError.badRequest("No active organisation");
  const form = await formService.duplicateForm(param(req, "id"), ar.orgId, ar.user?.id);
  return sendResponse(res, 201, "Form duplicated", form);
});

// DELETE /forms/:id
export const deleteForm = asyncHandler(async (req, res) => {
  const { orgId } = authReq(req);
  if (!orgId) throw ApiError.badRequest("No active organisation");
  await formService.deleteForm(param(req, "id"), orgId);
  return sendResponse(res, 200, "Form deleted");
});

// PATCH /forms/:id/builder — replace sections + questions (autosave)
export const saveBuilder = asyncHandler(async (req: Request, res: Response) => {
  const { orgId } = authReq(req);
  if (!orgId) throw ApiError.badRequest("No active organisation");
  const id = param(req, "id");
  const existing = await findFormById(id);
  if (!existing) throw ApiError.notFound("Form not found");
  if (existing.orgId !== orgId) throw ApiError.forbidden("Access denied");
  const input = req.body as SaveBuilderInput;
  await replaceBuilderState(id, input);
  return sendResponse(res, 200, "Builder saved");
});