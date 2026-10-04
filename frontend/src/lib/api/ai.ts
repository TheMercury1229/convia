import { api } from "@/lib/api";

export interface GenerateFormResponse {
  jobId: string;
}

export interface JobStatusResponse {
  status: "pending" | "ready" | "failed";
  formId?: string;
  error?: string;
}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * POST /api/ai/generate-form
 * Kicks off an async form generation job in the backend.
 */
export async function generateFormWithAi(
  userQuery: string,
): Promise<GenerateFormResponse> {
  const res = await api.post<ApiEnvelope<GenerateFormResponse>>(
    "/ai/generate-form",
    { user_query: userQuery },
  );
  return res.data.data;
}

/**
 * GET /api/ai/jobs/:jobId/status
 * Polls the current status of an AI generation job.
 */
export async function getAiJobStatus(
  jobId: string,
): Promise<JobStatusResponse> {
  const res = await api.get<ApiEnvelope<JobStatusResponse>>(
    `/ai/jobs/${jobId}/status`,
  );
  return res.data.data;
}
