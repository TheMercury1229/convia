import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listForms,
  getForm,
  getPublicForm,
  createForm,
  updateForm,
  togglePublish,
  duplicateForm,
  deleteForm,
  type CreateFormPayload,
  type UpdateFormPayload,
} from "@/lib/api/forms";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const formKeys = {
  all: ["forms"] as const,
  lists: (orgId?: string) =>
    orgId
      ? ([...formKeys.all, "list", orgId] as const)
      : ([...formKeys.all, "list"] as const),
  detail: (id: string) => [...formKeys.all, "detail", id] as const,
  public: (slug: string) => [...formKeys.all, "public", slug] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Fetch all forms for the current org */
export function useForms() {
  const { data: activeOrg } = authClient.useActiveOrganization();
  const orgId = activeOrg?.id;

  return useQuery({
    queryKey: formKeys.lists(orgId),
    queryFn: listForms,
    enabled: !!orgId,
  });
}

/** Fetch a single form by id (builder / authenticated view) */
export function useForm(id: string) {
  return useQuery({
    queryKey: formKeys.detail(id),
    queryFn: () => getForm(id),
    enabled: !!id,
  });
}

/** Fetch a published form by slug (respondent / public view) */
export function usePublicForm(slug: string) {
  return useQuery({
    queryKey: formKeys.public(slug),
    queryFn: () => getPublicForm(slug),
    enabled: !!slug,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createForm,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: formKeys.lists() });
      toast.success("Form created successfully!");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to create form");
    },
  });
}

export function useUpdateForm(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateFormPayload) => updateForm(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: formKeys.lists() });
      qc.invalidateQueries({ queryKey: formKeys.detail(id) });
      toast.success("Form updated!");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to update form");
    },
  });
}

export function useTogglePublish() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: togglePublish,
    onSuccess: (form) => {
      qc.invalidateQueries({ queryKey: formKeys.lists() });
      qc.invalidateQueries({ queryKey: formKeys.detail(form.id) });
      toast.success(form.isPublished ? "Form published!" : "Form unpublished");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to toggle publish");
    },
  });
}

export function useDuplicateForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: duplicateForm,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: formKeys.lists() });
      toast.success("Form duplicated!");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to duplicate form");
    },
  });
}

export function useDeleteForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteForm,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: formKeys.lists() });
      toast.success("Form deleted");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to delete form");
    },
  });
}
