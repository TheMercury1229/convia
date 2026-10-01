import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getFormResponses,
  getFormCompletionRate,
  getResponse,
  deleteResponse,
  getAllOrgResponses,
} from "@/lib/api/responses";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

export const responseKeys = {
  all: ["responses"] as const,
  orgAll: (orgId?: string) =>
    orgId
      ? ([...responseKeys.all, "org", orgId] as const)
      : ([...responseKeys.all, "org"] as const),
  formResponses: (formId: string) => [...responseKeys.all, "form", formId] as const,
  completionRate: (formId: string) => [...responseKeys.all, "completion", formId] as const,
  detail: (id: string) => [...responseKeys.all, "detail", id] as const,
};

/** Fetch all responses across all forms in the active organisation */
export function useAllOrgResponses() {
  const { data: activeOrg } = authClient.useActiveOrganization();
  const orgId = activeOrg?.id;

  return useQuery({
    queryKey: responseKeys.orgAll(orgId),
    queryFn: () => getAllOrgResponses(),
    enabled: !!orgId,
  });
}

/** Fetch all responses for a form (org-scoped) */
export function useFormResponses(formId: string) {
  return useQuery({
    queryKey: responseKeys.formResponses(formId),
    queryFn: () => getFormResponses(formId),
    enabled: !!formId,
    retry: 1,
  });
}

/** Fetch completion rate stats for a form */
export function useFormCompletionRate(formId: string) {
  return useQuery({
    queryKey: responseKeys.completionRate(formId),
    queryFn: () => getFormCompletionRate(formId),
    enabled: !!formId,
    retry: 1,
  });
}

/** Fetch a single response by ID */
export function useResponse(responseId: string) {
  return useQuery({
    queryKey: responseKeys.detail(responseId),
    queryFn: () => getResponse(responseId),
    enabled: !!responseId,
  });
}

/** Delete a response */
export function useDeleteResponse(formId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteResponse(id),
    onSuccess: () => {
      if (formId) {
        qc.invalidateQueries({ queryKey: responseKeys.formResponses(formId) });
        qc.invalidateQueries({ queryKey: responseKeys.completionRate(formId) });
      } else {
        qc.invalidateQueries({ queryKey: responseKeys.all });
      }
      toast.success("Response deleted");
    },
    onError: (err: Error) => {
      toast.error(err.message ?? "Failed to delete response");
    },
  });
}
