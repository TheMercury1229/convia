import { api } from "@/lib/api";

export interface AnswerItemInput {
  questionId: string;
  fieldName?: string;
  value: unknown;
}

export interface SubmitResponsePayload {
  answers: AnswerItemInput[] | Record<string, unknown>;
  sessionId?: string;
}

export interface AnswerRecord {
  id: string;
  responseId: string;
  questionId: string;
  fieldName: string;
  value: unknown;
  createdAt: string;
}

export interface FormResponse {
  id: string;
  formId: string;
  submittedAt: string;
  answers: AnswerRecord[];
  completionRate?: number;
}

export interface FormCompletionStats {
  totalResponses: number;
  completedResponses: number;
  completionRate: number;
  averageCompletionRate: number;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

// ---------------------------------------------------------------------------
// Response API methods
// ---------------------------------------------------------------------------

/** POST /responses/:formId – submit response (public, no auth) */
export async function submitResponse(
  formId: string,
  payload: SubmitResponsePayload,
): Promise<FormResponse> {
  const res = await api.post<ApiEnvelope<FormResponse>>(`/responses/${formId}`, payload);
  return res.data.data;
}

/** GET /responses/form/:formId – get all responses for a form (org auth) */
export async function getFormResponses(formId: string): Promise<FormResponse[]> {
  const res = await api.get<ApiEnvelope<FormResponse[]>>(`/responses/form/${formId}`);
  return res.data.data;
}

/** GET /responses/form/:formId/completion – get completion rate for a form (org auth) */
export async function getFormCompletionRate(formId: string): Promise<FormCompletionStats> {
  const res = await api.get<ApiEnvelope<FormCompletionStats>>(`/responses/form/${formId}/completion`);
  return res.data.data;
}

/** GET /responses/:id – get a single response by id (org auth) */
export async function getResponse(id: string): Promise<FormResponse> {
  const res = await api.get<ApiEnvelope<FormResponse>>(`/responses/${id}`);
  return res.data.data;
}

/** DELETE /responses/:id – delete a single response (org auth) */
export async function deleteResponse(id: string): Promise<void> {
  await api.delete(`/responses/${id}`);
}

export interface OrgResponseItem extends FormResponse {
  formTitle: string;
  formSlug: string;
}

export interface OrgResponseMetrics {
  totalForms: number;
  totalResponses: number;
  activeFormsWithResponses: number;
  averageCompletionRate: number;
  responsesToday: number;
}

export interface OrgResponsesData {
  responses: OrgResponseItem[];
  metrics: OrgResponseMetrics;
}

/** GET /responses – get all responses across all forms in active org (org auth) */
export async function getAllOrgResponses(): Promise<OrgResponsesData> {
  const res = await api.get<ApiEnvelope<OrgResponsesData>>("/responses");
  return res.data.data;
}
