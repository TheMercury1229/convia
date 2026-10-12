import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { current } from "immer";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { getFormTheme, type FormThemeResolved } from "@/lib/builder-themes";
import { getTypeLabel } from "@/lib/question-registry";
import { apiQuestionToClientQuestion } from "@/lib/form-model";
import type {
  BuilderForm,
  BuilderSnapshot,
  Question,
  QuestionOption,
  QuestionType,
  QuestionValidation,
  Section,
  SelectedElement,
} from "@/types/builder";
import type { FormWithSections } from "@/lib/api/forms";

// --------------------------------------------------------
// Helpers
// --------------------------------------------------------

function createSnapshot(state: {
  form: BuilderForm;
  sections: Section[];
  questions: Question[];
}): BuilderSnapshot {
  return {
    form: { ...state.form },
    sections: state.sections.map((s) => ({ ...s })),
    questions: state.questions.map((q) => ({
      ...q,
      options: q.options.map((o) => ({ ...o })),
      validation: { ...(q.validation || {}) },
    })),
  };
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

function makeFieldName(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
}

function defaultQuestion(
  sectionId: string,
  type: QuestionType,
  position: number,
): Question {
  const label = getTypeLabel(type);
  return {
    id: uid(),
    sectionId,
    type,
    fieldName: makeFieldName(label),
    // Unlocked — fieldName will be derived + frozen on the user's first label edit
    fieldNameLocked: false,
    label,
    description: "",
    placeholder: "",
    required: false,
    position,
    options:
      type === "select" ||
      type === "multi_select" ||
      type === "radio" ||
      type === "checkbox"
        ? [
            { id: uid(), label: "Option 1" },
            { id: uid(), label: "Option 2" },
          ]
        : [],
    validation: {},
  };
}

function syncSectionPositions(sections: Section[]) {
  sections.forEach((sec, i) => {
    sec.position = i;
  });
}

function syncQuestionPositions(questions: Question[], sectionId?: string) {
  if (sectionId) {
    let pos = 0;
    for (const q of questions) {
      if (q.sectionId === sectionId) {
        q.position = pos++;
      }
    }
  } else {
    const counters = new Map<string, number>();
    for (const q of questions) {
      const current = counters.get(q.sectionId) ?? 0;
      q.position = current;
      counters.set(q.sectionId, current + 1);
    }
  }
}

/** Map a raw API FormWithSections into the builder store's Section[] + Question[] */
function apiToBuilderState(apiForm: FormWithSections): {
  form: BuilderForm;
  sections: Section[];
  questions: Question[];
} {
  const form: BuilderForm = {
    id: apiForm.id,
    title: apiForm.title,
    description: apiForm.description ?? "",
    slug: apiForm.slug,
    isPublished: apiForm.isPublished ?? false,
    deadline: apiForm.deadline ?? null,
    maxResponses: apiForm.maxResponses ?? null,
    redirectUrl: apiForm.redirectUrl ?? null,
    completionTitle: apiForm.completionTitle ?? null,
    completionMessage: apiForm.completionMessage ?? null,
    themeId: apiForm.themeId ?? "nova",
  };

  const sections: Section[] = apiForm.sections.map((s) => ({
    id: s.id,
    formId: apiForm.id,
    title: s.title ?? "",
    description: s.description ?? "",
    position: s.position,
  }));

  const questions: Question[] = apiForm.sections.flatMap((s) =>
    s.questions.map((q) => apiQuestionToClientQuestion(q)),
  );

  return { form, sections, questions };
}

// --------------------------------------------------------
// Empty defaults — used as initial state before API loads
// --------------------------------------------------------

const emptyForm: BuilderForm = {
  id: "",
  title: "",
  description: "",
  slug: "",
  isPublished: false,
  deadline: null,
  maxResponses: null,
  redirectUrl: null,
  completionTitle: null,
  completionMessage: null,
  themeId: "nova",
};

// --------------------------------------------------------
// Store state & actions
// --------------------------------------------------------

interface BuilderState {
  form: BuilderForm;
  sections: Section[];
  questions: Question[];
  selectedElement: SelectedElement | null;
  rightPanelTab: "properties" | "settings" | "grizzy";
  /** Whether the store has been initialised from the API (prevents flash of empty state) */
  isInitialised: boolean;
  /** Whether the builder is in view-only / template mode (disallows all mutations) */
  readOnly: boolean;
  setReadOnly(readOnly: boolean): void;
  setRightPanelTab(tab: "properties" | "settings" | "grizzy"): void;

  /**
   * Initialise the store from the API response.
   * Call once when the form data first arrives from React Query.
   */
  initFromApi(apiForm: FormWithSections, readOnly?: boolean): void;

  // ── Form ──────────────────────────────────────────────
  updateForm(patch: Partial<BuilderForm>): void;

  // ── Section ───────────────────────────────────────────
  addSection(): void;
  updateSection(id: string, patch: Partial<Omit<Section, "id" | "formId">>): void;
  deleteSection(id: string): void;
  reorderSections(fromIndex: number, toIndex: number): void;
  moveSectionUp(id: string): void;
  moveSectionDown(id: string): void;

  // ── Question ──────────────────────────────────────────
  addQuestion(sectionId: string, type: QuestionType, atIndex?: number): void;
  updateQuestion(id: string, patch: Partial<Omit<Question, "id" | "sectionId">>): void;
  /**
   * Called on blur of the label input.
   * If the question's fieldName hasn't been locked yet, derives it from the
   * current label and locks it permanently.
   */
  commitLabel(id: string): void;
  deleteQuestion(id: string): void;
  duplicateQuestion(id: string): void;
  /** Reorder within the same section */
  reorderQuestions(sectionId: string, fromIndex: number, toIndex: number): void;
  moveQuestionUp(id: string): void;
  moveQuestionDown(id: string): void;
  /** Move to a different section at a target index */
  moveQuestion(questionId: string, toSectionId: string, toIndex: number): void;

  // ── Selection ─────────────────────────────────────────
  selectElement(el: SelectedElement | null): void;

  // ── Options (for choice questions) ───────────────────
  addOption(questionId: string): void;
  updateOption(questionId: string, optionId: string, label: string): void;
  deleteOption(questionId: string, optionId: string): void;
  reorderOptions(questionId: string, fromIndex: number, toIndex: number): void;

  // ── Validation ────────────────────────────────────────
  updateValidation(questionId: string, patch: Partial<QuestionValidation>): void;

  // ── History & Snapshots (Undo / Redo / AI reviews) ───
  historyPast: BuilderSnapshot[];
  historyFuture: BuilderSnapshot[];
  getSnapshot(): BuilderSnapshot;
  restoreSnapshot(snapshot: BuilderSnapshot): void;
  pushHistory(): void;
  undo(): void;
  redo(): void;
  canUndo(): boolean;
  canRedo(): boolean;
}

export const useBuilderStore = create<BuilderState>()(
  immer((set, get) => ({
    form: emptyForm,
    sections: [],
    questions: [],
    selectedElement: null,
    rightPanelTab: "properties",
    historyPast: [],
    historyFuture: [],
    isInitialised: false,
    readOnly: false,

    setReadOnly: (readOnly) =>
      set((s) => {
        s.readOnly = readOnly;
      }),

    setRightPanelTab: (tab) =>
      set((s) => {
        s.rightPanelTab = tab;
      }),

    // ── Init ────────────────────────────────────────────
    initFromApi: (apiForm, readOnly = false) =>
      set((s) => {
        const { form, sections, questions } = apiToBuilderState(apiForm);
        s.form = form;
        s.sections = sections;
        s.questions = questions;
        s.historyPast = [];
        s.historyFuture = [];
        s.isInitialised = true;
        s.selectedElement = null;
        s.readOnly = readOnly;
      }),

    // ── Form ────────────────────────────────────────────
    updateForm: (patch) =>
      set((s) => {
        if (s.readOnly) return;
        Object.assign(s.form, patch);
      }),

    // ── Sections ────────────────────────────────────────
    addSection: () =>
      set((s) => {
        if (s.readOnly) return;
        const id = uid();
        s.sections.push({
          id,
          formId: s.form.id,
          title: "Untitled Section",
          description: "",
          position: s.sections.length,
        });
        syncSectionPositions(s.sections);
        s.selectedElement = { type: "section", id };
      }),

    updateSection: (id, patch) =>
      set((s) => {
        if (s.readOnly) return;
        const sec = s.sections.find((x) => x.id === id);
        if (sec) Object.assign(sec, patch);
      }),

    deleteSection: (id) =>
      set((s) => {
        if (s.readOnly) return;
        s.sections = s.sections.filter((x) => x.id !== id);
        s.questions = s.questions.filter((q) => q.sectionId !== id);
        syncSectionPositions(s.sections);
        if (s.selectedElement?.id === id) s.selectedElement = null;
      }),

    reorderSections: (fromIndex, toIndex) =>
      set((s) => {
        if (s.readOnly) return;
        if (
          fromIndex === toIndex ||
          fromIndex < 0 ||
          fromIndex >= s.sections.length ||
          toIndex < 0 ||
          toIndex >= s.sections.length
        ) {
          return;
        }
        const [moved] = s.sections.splice(fromIndex, 1);
        s.sections.splice(toIndex, 0, moved);
        syncSectionPositions(s.sections);
      }),

    moveSectionUp: (id) => {
      if (get().readOnly) return;
      const index = get().sections.findIndex((x) => x.id === id);
      if (index > 0) {
        get().reorderSections(index, index - 1);
      }
    },

    moveSectionDown: (id) => {
      if (get().readOnly) return;
      const index = get().sections.findIndex((x) => x.id === id);
      if (index >= 0 && index < get().sections.length - 1) {
        get().reorderSections(index, index + 1);
      }
    },

    // ── Questions ───────────────────────────────────────
    addQuestion: (sectionId, type, atIndex) =>
      set((s) => {
        if (s.readOnly) return;
        const secIndices = s.questions
          .map((q, i) => (q.sectionId === sectionId ? i : -1))
          .filter((i) => i !== -1);

        const insertAt =
          atIndex !== undefined && atIndex < secIndices.length
            ? secIndices[atIndex]
            : secIndices.length > 0
              ? secIndices[secIndices.length - 1] + 1
              : s.questions.length;

        const newQ = defaultQuestion(sectionId, type, atIndex ?? secIndices.length);
        s.questions.splice(insertAt, 0, newQ);
        syncQuestionPositions(s.questions, sectionId);
        s.selectedElement = { type: "question", id: newQ.id };
      }),

    updateQuestion: (id, patch) =>
      set((s) => {
        if (s.readOnly) return;
        const q = s.questions.find((x) => x.id === id);
        if (!q) return;
        Object.assign(q, patch);
      }),

    // Fires on blur of the label input — derives + locks fieldName from the
    // final committed label. Ignored if already locked.
    commitLabel: (id) =>
      set((s) => {
        if (s.readOnly) return;
        const q = s.questions.find((x) => x.id === id);
        if (!q || q.fieldNameLocked) return;
        q.fieldName = makeFieldName(q.label);
        q.fieldNameLocked = true;
      }),

    deleteQuestion: (id) =>
      set((s) => {
        if (s.readOnly) return;
        const q = s.questions.find((x) => x.id === id);
        if (!q) return;
        const { sectionId } = q;
        s.questions = s.questions.filter((x) => x.id !== id);
        syncQuestionPositions(s.questions, sectionId);
        if (s.selectedElement?.id === id) s.selectedElement = null;
      }),

    duplicateQuestion: (id) =>
      set((s) => {
        if (s.readOnly) return;
        const index = s.questions.findIndex((x) => x.id === id);
        if (index === -1) return;
        const q = s.questions[index];
        const snapshot = current(q);
        const newQ: Question = {
          ...snapshot,
          id: uid(),
          fieldName: `${snapshot.fieldName}_copy`,
          // Copy has a defined fieldName — lock it immediately
          fieldNameLocked: true,
          position: 0,
          options: snapshot.options.map((o) => ({ ...o, id: uid() })),
        };
        s.questions.splice(index + 1, 0, newQ);
        syncQuestionPositions(s.questions, q.sectionId);
        s.selectedElement = { type: "question", id: newQ.id };
      }),

    reorderQuestions: (sectionId, fromIndex, toIndex) =>
      set((s) => {
        if (s.readOnly) return;
        const secIndices = s.questions
          .map((q, i) => (q.sectionId === sectionId ? i : -1))
          .filter((i) => i !== -1);

        if (
          fromIndex < 0 ||
          fromIndex >= secIndices.length ||
          toIndex < 0 ||
          toIndex >= secIndices.length ||
          fromIndex === toIndex
        ) {
          return;
        }

        const globalFrom = secIndices[fromIndex];
        const [moved] = s.questions.splice(globalFrom, 1);

        const newSecIndices = s.questions
          .map((q, i) => (q.sectionId === sectionId ? i : -1))
          .filter((i) => i !== -1);

        const globalTo =
          toIndex < newSecIndices.length
            ? newSecIndices[toIndex]
            : newSecIndices.length > 0
              ? newSecIndices[newSecIndices.length - 1] + 1
              : s.questions.length;

        s.questions.splice(globalTo, 0, moved);
        syncQuestionPositions(s.questions, sectionId);
      }),

    moveQuestionUp: (id) => {
      if (get().readOnly) return;
      const q = get().questions.find((x) => x.id === id);
      if (!q) return;
      const secQuestions = get().questions.filter((x) => x.sectionId === q.sectionId);
      const index = secQuestions.findIndex((x) => x.id === id);
      if (index > 0) {
        get().reorderQuestions(q.sectionId, index, index - 1);
      }
    },

    moveQuestionDown: (id) => {
      if (get().readOnly) return;
      const q = get().questions.find((x) => x.id === id);
      if (!q) return;
      const secQuestions = get().questions.filter((x) => x.sectionId === q.sectionId);
      const index = secQuestions.findIndex((x) => x.id === id);
      if (index >= 0 && index < secQuestions.length - 1) {
        get().reorderQuestions(q.sectionId, index, index + 1);
      }
    },

    moveQuestion: (questionId, toSectionId, toIndex) =>
      set((s) => {
        if (s.readOnly) return;
        const fromIndex = s.questions.findIndex((x) => x.id === questionId);
        if (fromIndex === -1) return;
        const [moved] = s.questions.splice(fromIndex, 1);
        const oldSectionId = moved.sectionId;
        moved.sectionId = toSectionId;

        const toSecIndices = s.questions
          .map((q, i) => (q.sectionId === toSectionId ? i : -1))
          .filter((i) => i !== -1);

        const insertAt =
          toIndex < toSecIndices.length
            ? toSecIndices[toIndex]
            : toSecIndices.length > 0
              ? toSecIndices[toSecIndices.length - 1] + 1
              : s.questions.length;

        s.questions.splice(insertAt, 0, moved);
        syncQuestionPositions(s.questions, oldSectionId);
        if (oldSectionId !== toSectionId) {
          syncQuestionPositions(s.questions, toSectionId);
        }
      }),

    selectElement: (el) =>
      set((s) => {
        s.selectedElement = el;
        if (el && s.rightPanelTab !== "grizzy") {
          s.rightPanelTab = "properties";
        }
      }),

    // ── Options ─────────────────────────────────────────
    addOption: (questionId) =>
      set((s) => {
        if (s.readOnly) return;
        const q = s.questions.find((x) => x.id === questionId);
        if (!q) return;
        q.options.push({ id: uid(), label: `Option ${q.options.length + 1}` });
      }),

    updateOption: (questionId, optionId, label) =>
      set((s) => {
        if (s.readOnly) return;
        const q = s.questions.find((x) => x.id === questionId);
        const opt = q?.options.find((o) => o.id === optionId);
        if (opt) opt.label = label;
      }),

    deleteOption: (questionId, optionId) =>
      set((s) => {
        if (s.readOnly) return;
        const q = s.questions.find((x) => x.id === questionId);
        if (q) q.options = q.options.filter((o) => o.id !== optionId);
      }),

    reorderOptions: (questionId, fromIndex, toIndex) =>
      set((s) => {
        if (s.readOnly) return;
        const q = s.questions.find((x) => x.id === questionId);
        if (!q) return;
        const [moved] = q.options.splice(fromIndex, 1);
        q.options.splice(toIndex, 0, moved);
      }),

    // ── Validation ──────────────────────────────────────
    updateValidation: (questionId, patch) =>
      set((s) => {
        if (s.readOnly) return;
        const q = s.questions.find((x) => x.id === questionId);
        if (q) {
          q.validation = { ...(q.validation || {}), ...patch };
        }
      }),

    // ── History & Snapshots ─────────────────────────────
    getSnapshot: () => createSnapshot(get()),

    pushHistory: () =>
      set((s) => {
        if (s.readOnly) return;
        const snap = createSnapshot(s);
        s.historyPast.push(snap);
        if (s.historyPast.length > 30) {
          s.historyPast.shift();
        }
        s.historyFuture = [];
      }),

    restoreSnapshot: (snapshot) =>
      set((s) => {
        if (s.readOnly) return;
        Object.assign(s.form, snapshot.form);
        s.sections = snapshot.sections.map((sec) => ({ ...sec }));
        s.questions = snapshot.questions.map((q) => ({
          ...q,
          options: q.options.map((opt) => ({ ...opt })),
          validation: { ...(q.validation || {}) },
        }));
        s.selectedElement = null;
      }),

    undo: () => {
      if (get().readOnly) return;
      const { historyPast } = get();
      if (historyPast.length === 0) return;
      const currentSnap = createSnapshot(get());
      const previousSnap = historyPast[historyPast.length - 1];
      set((s) => {
        s.historyPast.pop();
        s.historyFuture.push(currentSnap);
        Object.assign(s.form, previousSnap.form);
        s.sections = previousSnap.sections.map((sec) => ({ ...sec }));
        s.questions = previousSnap.questions.map((q) => ({
          ...q,
          options: q.options.map((opt) => ({ ...opt })),
          validation: { ...(q.validation || {}) },
        }));
        s.selectedElement = null;
      });
    },

    redo: () => {
      if (get().readOnly) return;
      const { historyFuture } = get();
      if (historyFuture.length === 0) return;
      const currentSnap = createSnapshot(get());
      const nextSnap = historyFuture[historyFuture.length - 1];
      set((s) => {
        s.historyFuture.pop();
        s.historyPast.push(currentSnap);
        Object.assign(s.form, nextSnap.form);
        s.sections = nextSnap.sections.map((sec) => ({ ...sec }));
        s.questions = nextSnap.questions.map((q) => ({
          ...q,
          options: q.options.map((opt) => ({ ...opt })),
          validation: { ...(q.validation || {}) },
        }));
        s.selectedElement = null;
      });
    },

    canUndo: () => get().historyPast.length > 0,
    canRedo: () => get().historyFuture.length > 0,
  })),
);

/**
 * Derived hook: resolves the active form theme from the builder store.
 *
 * Uses a fine-grained Zustand selector so consumers only re-render when
 * `form.themeId` or the system color scheme changes — not on every
 * unrelated form / question mutation.
 *
 * The `mounted` guard is required because next-themes reads localStorage
 * inside a useEffect, meaning `resolvedTheme` is `undefined` on the first
 * paint. Without the guard, dark-mode users see light theme after a refresh
 * until next-themes fires its effect. Once mounted, the correct value is
 * used and the canvas re-renders automatically.
 */
export function useBuilderTheme(): FormThemeResolved {
  const themeId = useBuilderStore((s) => s.form.themeId);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  return getFormTheme(themeId || "nova", mounted && resolvedTheme === "dark");
}
