// DnD item type constants — single source of truth
// Used by both drag sources and drop targets

export const DND_TYPES = {
  /** A component dragged from the palette into the canvas */
  PALETTE_COMPONENT: "PALETTE_COMPONENT",
  /** An existing question card being reordered or moved */
  QUESTION_CARD: "QUESTION_CARD",
  /** A section being reordered */
  SECTION: "SECTION",
} as const;

// ── Drag item payloads ──────────────────────────────────────────────────

export interface PaletteDragItem {
  type: typeof DND_TYPES.PALETTE_COMPONENT;
  questionType: string;
}

export interface QuestionDragItem {
  type: typeof DND_TYPES.QUESTION_CARD;
  questionId: string;
  sectionId: string;
  index: number;
}

export interface SectionDragItem {
  type: typeof DND_TYPES.SECTION;
  sectionId: string;
  index: number;
}
