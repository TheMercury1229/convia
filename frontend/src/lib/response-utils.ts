import type { FormResponse } from "@/lib/api/responses";

export function isAnswered(value: unknown): boolean {
  return (
    value !== null &&
    value !== undefined &&
    value !== "" &&
    !(Array.isArray(value) && value.length === 0)
  );
}

export function getResponseCompletionRate(
  response: FormResponse,
  answerableQuestionCount: number,
): number {
  if (typeof response.completionRate === "number") {
    return response.completionRate;
  }

  if (answerableQuestionCount === 0) return 100;

  const answeredCount = (response.answers ?? []).filter((answer) =>
    isAnswered(answer.value),
  ).length;

  return Math.min(
    100,
    Math.round((answeredCount / answerableQuestionCount) * 100),
  );
}

export function getResponseDisplayName(response: FormResponse): string {
  const firstTextAnswer = response.answers?.find(
    (answer) =>
      typeof answer.value === "string" && answer.value.trim().length > 0,
  )?.value;

  const emailAnswer = response.answers?.find(
    (answer) =>
      answer.fieldName.toLowerCase().includes("email") ||
      (typeof answer.value === "string" && answer.value.includes("@")),
  )?.value;

  return (
    (typeof emailAnswer === "string" && emailAnswer) ||
    (typeof firstTextAnswer === "string" && firstTextAnswer) ||
    "Anonymous Respondent"
  );
}
