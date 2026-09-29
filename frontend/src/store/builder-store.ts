import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { current } from "immer";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { getFormTheme, type FormThemeResolved } from "@/lib/builder-themes";
import { seedForm, seedSections, seedQuestions } from "@/lib/builder-seed";
import { getTypeLabel } from "@/lib/question-registry";
import type {
  BuilderForm,
  Question,
  QuestionOption,
  QuestionType,
  QuestionValidation,
  Section,
  SelectedElement,
} from "@/types/builder";

// --------------------------------------------------------
// Helpers
// --------------------------------------------------------

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

// --------------------------------------------------------
// Store state & actions
// --------------------------------------------------------

interface BuilderState {
  form: BuilderForm;
  sections: Section[];
  questions: Question[];
  selectedElement: SelectedElement | null;
  rightPanelTab: "properties" | "settings";
  setRightPanelTab(tab: "properties" | "settings"): void;

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
}

export const useBuilderStore = create<BuilderState>()(
  immer((set, get) => ({
    form: seedForm,
    sections: seedSections,
    questions: seedQuestions,
    selectedElement: null,
    rightPanelTab: "properties",
    setRightPanelTab: (tab) =>
      set((s) => {
        s.rightPanelTab = tab;
      }),

    // ── Form ────────────────────────────────────────────
    updateForm: (patch) =>
      set((s) => {
        Object.assign(s.form, patch);
      }),

    // ── Sections ────────────────────────────────────────
    addSection: () =>
      set((s) => {
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
        const sec = s.sections.find((x) => x.id === id);
        if (sec) Object.assign(sec, patch);
      }),

    deleteSection: (id) =>
      set((s) => {
        s.sections = s.sections.filter((x) => x.id !== id);
        s.questions = s.questions.filter((q) => q.sectionId !== id);
        syncSectionPositions(s.sections);
        if (s.selectedElement?.id === id) s.selectedElement = null;
      }),

    reorderSections: (fromIndex, toIndex) =>
      set((s) => {
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
      const index = get().sections.findIndex((x) => x.id === id);
      if (index > 0) {
        get().reorderSections(index, index - 1);
      }
    },

    moveSectionDown: (id) => {
      const index = get().sections.findIndex((x) => x.id === id);
      if (index >= 0 && index < get().sections.length - 1) {
        get().reorderSections(index, index + 1);
      }
    },

    // ── Questions ───────────────────────────────────────
    addQuestion: (sectionId, type, atIndex) =>
      set((s) => {
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
        const q = s.questions.find((x) => x.id === id);
        if (q) Object.assign(q, patch);
      }),

    deleteQuestion: (id) =>
      set((s) => {
        const q = s.questions.find((x) => x.id === id);
        if (!q) return;
        const { sectionId } = q;
        s.questions = s.questions.filter((x) => x.id !== id);
        syncQuestionPositions(s.questions, sectionId);
        if (s.selectedElement?.id === id) s.selectedElement = null;
      }),

    duplicateQuestion: (id) =>
      set((s) => {
        const index = s.questions.findIndex((x) => x.id === id);
        if (index === -1) return;
        const q = s.questions[index];
        const snapshot = current(q);
        const newQ: Question = {
          ...snapshot,
          id: uid(),
          fieldName: `${snapshot.fieldName}_copy`,
          position: 0,
          options: snapshot.options.map((o) => ({ ...o, id: uid() })),
        };
        s.questions.splice(index + 1, 0, newQ);
        syncQuestionPositions(s.questions, q.sectionId);
        s.selectedElement = { type: "question", id: newQ.id };
      }),

    reorderQuestions: (sectionId, fromIndex, toIndex) =>
      set((s) => {
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
      const q = get().questions.find((x) => x.id === id);
      if (!q) return;
      const secQuestions = get().questions.filter((x) => x.sectionId === q.sectionId);
      const index = secQuestions.findIndex((x) => x.id === id);
      if (index > 0) {
        get().reorderQuestions(q.sectionId, index, index - 1);
      }
    },

    moveQuestionDown: (id) => {
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
        if (el) {
          s.rightPanelTab = "properties";
        }
      }),

    // ── Options ─────────────────────────────────────────
    addOption: (questionId) =>
      set((s) => {
        const q = s.questions.find((x) => x.id === questionId);
        if (!q) return;
        q.options.push({ id: uid(), label: `Option ${q.options.length + 1}` });
      }),

    updateOption: (questionId, optionId, label) =>
      set((s) => {
        const q = s.questions.find((x) => x.id === questionId);
        const opt = q?.options.find((o) => o.id === optionId);
        if (opt) opt.label = label;
      }),

    deleteOption: (questionId, optionId) =>
      set((s) => {
        const q = s.questions.find((x) => x.id === questionId);
        if (q) q.options = q.options.filter((o) => o.id !== optionId);
      }),

    reorderOptions: (questionId, fromIndex, toIndex) =>
      set((s) => {
        const q = s.questions.find((x) => x.id === questionId);
        if (!q) return;
        const [moved] = q.options.splice(fromIndex, 1);
        q.options.splice(toIndex, 0, moved);
      }),

    // ── Validation ──────────────────────────────────────
    updateValidation: (questionId, patch) =>
      set((s) => {
        const q = s.questions.find((x) => x.id === questionId);
        if (q) Object.assign(q.validation, patch);
      }),
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
