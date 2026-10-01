import * as XLSX from "xlsx";
import { format } from "date-fns";
import { toast } from "sonner";
import type { FormWithSections, ApiQuestion } from "@/lib/api/forms";
import type { FormResponse } from "@/lib/api/responses";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 50);
}

function getAnswerableQuestions(form: FormWithSections): ApiQuestion[] {
  // Sort sections by position, then questions by position
  const sortedSections = [...(form.sections || [])].sort((a, b) => a.position - b.position);
  const questions: ApiQuestion[] = [];

  sortedSections.forEach((sec) => {
    const sortedQuestions = [...(sec.questions || [])].sort((a, b) => a.position - b.position);
    sortedQuestions.forEach((q) => {
      if (q.type !== "heading") {
        questions.push(q);
      }
    });
  });

  return questions;
}

function formatAnswerValue(val: unknown): string | number | boolean {
  if (val === null || val === undefined) return "";
  if (Array.isArray(val)) {
    return val.map((v) => (typeof v === "object" ? JSON.stringify(v) : String(v))).join(", ");
  }
  if (typeof val === "object") {
    return JSON.stringify(val);
  }
  if (typeof val === "number" || typeof val === "boolean") {
    return val;
  }
  return String(val);
}

/**
 * Builds Google Sheets style table data where:
 * - Column 1 is "Timestamp"
 * - Column 2..N are every question's title/label as the column header
 * - Rows are the answers submitted by each respondent
 */
export function buildGoogleSheetsRows(form: FormWithSections, responses: FormResponse[]) {
  const questions = getAnswerableQuestions(form);

  // Map questions to unique headers in order
  const seenHeaders = new Map<string, number>();
  const headerKeys: { key: string; question: ApiQuestion }[] = questions.map((q) => {
    let header = (q.label?.trim() || q.fieldName).trim();
    const count = seenHeaders.get(header) || 0;
    seenHeaders.set(header, count + 1);
    if (count > 0) {
      header = `${header} (${count + 1})`;
    }
    return { key: header, question: q };
  });

  const headers = ["Timestamp", ...headerKeys.map((h) => h.key)];

  const rows = responses.map((r) => {
    const rowObj: Record<string, any> = {};

    // Timestamp column (Google Forms standard)
    const date = r.submittedAt ? new Date(r.submittedAt) : new Date();
    rowObj["Timestamp"] = format(date, "yyyy-MM-dd HH:mm:ss");

    // Question columns
    headerKeys.forEach(({ key, question }) => {
      const match = r.answers?.find(
        (a) => a.questionId === question.id || a.fieldName === question.fieldName
      );
      rowObj[key] = match ? formatAnswerValue(match.value) : "";
    });

    return rowObj;
  });

  return { headers, rows };
}

// ---------------------------------------------------------------------------
// Export Handlers (powered by XLSX / SheetJS)
// ---------------------------------------------------------------------------

/**
 * Exports responses as CSV in Google Sheets format (Questions as column headers, values as rows)
 */
export function exportFormAsCsv(form: FormWithSections, responses: FormResponse[]) {
  if (!responses || responses.length === 0) {
    toast.error("No responses available to export");
    return;
  }

  const { headers, rows } = buildGoogleSheetsRows(form, responses);

  // Create worksheet with explicit header order
  const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });

  // Compute column auto-widths based on header and content lengths
  worksheet["!cols"] = headers.map((header) => {
    const maxContentLen = rows.reduce(
      (max, row) => Math.max(max, String(row[header] ?? "").length),
      header.length
    );
    return { wch: Math.min(Math.max(maxContentLen + 2, 12), 60) };
  });

  // Create workbook and write CSV file
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Form Responses");

  const filename = `${sanitizeFilename(form.slug || form.title || "form")}-responses-${format(
    new Date(),
    "yyyy-MM-dd"
  )}.csv`;

  XLSX.writeFile(workbook, filename, { bookType: "csv" });
  toast.success(`Exported ${responses.length} responses to CSV`);
}

/**
 * Exports responses as JSON in Google Sheets format (Questions as object keys, values as rows)
 */
export function exportFormAsJson(form: FormWithSections, responses: FormResponse[]) {
  if (!responses || responses.length === 0) {
    toast.error("No responses available to export");
    return;
  }

  const { rows } = buildGoogleSheetsRows(form, responses);

  const jsonString = JSON.stringify(rows, null, 2);
  const blob = new Blob([jsonString], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sanitizeFilename(form.slug || form.title || "form")}-responses-${format(
    new Date(),
    "yyyy-MM-dd"
  )}.json`;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  toast.success(`Exported ${responses.length} responses to JSON`);
}
