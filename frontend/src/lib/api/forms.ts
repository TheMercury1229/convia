import { api } from "@/lib/api";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Form {
  id: string;
  title: string;
  description?: string | null;
  slug: string;
  isPublished: boolean;
  deadline?: string | null;
  createdAt: string;
  updatedAt: string;
  orgId: string;
  createdBy?: string | null;
}

export interface CreateFormPayload {
  title: string;
  description?: string;
  slug?: string;
  themeId?: string;
  deadline?: string | null;
}

export interface UpdateFormPayload extends Partial<CreateFormPayload> {}

interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

// ---------------------------------------------------------------------------
// API methods
// ---------------------------------------------------------------------------

/** GET /forms – list all forms for the active org */
export async function listForms(): Promise<Form[]> {
  const res = await api.get<ApiEnvelope<Form[]>>("/forms");
  return res.data.data;
}

/** GET /forms/:id – fetch a single form */
export async function getForm(id: string): Promise<Form> {
  const res = await api.get<ApiEnvelope<Form>>(`/forms/${id}`);
  return res.data.data;
}

/** POST /forms – create a new form */
export async function createForm(payload: CreateFormPayload): Promise<Form> {
  const res = await api.post<ApiEnvelope<Form>>("/forms", payload);
  return res.data.data;
}

/** PATCH /forms/:id – update an existing form */
export async function updateForm(
  id: string,
  payload: UpdateFormPayload,
): Promise<Form> {
  const res = await api.patch<ApiEnvelope<Form>>(`/forms/${id}`, payload);
  return res.data.data;
}

/** PATCH /forms/:id/publish – toggle publish state */
export async function togglePublish(id: string): Promise<Form> {
  const res = await api.patch<ApiEnvelope<Form>>(`/forms/${id}/publish`);
  return res.data.data;
}

/** POST /forms/:id/duplicate – duplicate a form */
export async function duplicateForm(id: string): Promise<Form> {
  const res = await api.post<ApiEnvelope<Form>>(`/forms/${id}/duplicate`);
  return res.data.data;
}

/** DELETE /forms/:id – permanently delete a form */
export async function deleteForm(id: string): Promise<void> {
  await api.delete(`/forms/${id}`);
}
