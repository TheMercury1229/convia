"use client";

import * as React from "react";
import { useParams, useSearchParams } from "next/navigation";
import { FormBuilderHeader } from "@/components/builder/form-builder-header";
import { FormBuilder } from "@/components/builder/form-builder";
import { useBuilderStore } from "@/store/builder-store";
import { useForm as useFormQuery } from "@/hooks/use-forms";
import { useBuilderSync } from "@/hooks/use-builder-sync";
import { Loader2 } from "lucide-react";

/**
 * Inner component that uses useParams and useSearchParams.
 * Wrapped in Suspense to satisfy Next.js client-side search params requirement.
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

  const rawMode = searchParams.get("mode");
  const mode: "create" | "edit" = rawMode === "create" ? "create" : "edit";

  // Fine-grained selectors — only re-render this component when these change,
  // not on every section/question mutation inside the canvas.
  const initFromApi = useBuilderStore((s) => s.initFromApi);
  const isInitialised = useBuilderStore((s) => s.isInitialised);
  const formTitle = useBuilderStore((s) => s.form.title);

  // Fetch the full form with sections + questions from the API
  const { data: apiForm, isLoading } = useFormQuery(id);

  // Hydrate the store from the API response (runs once when data arrives)
  const hasInit = React.useRef(false);
  React.useEffect(() => {
    if (apiForm && !hasInit.current) {
      hasInit.current = true;
      initFromApi(apiForm);
    }
  }, [apiForm, initFromApi]);

  // Autosave: debounce + Ctrl+S + exposes save() and saveState
  const { saveState, save } = useBuilderSync();

  // ── Loading state — show spinner until data is fetched and store is hydrated
  if (isLoading || !isInitialised) {
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
        title={formTitle}
        mode={mode}
        saveState={saveState}
        onSave={save}
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
