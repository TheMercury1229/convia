"use client";

import * as React from "react";
import { useRouter } from "next/navigation"; // used only to update URL param on success
import { toast } from "sonner";
import { useBuilderStore } from "@/store/builder-store";
import { getAiJobStatus, generateFormWithAi } from "@/lib/api/ai";
import { getForm, type FormWithSections } from "@/lib/api/forms";

// ---------------------------------------------------------------------------
// Types & Defaults
// ---------------------------------------------------------------------------

export interface UseAiFormGenerationOptions {
  /** The current route param id (e.g. formId or "ai") */
  currentId?: string;
  /** Initial job ID, typically from URL search params (e.g. ?jobId=...) */
  initialJobId?: string | null;
  /** Polling interval in milliseconds (defaults to 1800ms) */
  pollIntervalMs?: number;
  /** Optional callback fired when form is successfully generated and hydrated */
  onSuccess?: (form: FormWithSections) => void;
  /** Optional callback fired when generation fails */
  onError?: (error: string) => void;
}

export interface UseAiFormGenerationReturn {
  /** Currently tracked AI job ID (null when idle) */
  activeJobId: string | null;
  /** Whether generation is in progress (loader active) */
  isGenerating: boolean;
  /** Any error message from the last run */
  error: string | null;
  /** Kick off generation given a user prompt and track the job */
  generate: (prompt: string) => Promise<string>;
  /** Track an existing job ID */
  startTrackingJob: (jobId: string) => void;
  /** Cancel active polling/tracking */
  cancelTracking: () => void;
}

const DEFAULT_POLL_INTERVAL = 1800;

// Fallback blank form template if generation fails on a fresh /ai route
function createFallbackDraftForm(): FormWithSections {
  const now = new Date().toISOString();
  return {
    id: "draft",
    title: "Untitled Form",
    description: "",
    slug: "untitled-form",
    isPublished: false,
    orgId: "",
    createdAt: now,
    updatedAt: now,
    sections: [
      {
        id: "section_1",
        formId: "draft",
        title: "General",
        position: 0,
        createdAt: now,
        updatedAt: now,
        questions: [],
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useAiFormGeneration
 *
 * Encapsulates the complete lifecycle of Grizzy AI form generation:
 *   1. Starts the async generation job via `POST /api/ai/generate-form`
 *   2. Polls `GET /api/ai/jobs/:jobId/status` at a reliable interval
 *   3. On "ready" status:
 *      - Instantly fetches the full created form
 *      - Hydrates the builder store
 *      - Transitions the route to `/builder/${formId}`
 *      - Emits toast notification
 *   4. On "failed" status:
 *      - Emits error toast
 *      - Gracefully restores an editable builder state
 *      - Strips the query parameter
 */
export function useAiFormGeneration(
  options: UseAiFormGenerationOptions = {},
): UseAiFormGenerationReturn {
  const {
    currentId = "",
    initialJobId = null,
    pollIntervalMs = DEFAULT_POLL_INTERVAL,
    onSuccess,
    onError,
  } = options;

  const router = useRouter();
  const initFromApi = useBuilderStore((s) => s.initFromApi);

  const [activeJobId, setActiveJobId] = React.useState<string | null>(initialJobId);
  const [error, setError] = React.useState<string | null>(null);

  // Sync if initialJobId changes externally
  React.useEffect(() => {
    if (initialJobId) {
      setActiveJobId(initialJobId);
    }
  }, [initialJobId]);

  const startTrackingJob = React.useCallback((jobId: string) => {
    setError(null);
    setActiveJobId(jobId);
  }, []);

  const cancelTracking = React.useCallback(() => {
    setActiveJobId(null);
  }, []);

  // ── Trigger API generation and track job ─────────────────────────────────
  const generate = React.useCallback(
    async (prompt: string): Promise<string> => {
      const trimmed = prompt.trim();
      if (!trimmed) throw new Error("Prompt cannot be empty");

      setError(null);
      const { jobId } = await generateFormWithAi(trimmed);
      setActiveJobId(jobId);
      return jobId;
    },
    [],
  );

  // ── Polling Loop ─────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!activeJobId) return;

    let isCancelled = false;

    const poll = async () => {
      try {
        const res = await getAiJobStatus(activeJobId);
        if (isCancelled) return;

        // 1. Success — job ready
        if (res.status === "ready" && res.formId) {
          try {
            const createdForm = await getForm(res.formId);
            if (isCancelled) return;

            // Stay on the same builder page — just hydrate with the real form
            // and silently update the URL to the real formId (no navigation).
            initFromApi(createdForm);
            setActiveJobId(null);
            setError(null);
            toast.success("Form generated successfully!");
            router.replace(`/builder/${res.formId}`);
            onSuccess?.(createdForm);
            return;
          } catch (fetchErr) {
            console.error("[useAiFormGeneration] Failed to fetch generated form:", fetchErr);
          }
        }

        // 2. Failure — job failed
        if (res.status === "failed") {
          const errMsg =
            res.error || "Grizzy encountered an issue while generating the form.";

          // Clear generating state so the builder renders normally — never navigate away.
          setActiveJobId(null);
          setError(errMsg);
          toast.error(errMsg);

          // If this was a brand-new /ai route with no real form yet, give a blank draft
          if (currentId === "ai" || currentId === "generating") {
            initFromApi(createFallbackDraftForm());
          }

          onError?.(errMsg);
          return;
        }
      } catch (pollErr) {
        console.error("[useAiFormGeneration] Polling error:", pollErr);
      }
    };

    // Execute initial poll immediately, then periodically
    poll();
    const timer = setInterval(poll, pollIntervalMs);

    return () => {
      isCancelled = true;
      clearInterval(timer);
    };
  }, [
    activeJobId,
    currentId,
    initialJobId,
    initFromApi,
    router,
    pollIntervalMs,
    onSuccess,
    onError,
  ]);

  return {
    activeJobId,
    isGenerating: Boolean(activeJobId),
    error,
    generate,
    startTrackingJob,
    cancelTracking,
  };
}
