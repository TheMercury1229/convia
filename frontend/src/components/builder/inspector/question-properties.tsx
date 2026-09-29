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
            placeholder="Question label"
            className="h-9 text-sm"
          />
        </FieldRow>

        {!isDisplayOnly && (
          <FieldRow label="Field name" htmlFor="q-fieldname">
            <Input
              id="q-fieldname"
              value={question.fieldName}
              onChange={(e) =>
                updateQuestion(question.id, { fieldName: e.target.value })
              }
              placeholder="field_name"
              className="h-9 font-mono text-sm"
            />
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
