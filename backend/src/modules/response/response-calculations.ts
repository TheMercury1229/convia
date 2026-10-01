export function isAnsweredValue(value: unknown): boolean {
  return (
    value !== null &&
    value !== undefined &&
    value !== "" &&
    !(Array.isArray(value) && value.length === 0)
  );
}

export function calculateCompletionRate(
  answeredCount: number,
  totalAnswerable: number,
): number {
  if (totalAnswerable === 0) return 100;
  return Math.min(100, Math.round((answeredCount / totalAnswerable) * 100));
}
