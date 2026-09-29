import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
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
  const label = typeLabel(type);
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

function typeLabel(type: QuestionType): string {
  const map: Record<QuestionType, string> = {
    heading: "Heading",
    paragraph: "Paragraph",
    text: "Short Text",
    textarea: "Long Text",
    email: "Email",
    number: "Number",
    phone: "Phone",
    date: "Date",
    time: "Time",
    datetime: "Date & Time",
    select: "Dropdown",
    multi_select: "Multi Select",
    radio: "Single Choice",
    checkbox: "Multiple Choice",
    yes_no: "Yes / No",
    rating: "Rating",
    scale: "Opinion Scale",
    file: "File Upload",
    url: "Website / URL",
  };
  return map[type] ?? type;
}

// --------------------------------------------------------
// Demo seed data
// --------------------------------------------------------

const FORM_ID = "form-demo";
const SEC_1 = "sec-personal";
const SEC_2 = "sec-education";
const SEC_3 = "sec-experience";

const seedForm: BuilderForm = {
  id: FORM_ID,
  title: "Job Application Form",
  slug: "job-application-form",
  description: "Tell us about yourself so we can get to know you better.",
  deadline: null,
  themeId: "nova",
  themeColor: "indigo",
  fontFamily: "sans",
};

const seedSections: Section[] = [
  {
    id: SEC_1,
    formId: FORM_ID,
    title: "Personal Information",
    description: "Tell us the basics about yourself.",
    position: 0,
  },
  {
    id: SEC_2,
    formId: FORM_ID,
    title: "Education",
    description: "Share your educational background.",
    position: 1,
  },
  {
    id: SEC_3,
    formId: FORM_ID,
    title: "Work Experience",
    description: "Tell us about your past roles.",
    position: 2,
  },
];

const seedQuestions: Question[] = [
  {
    id: "q-fullname",
    sectionId: SEC_1,
    type: "text",
    fieldName: "full_name",
    label: "Full Name",
    description: "",
    placeholder: "Enter your full name",
    required: true,
    position: 0,
    options: [],
    validation: {},
  },
  {
    id: "q-email",
    sectionId: SEC_1,
    type: "email",
    fieldName: "email",
    label: "Email Address",
    description: "We'll use this to contact you.",
    placeholder: "you@example.com",
    required: true,
    position: 1,
    options: [],
    validation: {},
  },
  {
    id: "q-phone",
    sectionId: SEC_1,
    type: "phone",
    fieldName: "phone",
    label: "Phone Number",
    description: "",
    placeholder: "+91 98765 43210",
    required: false,
    position: 2,
    options: [],
    validation: {},
  },
  {
    id: "q-university",
    sectionId: SEC_2,
    type: "text",
    fieldName: "university",
    label: "University / College",
    description: "",
    placeholder: "e.g. IIT Bombay",
    required: true,
    position: 0,
    options: [],
    validation: {},
  },
  {
    id: "q-degree",
    sectionId: SEC_2,
    type: "select",
    fieldName: "degree",
    label: "Degree",
    description: "",
    placeholder: "Select degree",
    required: true,
    position: 1,
    options: [
      { id: uid(), label: "Bachelor's" },
      { id: uid(), label: "Master's" },
      { id: uid(), label: "PhD" },
      { id: uid(), label: "Diploma" },
    ],
    validation: {},
  },
  {
    id: "q-grad-year",
    sectionId: SEC_2,
    type: "number",
    fieldName: "graduation_year",
    label: "Graduation Year",
    description: "",
    placeholder: "e.g. 2022",
    required: false,
    position: 2,
    options: [],
    validation: { min: 1950, max: 2030 },
  },
  {
    id: "q-company",
    sectionId: SEC_3,
    type: "text",
    fieldName: "current_company",
    label: "Current / Last Company",
    description: "",
    placeholder: "Company name",
    required: false,
    position: 0,
    options: [],
    validation: {},
  },
  {
    id: "q-role",
    sectionId: SEC_3,
    type: "text",
    fieldName: "role",
    label: "Job Title",
    description: "",
    placeholder: "e.g. Senior Engineer",
    required: false,
    position: 1,
    options: [],
    validation: {},
  },
  {
    id: "q-cover",
    sectionId: SEC_3,
    type: "textarea",
    fieldName: "cover_letter",
    label: "Cover Letter",
    description: "Tell us why you'd be a great fit.",
    placeholder: "Write your cover letter here…",
    required: true,
    position: 2,
    options: [],
    validation: { maxLength: 2000 },
  },
];

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
  immer((set) => ({
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
        const position = s.sections.length;
        const id = uid();
        s.sections.push({
          id,
          formId: s.form.id,
          title: "Untitled Section",
          description: "",
          position,
        });
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
        if (s.selectedElement?.id === id) s.selectedElement = null;
        // Re-normalise positions
        s.sections.forEach((sec, i) => (sec.position = i));
      }),

    reorderSections: (fromIndex, toIndex) =>
      set((s) => {
        // Sort by current position first so array order matches position
        s.sections.sort((a, b) => a.position - b.position);
        const [moved] = s.sections.splice(fromIndex, 1);
        // After removing, if toIndex is past fromIndex the array shifted left
        const insertAt = toIndex > fromIndex ? toIndex - 1 : toIndex;
        s.sections.splice(insertAt, 0, moved);
        s.sections.forEach((sec, i) => (sec.position = i));
      }),

    moveSectionUp: (id) =>
      set((s) => {
        s.sections.sort((a, b) => a.position - b.position);
        const index = s.sections.findIndex((x) => x.id === id);
        if (index <= 0) return;
        const temp = s.sections[index];
        s.sections[index] = s.sections[index - 1];
        s.sections[index - 1] = temp;
        s.sections.forEach((sec, i) => (sec.position = i));
      }),

    moveSectionDown: (id) =>
      set((s) => {
        s.sections.sort((a, b) => a.position - b.position);
        const index = s.sections.findIndex((x) => x.id === id);
        if (index === -1 || index >= s.sections.length - 1) return;
        const temp = s.sections[index];
        s.sections[index] = s.sections[index + 1];
        s.sections[index + 1] = temp;
        s.sections.forEach((sec, i) => (sec.position = i));
      }),

    // ── Questions ───────────────────────────────────────
    addQuestion: (sectionId, type, atIndex) =>
      set((s) => {
        const existing = s.questions
          .filter((q) => q.sectionId === sectionId)
          .sort((a, b) => a.position - b.position);
        const position = atIndex ?? existing.length;
        // Shift positions of questions that come after
        s.questions
          .filter((q) => q.sectionId === sectionId && q.position >= position)
          .forEach((q) => (q.position += 1));
        const newQ = defaultQuestion(sectionId, type, position);
        s.questions.push(newQ);
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
        const { sectionId, position } = q;
        s.questions = s.questions.filter((x) => x.id !== id);
        // Re-normalise positions in same section
        s.questions
          .filter((x) => x.sectionId === sectionId && x.position > position)
          .forEach((x) => (x.position -= 1));
        if (s.selectedElement?.id === id) s.selectedElement = null;
      }),

    duplicateQuestion: (id) =>
      set((s) => {
        const q = s.questions.find((x) => x.id === id);
        if (!q) return;
        const position = q.position + 1;
        // Shift questions after this one
        s.questions
          .filter((x) => x.sectionId === q.sectionId && x.position >= position)
          .forEach((x) => (x.position += 1));
        const newQ: Question = {
          ...JSON.parse(JSON.stringify(q)),
          id: uid(),
          fieldName: q.fieldName + "_copy",
          position,
          options: q.options.map((o) => ({ ...o, id: uid() })),
        };
        s.questions.push(newQ);
        s.selectedElement = { type: "question", id: newQ.id };
      }),

    reorderQuestions: (sectionId, fromIndex, toIndex) =>
      set((s) => {
        const qs = s.questions
          .filter((q) => q.sectionId === sectionId)
          .sort((a, b) => a.position - b.position);
        const [moved] = qs.splice(fromIndex, 1);
        // After removing, if toIndex is past fromIndex the array shifted left
        const insertAt = toIndex > fromIndex ? toIndex - 1 : toIndex;
        qs.splice(insertAt, 0, moved);
        qs.forEach((q, i) => (q.position = i));
      }),

    moveQuestionUp: (id) =>
      set((s) => {
        const q = s.questions.find((x) => x.id === id);
        if (!q) return;
        const qs = s.questions
          .filter((x) => x.sectionId === q.sectionId)
          .sort((a, b) => a.position - b.position);
        const index = qs.findIndex((x) => x.id === id);
        if (index <= 0) return;
        const temp = qs[index];
        qs[index] = qs[index - 1];
        qs[index - 1] = temp;
        qs.forEach((item, i) => (item.position = i));
      }),

    moveQuestionDown: (id) =>
      set((s) => {
        const q = s.questions.find((x) => x.id === id);
        if (!q) return;
        const qs = s.questions
          .filter((x) => x.sectionId === q.sectionId)
          .sort((a, b) => a.position - b.position);
        const index = qs.findIndex((x) => x.id === id);
        if (index === -1 || index >= qs.length - 1) return;
        const temp = qs[index];
        qs[index] = qs[index + 1];
        qs[index + 1] = temp;
        qs.forEach((item, i) => (item.position = i));
      }),

    moveQuestion: (questionId, toSectionId, toIndex) =>
      set((s) => {
        const q = s.questions.find((x) => x.id === questionId);
        if (!q || q.sectionId === toSectionId) return;
        const oldSectionId = q.sectionId;
        // Remove from old section & re-normalise
        s.questions
          .filter((x) => x.sectionId === oldSectionId && x.position > q.position)
          .forEach((x) => (x.position -= 1));
        // Insert into new section
        s.questions
          .filter((x) => x.sectionId === toSectionId && x.position >= toIndex)
          .forEach((x) => (x.position += 1));
        q.sectionId = toSectionId;
        q.position = toIndex;
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
