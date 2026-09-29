import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listForms,
  getForm,
  createForm,
  updateForm,
  togglePublish,
  duplicateForm,
  deleteForm,
  type CreateFormPayload,
  type UpdateFormPayload,
} from "@/lib/api/forms";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const formKeys = {
  all: ["forms"] as const,
  lists: () => [...formKeys.all, "list"] as const,
  detail: (id: string) => [...formKeys.all, "detail", id] as const,
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** Fetch all forms for the current org */
export function useForms() {
  return useQuery({
    queryKey: formKeys.lists(),
    queryFn: listForms,
  });
}

/** Fetch a single form by id */
export function useForm(id: string) {
  return useQuery({
    queryKey: formKeys.detail(id),
    queryFn: () => getForm(id),
    enabled: !!id,
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export function useCreateForm() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateFormPayload) => createForm(payload),
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
    mutationFn: (id: string) => togglePublish(id),
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
    mutationFn: (id: string) => duplicateForm(id),
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
    mutationFn: (id: string) => deleteForm(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: formKeys.lists() });
      toast.success("Form deleted");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to delete form");
    },
  });
}
