"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useBuilderStore } from "@/store/builder-store";
import type { QuestionType } from "@/types/builder";
import { FieldRow, InspectorSection } from "./inspector-primitives";
import { OptionsEditor } from "./options-editor";
import { ValidationEditor } from "./validation-editor";

import { QUESTION_TYPES } from "@/lib/question-registry";
export { QUESTION_TYPES };

// --------------------------------------------------------
// Question properties component
// --------------------------------------------------------

export function QuestionProperties({ questionId }: { questionId: string }) {
  const {
    questions,
    updateQuestion,
    commitLabel,
    deleteQuestion,
    duplicateQuestion,
    selectElement,
  } = useBuilderStore();
  const question = questions.find((q) => q.id === questionId);
  if (!question) return null;

  const isChoiceType =
    question.type === "select" ||
    question.type === "multi_select" ||
    question.type === "radio" ||
    question.type === "checkbox";

  const isDisplayOnly = question.type === "heading";
  const hasValidation = !isDisplayOnly;

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* ── Identity ──────────────────────────────────── */}
      <InspectorSection title="Question">
        <FieldRow label="Type" htmlFor="q-type">
          <Select
            value={question.type}
            onValueChange={(v) => updateQuestion(question.id, { type: v as QuestionType })}
          >
            <SelectTrigger id="q-type" className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUESTION_TYPES.map(({ value, label }) => (
                <SelectItem key={value} value={value} className="text-sm">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>

        <FieldRow label="Label" htmlFor="q-label">
          <Input
            id="q-label"
            value={question.label}
            onChange={(e) => updateQuestion(question.id, { label: e.target.value })}
            onBlur={() => commitLabel(question.id)}
            placeholder="Question label"
            className="h-9 text-sm"
          />
        </FieldRow>

        {!isDisplayOnly && (
          <FieldRow label="Field key" htmlFor="q-fieldname">
            <div
              id="q-fieldname"
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5",
                "font-mono text-xs text-muted-foreground select-all",
                question.fieldNameLocked
                  ? "border-border/60 bg-muted/40 cursor-default"
                  : "border-dashed border-border/50 bg-muted/20 cursor-default",
              )}
              title={
                question.fieldNameLocked
                  ? "Field key is locked — set on first label edit"
                  : "Will lock automatically when you set the label"
              }
            >
              <span className="flex-1 truncate">{question.fieldName}</span>
              {question.fieldNameLocked ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  className="size-3 shrink-0 text-muted-foreground/50"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M11.5 6V4.5a3.5 3.5 0 1 0-7 0V6H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-1.5ZM5.5 4.5a2.5 2.5 0 0 1 5 0V6h-5V4.5Z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 16 16"
                  className="size-3 shrink-0 text-amber-400/70"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M11.5 4.5a2.5 2.5 0 0 1 2.496 2.37L14 7v-.5a.5.5 0 0 1 .992-.09L15 6.5V7h.5a1 1 0 0 1 .993.883L16.5 8v6a1 1 0 0 1-.883.993L15.5 15H7a1 1 0 0 1-.993-.883L6 14V8a1 1 0 0 1 .883-.993L7 7h.5V6.5a3.5 3.5 0 0 1 3.334-3.496L11.5 3a3.5 3.5 0 0 1 3.496 3.334L15 6.5V7h-1v-.5a2.5 2.5 0 0 0-4.995-.164L9 6.5V7h2V6.5a.5.5 0 1 1 1 0V7H9V6.5a2.5 2.5 0 0 1 2.5-2.5ZM4.5 1a3.5 3.5 0 0 1 3.48 3.088.5.5 0 0 1-.98.158A2.5 2.5 0 0 0 2 4.5V7H3.5a.5.5 0 0 1 0 1H1a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h3.5Z" />
                </svg>
              )}
            </div>
          </FieldRow>
        )}
      </InspectorSection>

      <Separator />

      {/* ── Appearance ────────────────────────────────── */}
      <InspectorSection title="Appearance">
        <FieldRow label="Description" htmlFor="q-desc">
          <textarea
            id="q-desc"
            value={question.description}
            onChange={(e) =>
              updateQuestion(question.id, { description: e.target.value })
            }
            placeholder="Help text / description"
            rows={2}
            className={cn(
              "resize-none rounded-md border border-input bg-background px-3 py-2",
              "text-sm text-foreground placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            )}
          />
        </FieldRow>

        {!isDisplayOnly && (
          <FieldRow label="Placeholder" htmlFor="q-placeholder">
            <Input
              id="q-placeholder"
              value={question.placeholder}
              onChange={(e) =>
                updateQuestion(question.id, { placeholder: e.target.value })
              }
              placeholder="Placeholder text"
              className="h-9 text-sm"
            />
          </FieldRow>
        )}
      </InspectorSection>

      {/* ── Settings ──────────────────────────────────── */}
      {!isDisplayOnly && (
        <>
          <Separator />
          <InspectorSection title="Settings">
            <div className="flex items-center justify-between">
              <Label htmlFor="q-required" className="text-sm font-medium">
                Required
              </Label>
              <Switch
                id="q-required"
                checked={question.required}
                onCheckedChange={(v) =>
                  updateQuestion(question.id, { required: v })
                }
              />
            </div>
          </InspectorSection>
        </>
      )}

      {/* ── Options (choice types) ─────────────────────── */}
      {isChoiceType && (
        <>
          <Separator />
          <InspectorSection title="Options">
            <OptionsEditor question={question} />
          </InspectorSection>
        </>
      )}

      {/* ── Validation ────────────────────────────────── */}
      {hasValidation && (
        <>
          <Separator />
          <InspectorSection title="Validation">
            <ValidationEditor question={question} />
          </InspectorSection>
        </>
      )}

      <Separator />

      {/* ── Actions ───────────────────────────────────── */}
      <InspectorSection title="Actions">
        <div className="flex flex-col gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2 text-sm"
            onClick={() => duplicateQuestion(question.id)}
          >
            <Plus className="size-4" />
            Duplicate question
          </Button>
          <Button
            variant="destructive"
            size="sm"
            className="w-full justify-start gap-2 text-sm"
            onClick={() => {
              deleteQuestion(question.id);
              selectElement(null);
            }}
          >
            <Trash2 className="size-4" />
            Delete question
          </Button>
        </div>
      </InspectorSection>
    </div>
  );
}
