"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getTemplateById,
  templateToFormWithSections,
} from "@/components/templates/template-data";
import { FormUnavailableState } from "@/components/form-viewer/form-unavailable-state";
import { FormBuilder } from "@/components/builder/form-builder";
import { useBuilderStore } from "@/store/builder-store";
import { createForm, saveBuilderState } from "@/lib/api/forms";
import { formKeys } from "@/hooks/use-forms";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function TemplateBuilderViewPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const templateId = params?.id;

  const template = React.useMemo(() => {
    return templateId ? getTemplateById(templateId) : undefined;
  }, [templateId]);

  const initFromApi = useBuilderStore((s) => s.initFromApi);
  const isInitialised = useBuilderStore((s) => s.isInitialised);
  const currentStoreFormId = useBuilderStore((s) => s.form.id);

  const [isCloning, setIsCloning] = React.useState(false);

  // Hydrate builder store with template structure in readOnly mode
  React.useEffect(() => {
    if (template && currentStoreFormId !== template.id) {
      initFromApi(templateToFormWithSections(template), true);
    }
  }, [template, currentStoreFormId, initFromApi]);

  if (!template) {
    return (
      <FormUnavailableState
        reason="not-found"
        errorMessage="The requested template could not be found."
        dashboard={true}
      />
    );
  }

  const isReady = isInitialised && currentStoreFormId === template.id;

  const handleClone = async () => {
    if (!template || isCloning) return;
    setIsCloning(true);

    try {
      // 1. Create a real form on the backend using the template's title and theme
      const newForm = await createForm({
        title: template.title,
        description: template.description,
        themeId: template.themeId,
      });

      // 2. Map current questions & sections from store (or fallback to template definitions)
      const currentStore = useBuilderStore.getState();
      const rawSections =
        currentStore.sections.length > 0
          ? currentStore.sections
          : templateToFormWithSections(template).sections;
      const rawQuestions =
        currentStore.questions.length > 0
          ? currentStore.questions
          : templateToFormWithSections(template).sections.flatMap((s) => s.questions);

      const sectionIdMap = new Map<string, string>();
      const newSections = rawSections.map((s, idx) => {
        const newSecId =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `sec-${Date.now()}-${idx}`;
        sectionIdMap.set(s.id, newSecId);
        return {
          id: newSecId,
          title: s.title || null,
          description: s.description || null,
          position: s.position ?? idx,
        };
      });

      const newQuestions = rawQuestions.map((q: any, idx: number) => {
        const targetSecId =
          sectionIdMap.get(q.sectionId) ||
          newSections[0]?.id ||
          (typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `sec-${Date.now()}`);
        const newQId =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : `q-${Date.now()}-${idx}`;
        return {
          id: newQId,
          sectionId: targetSecId,
          fieldName: q.fieldName || `field_${idx + 1}`,
          label: q.label || `Question ${idx + 1}`,
          description: q.description || null,
          placeholder: q.placeholder || null,
          type: q.type,
          isRequired: Boolean(q.required ?? q.isRequired),
          position: q.position ?? idx,
          options: q.options && q.options.length > 0 ? q.options : null,
          validation:
            q.validation && Object.keys(q.validation).length > 0
              ? q.validation
              : null,
        };
      });

      // 3. Save sections and questions into the new form
      await saveBuilderState(newForm.id, {
        sections: newSections,
        questions: newQuestions,
      });

      // 4. Invalidate form lists so the dashboard reflects the new form
      queryClient.invalidateQueries({ queryKey: formKeys.lists() });

      toast.success("Template cloned! Opening in builder...");
      router.push(`/builder/${newForm.id}`);
    } catch (err: any) {
      console.error("Clone template error:", err);
      toast.error(err?.message || "Failed to clone template. Please try again.");
      setIsCloning(false);
    }
  };

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background">
      {/* ────────────────────────────────────────────────────────── */}
      {/* Header: Clean view with options hidden & Clone Template     */}
      {/* ────────────────────────────────────────────────────────── */}
      <header
        className={cn(
          "relative z-50 flex h-13 shrink-0 items-center justify-between border-b border-border/60 px-3",
          "bg-background/90 backdrop-blur-md",
          "after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:h-px",
          "after:bg-gradient-to-r after:from-transparent after:via-primary/20 after:to-transparent"
        )}
      >
        {/* Left: Back to Templates + Form Title */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                variant="ghost"
                size="icon-sm"
                className="shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="Back to templates"
              >
                <Link href="/templates">
                  <ArrowLeft className="h-4 w-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Back to Templates</TooltipContent>
          </Tooltip>

          <div
            className="h-4 w-px shrink-0 bg-border/70"
            role="separator"
            aria-hidden="true"
          />

          <div className="flex items-center gap-2 min-w-0">
            <span
              className="font-heading text-base font-semibold tracking-tight text-foreground truncate max-w-[200px] sm:max-w-md"
              title={template.title}
            >
              {template.title}
            </span>
          </div>
        </div>

        {/* Right: Fill Preview Link + Primary Clone Template Button */}
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <Link href={`/templates/preview/${template.id}`}>
              <ExternalLink className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Fill Preview</span>
              <span className="sm:hidden">Preview</span>
            </Link>
          </Button>

          <Button
            size="sm"
            onClick={handleClone}
            disabled={isCloning}
            className="gap-1.5 font-medium bg-primary text-primary-foreground shadow-xs cursor-pointer hover:opacity-90 active:scale-[0.98]"
          >
            {isCloning ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            <span>{isCloning ? "Cloning..." : "Clone Template"}</span>
          </Button>
        </div>
      </header>

      {/* ────────────────────────────────────────────────────────── */}
      {/* Existing Form Builder UI Workspace                         */}
      {/* ────────────────────────────────────────────────────────── */}
      {!isReady ? (
        <div className="flex flex-1 items-center justify-center bg-background">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" />
            <span>Loading template builder…</span>
          </div>
        </div>
      ) : (
        <FormBuilder />
      )}
    </div>
  );
}
