import type { Question } from "@/types/builder";

export interface AttachedHeading {
  id: string;
  label: string;
  description?: string | null;
}

export interface FlatQuestionItem {
  question: Question;
  sectionTitle?: string | null;
  sectionDescription?: string | null;
  questionIndex: number;
  sectionIndex: number;
  isFirstQuestionOfSection: boolean;
  totalQuestions: number;
  totalSections: number;
  attachedHeadings?: AttachedHeading[];
}
