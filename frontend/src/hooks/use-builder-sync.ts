import { useRef, useEffect, useCallback, useState } from "react";
import { useBuilderStore } from "@/store/builder-store";
import { updateForm, saveBuilderState } from "@/lib/api/forms";

// ---------------------------------------------------------------------------
// Save-state type (exposed to consumers for the header indicator)
// ---------------------------------------------------------------------------

export type SaveState = "saved" | "saving" | "unsaved";

// ---------------------------------------------------------------------------
// Debounce delay — 45 s is within the 30–60 s window requested
// ---------------------------------------------------------------------------

const DEBOUNCE_MS = 45_000;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * useBuilderSync
 *
 * Autosave triggers:
 *   1. Debounced — fires DEBOUNCE_MS after the last store change
 *   2. Ctrl+S / Cmd+S keyboard shortcut
 *   3. Manual — the returned `save()` function (e.g. Publish button)
 *
 * Uses Zustand's low-level subscribe() for change detection so that user
 * edits don't cause React re-renders in this hook at all.
 * Reads state imperatively inside save() to avoid stale closures.
 */
export function useBuilderSync(): { saveState: SaveState; save: () => void } {
  // Fine-grained selectors — only re-render this hook when these two change
  const isInitialised = useBuilderStore((s) => s.isInitialised);
  const formId = useBuilderStore((s) => s.form.id);

  const [saveState, setSaveState] = useState<SaveState>("saved");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Core save — reads current store state imperatively ─────────────────
  const save = useCallback(async () => {
    const { form, sections, questions } = useBuilderStore.getState();
    if (!form.id) return;

    setSaveState("saving");

    let normalizedDeadline: string | null = null;
    if (form.deadline) {
      const d = new Date(form.deadline);
      if (!isNaN(d.getTime())) {
        normalizedDeadline = d.toISOString();
      }
    }

    try {
      await Promise.all([
        updateForm(form.id, {
          title: form.title,
          description: form.description,
          slug: form.slug ?? undefined,
          themeId: form.themeId,
          deadline: normalizedDeadline,
          maxResponses: form.maxResponses ?? null,
          redirectUrl: form.redirectUrl ?? null,
          completionTitle: form.completionTitle ?? null,
          completionMessage: form.completionMessage ?? null,
        }),
        saveBuilderState(form.id, {
          sections: sections.map((s) => ({
            id: s.id,
            title: s.title || null,
            description: s.description || null,
            position: s.position,
          })),
          questions: questions.map((q) => ({
            id: q.id,
            sectionId: q.sectionId,
            fieldName: q.fieldName,
            label: q.label,
            description: q.description || null,
            placeholder: q.placeholder || null,
            type: q.type,
            // Translate store field (required) → backend field (isRequired)
            isRequired: q.required,
            position: q.position,
            options: q.options.length > 0 ? q.options : null,
            validation:
              Object.keys(q.validation).length > 0 ? q.validation : null,
          })),
        }),
      ]);
      setSaveState("saved");
    } catch {
      setSaveState("unsaved");
    }
  }, []); // stable — all state is read imperatively inside

  // ── Schedule a debounced save ───────────────────────────────────────────
  const scheduleAutosave = useCallback(() => {
    setSaveState("unsaved"); // immediate visual feedback
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(save, DEBOUNCE_MS);
  }, [save]);

  // ── Subscribe to Zustand store — detect any user edit ──────────────────
  // We use Zustand's native prevState param instead of maintaining our own
  // prev variable, which eliminates the race window between getState() and
  // subscribe() registration.
  useEffect(() => {
    if (!isInitialised || !formId) return;

    const unsub = useBuilderStore.subscribe((next, prev) => {
      // Ignore the initFromApi write that marks isInitialised → true,
      // and any subsequent writes while not yet initialised.
      if (!next.isInitialised) return;

      const changed =
        next.form !== prev.form ||
        next.sections !== prev.sections ||
        next.questions !== prev.questions;

      if (changed) scheduleAutosave();
    });

    return () => {
      unsub();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [isInitialised, formId, scheduleAutosave]);

  // ── Ctrl+S / Cmd+S ─────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (isInitialised && formId) {
          if (debounceRef.current) clearTimeout(debounceRef.current);
          save();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isInitialised, formId, save]);

  return { saveState, save };
}
