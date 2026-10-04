"use client";

import * as React from "react";
import { useParams, useSearchParams } from "next/navigation";
import { FormBuilderHeader } from "@/components/builder/form-builder-header";
import { FormBuilder } from "@/components/builder/form-builder";
import { AiGenerationLoader } from "@/components/builder/ai-generation-loader";
import { useBuilderStore } from "@/store/builder-store";
import { useForm as useFormQuery } from "@/hooks/use-forms";
import { useBuilderSync } from "@/hooks/use-builder-sync";
import { useAiFormGeneration } from "@/hooks/use-ai-form-generation";
import { Loader2 } from "lucide-react";

/**
 * Inner component that uses client-side route params.
 * Wrapped in Suspense for the builder route's client-side loading boundary.
 */
function BuilderPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();

  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
        ? params.id[0]
        : "";

  const queryJobId = searchParams.get("jobId");

  // AI Form generation hook — encapsulates polling, status tracking, and store hydration
  const { isGenerating, startTrackingJob } = useAiFormGeneration({
    currentId: id,
    initialJobId: queryJobId,
  });

  // Fine-grained selectors — only re-render this component when these change,
  // not on every section/question mutation inside the canvas.
  const initFromApi = useBuilderStore((s) => s.initFromApi);
  const isInitialised = useBuilderStore((s) => s.isInitialised);

  // Fetch the full form with sections + questions from the API
  const { data: apiForm, isLoading } = useFormQuery(id);

  // Hydrate the store from the API response (runs once when data arrives)
  const hasInit = React.useRef(false);
  React.useEffect(() => {
    if (apiForm && !hasInit.current && !isGenerating) {
      hasInit.current = true;
      initFromApi(apiForm);
    }
  }, [apiForm, initFromApi, isGenerating]);

  // Autosave: debounce + Ctrl+S + exposes save() and saveState
  const { saveState, save } = useBuilderSync();

  // ── Full-screen AI Generation Loader ─────────────────────────────────────
  if (isGenerating) {
    return <AiGenerationLoader />;
  }

  // ── Loading state — show spinner until data is fetched and store is hydrated
  if (isLoading || (!isInitialised && id !== "ai" && id !== "generating")) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-primary" />
          <span>Loading builder…</span>
        </div>
      </div>
    );
  }

  return (
    <>
      <FormBuilderHeader
        backHref="/my-forms"
        saveState={saveState}
        onSave={save}
        onStartAiJob={startTrackingJob}
      />
      <FormBuilder />
    </>
  );
}

export default function BuilderPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-background">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span>Loading builder…</span>
          </div>
        </div>
      }
    >
      <BuilderPageContent />
    </React.Suspense>
  );
}
