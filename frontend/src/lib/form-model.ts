import type { ApiQuestion } from "@/lib/api/forms";
import type {
  Question,
  QuestionOption,
  QuestionType,
  QuestionValidation,
} from "@/types/builder";

export function parseJsonValue<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== "string") return value as T;

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function apiQuestionToClientQuestion(
  question: ApiQuestion,
  fieldNameLocked = true,
): Question {
  return {
    id: question.id,
    sectionId: question.sectionId,
    type: question.type as QuestionType,
    fieldName: question.fieldName,
    fieldNameLocked,
    label: question.label,
    description: question.description ?? "",
    placeholder: question.placeholder ?? "",
    required: question.isRequired,
    position: question.position,
    options: parseJsonValue<QuestionOption[]>(question.options, []),
    validation: parseJsonValue<QuestionValidation>(question.validation, {}),
  };
}
