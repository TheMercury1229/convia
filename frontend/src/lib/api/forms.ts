import { api } from "@/lib/api";

export interface Form {
  id: string;
  title: string;
  description?: string | null;
  slug: string;
  isPublished: boolean;
  deadline?: string | null;
  themeId?: string | null;
  createdAt: string;
  updatedAt: string;
  orgId: string;
  updatedBy?: string | null;
}

export interface ApiSection {
  id: string;
  formId: string;
  title?: string | null;
  description?: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export interface ApiQuestion {
  id: string;
  sectionId: string;
  formId: string;
  fieldName: string;
  label: string;
  description?: string | null;
  placeholder?: string | null;
  type: string;
  isRequired: boolean;
  position: number;
  options?: unknown;
  validation?: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface FormWithSections extends Form {
  sections: (ApiSection & { questions: ApiQuestion[] })[];
}

export interface CreateFormPayload {
  title: string;
  description?: string;
  slug?: string;
  themeId?: string;
  deadline?: string | null;
}

export interface UpdateFormPayload extends Partial<CreateFormPayload> { }

export interface SaveBuilderPayload {
  sections: {
    id: string;
    title?: string | null;
    description?: string | null;
    position: number;
  }[];
  questions: {
    id: string;
    sectionId: string;
    fieldName: string;
    label: string;
    description?: string | null;
    placeholder?: string | null;
    type: string;
    isRequired: boolean;
    position: number;
    options?: unknown;
    validation?: unknown;
  }[];
}

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

/** GET /forms/:id – fetch a single form with its sections and questions */
export async function getForm(id: string): Promise<FormWithSections> {
  const res = await api.get<ApiEnvelope<FormWithSections>>(`/forms/${id}`);
  return res.data.data;
}

/** GET /forms/public/:slug – fetch a public published form with its sections and questions */
export async function getPublicForm(slug: string): Promise<FormWithSections> {
  const res = await api.get<ApiEnvelope<FormWithSections>>(`/forms/public/${slug}`);
  return res.data.data;
}

/** POST /forms – create a new form */
export async function createForm(payload: CreateFormPayload): Promise<Form> {
  const res = await api.post<ApiEnvelope<Form>>("/forms", payload);
  return res.data.data;
}

/** PATCH /forms/:id – update form metadata (title, slug, themeId, deadline, etc.) */
export async function updateForm(
  id: string,
  payload: UpdateFormPayload,
): Promise<Form> {
  const res = await api.patch<ApiEnvelope<Form>>(`/forms/${id}`, payload);
  return res.data.data;
}

/** PATCH /forms/:id/builder – replace all sections + questions (autosave) */
export async function saveBuilderState(
  id: string,
  payload: SaveBuilderPayload,
): Promise<void> {
  await api.patch(`/forms/${id}/builder`, payload);
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
