"use client";

import * as React from "react";
import {
  Plus,
  Trash2,
  GripVertical,
  AlertCircle,
  Settings2,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
import { useBuilderStore } from "@/store/builder-store";
import type { Question, QuestionType } from "@/types/builder";
import { FormSettingsPanel } from "./form-settings-panel";

// --------------------------------------------------------
// Reusable field row
// --------------------------------------------------------

function FieldRow({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor} className="text-sm font-medium text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

// --------------------------------------------------------
// Section heading inside inspector
// --------------------------------------------------------

function InspectorSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
        {title}
      </p>
      {children}
    </div>
  );
}

// --------------------------------------------------------
// Form properties
// --------------------------------------------------------

function FormProperties() {
  const { form, updateForm, setRightPanelTab } = useBuilderStore();
  return (
    <div className="flex flex-col gap-4 p-4">
      <InspectorSection title="Form">
        <FieldRow label="Title" htmlFor="form-title-inspector">
          <Input
            id="form-title-inspector"
            value={form.title}
            onChange={(e) => updateForm({ title: e.target.value })}
            placeholder="Form title"
            className="h-9 text-sm"
          />
        </FieldRow>
        <FieldRow label="Description" htmlFor="form-desc-inspector">
          <textarea
            id="form-desc-inspector"
            value={form.description}
            onChange={(e) => updateForm({ description: e.target.value })}
            placeholder="Form description"
            rows={3}
            className={cn(
              "resize-none rounded-md border border-input bg-background px-3 py-2",
              "text-sm text-foreground placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            )}
          />
        </FieldRow>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setRightPanelTab("settings")}
          className="mt-2 w-full gap-2 text-xs font-medium"
        >
          <Settings2 className="size-3.5" />
          Open Form Settings
        </Button>
      </InspectorSection>
    </div>
  );
}

// --------------------------------------------------------
// Section properties
// --------------------------------------------------------

function SectionProperties({ sectionId }: { sectionId: string }) {
  const { sections, updateSection, deleteSection, selectElement } = useBuilderStore();
  const section = sections.find((s) => s.id === sectionId);
  if (!section) return null;

  return (
    <div className="flex flex-col gap-4 p-4">
      <InspectorSection title="Section">
        <FieldRow label="Title" htmlFor="sec-title">
          <Input
            id="sec-title"
            value={section.title}
            onChange={(e) => updateSection(sectionId, { title: e.target.value })}
            placeholder="Section title"
            className="h-9 text-sm"
          />
        </FieldRow>
        <FieldRow label="Description" htmlFor="sec-desc">
          <textarea
            id="sec-desc"
            value={section.description}
            onChange={(e) => updateSection(sectionId, { description: e.target.value })}
            placeholder="Optional description"
            rows={3}
            className={cn(
              "resize-none rounded-md border border-input bg-background px-3 py-2",
              "text-sm text-foreground placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            )}
          />
        </FieldRow>
      </InspectorSection>

      <Separator />

      <InspectorSection title="Actions">
        <Button
          variant="destructive"
          size="sm"
          className="w-full justify-start gap-2 text-sm"
          onClick={() => {
            deleteSection(sectionId);
            selectElement(null);
          }}
        >
          <Trash2 className="size-4" />
          Delete section
        </Button>
      </InspectorSection>
    </div>
  );
}

// --------------------------------------------------------
// Question type selector options
// --------------------------------------------------------

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "heading", label: "Heading" },
  { value: "paragraph", label: "Paragraph" },
  { value: "text", label: "Short Text" },
  { value: "textarea", label: "Long Text" },
  { value: "number", label: "Number" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "url", label: "Website / URL" },
  { value: "select", label: "Dropdown" },
  { value: "multi_select", label: "Multi Select" },
  { value: "radio", label: "Single Choice" },
  { value: "checkbox", label: "Multiple Choice" },
  { value: "yes_no", label: "Yes / No" },
  { value: "date", label: "Date" },
  { value: "time", label: "Time" },
  { value: "datetime", label: "Date & Time" },
  { value: "rating", label: "Rating" },
  { value: "scale", label: "Opinion Scale" },
  { value: "file", label: "File Upload" },
];

// --------------------------------------------------------
// Options editor (for select/radio/checkbox)
// --------------------------------------------------------

function OptionsEditor({ question }: { question: Question }) {
  const { addOption, updateOption, deleteOption } = useBuilderStore();

  return (
    <div className="flex flex-col gap-2">
      {question.options.map((opt, idx) => (
        <div key={opt.id} className="flex items-center gap-1.5">
          <GripVertical className="size-3.5 text-muted-foreground/40 shrink-0" />
          <Input
            value={opt.label}
            onChange={(e) => updateOption(question.id, opt.id, e.target.value)}
            placeholder={`Option ${idx + 1}`}
            className="h-8 flex-1 text-sm"
          />
          <Button
            variant="ghost"
            size="icon-xs"
            className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
            onClick={() => deleteOption(question.id, opt.id)}
            disabled={question.options.length <= 1}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="w-full justify-start gap-1.5 h-8 text-sm text-muted-foreground"
        onClick={() => addOption(question.id)}
      >
        <Plus className="size-3.5" />
        Add option
      </Button>
    </div>
  );
}

// --------------------------------------------------------
// Validation editor (type-specific)
// --------------------------------------------------------

function ValidationEditor({ question }: { question: Question }) {
  const { updateValidation } = useBuilderStore();
  const { type, validation } = question;

  // 1. Short Text
  if (type === "text") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <FieldRow label="Min length" htmlFor="val-minlen">
            <Input
              id="val-minlen"
              type="number"
              min={0}
              value={validation.minLength ?? ""}
              onChange={(e) =>
                updateValidation(question.id, {
                  minLength: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="0"
              className="h-8 text-sm"
            />
          </FieldRow>
          <FieldRow label="Max length" htmlFor="val-maxlen">
            <Input
              id="val-maxlen"
              type="number"
              min={0}
              value={validation.maxLength ?? ""}
              onChange={(e) =>
                updateValidation(question.id, {
                  maxLength: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="∞"
              className="h-8 text-sm"
            />
          </FieldRow>
        </div>
        <FieldRow label="Pattern (Regex)" htmlFor="val-pattern">
          <Input
            id="val-pattern"
            value={validation.pattern ?? ""}
            onChange={(e) =>
              updateValidation(question.id, {
                pattern: e.target.value || undefined,
              })
            }
            placeholder="^[A-Za-z0-9_-]+$"
            className="h-8 text-sm font-mono"
          />
        </FieldRow>
        <FieldRow label="Custom error message" htmlFor="val-custom-err">
          <Input
            id="val-custom-err"
            value={validation.customError ?? ""}
            onChange={(e) =>
              updateValidation(question.id, {
                customError: e.target.value || undefined,
              })
            }
            placeholder="Please enter a valid format"
            className="h-8 text-sm"
          />
        </FieldRow>
      </div>
    );
  }

  // 2. Long Text / Textarea & Paragraph (Extended Text)
  if (type === "textarea" || type === "paragraph") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <FieldRow label="Min chars" htmlFor="val-ta-minlen">
            <Input
              id="val-ta-minlen"
              type="number"
              min={0}
              value={validation.minLength ?? ""}
              onChange={(e) =>
                updateValidation(question.id, {
                  minLength: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="0"
              className="h-8 text-sm"
            />
          </FieldRow>
          <FieldRow label="Max chars" htmlFor="val-ta-maxlen">
            <Input
              id="val-ta-maxlen"
              type="number"
              min={0}
              value={validation.maxLength ?? ""}
              onChange={(e) =>
                updateValidation(question.id, {
                  maxLength: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="∞"
              className="h-8 text-sm"
            />
          </FieldRow>
        </div>
        <div className="flex gap-2">
          <FieldRow label="Min words" htmlFor="val-minwords">
            <Input
              id="val-minwords"
              type="number"
              min={0}
              value={validation.minWords ?? ""}
              onChange={(e) =>
                updateValidation(question.id, {
                  minWords: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="0"
              className="h-8 text-sm"
            />
          </FieldRow>
          <FieldRow label="Max words" htmlFor="val-maxwords">
            <Input
              id="val-maxwords"
              type="number"
              min={0}
              value={validation.maxWords ?? ""}
              onChange={(e) =>
                updateValidation(question.id, {
                  maxWords: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="∞"
              className="h-8 text-sm"
            />
          </FieldRow>
        </div>
      </div>
    );
  }

  // 3. Number
  if (type === "number") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <FieldRow label="Minimum" htmlFor="val-min">
            <Input
              id="val-min"
              type="number"
              value={validation.min ?? ""}
              onChange={(e) =>
                updateValidation(question.id, {
                  min: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="—"
              className="h-8 text-sm"
            />
          </FieldRow>
          <FieldRow label="Maximum" htmlFor="val-max">
            <Input
              id="val-max"
              type="number"
              value={validation.max ?? ""}
              onChange={(e) =>
                updateValidation(question.id, {
                  max: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="—"
              className="h-8 text-sm"
            />
          </FieldRow>
        </div>
        <FieldRow label="Step increment" htmlFor="val-step">
          <Input
            id="val-step"
            type="number"
            min={0}
            step="any"
            value={validation.step ?? ""}
            onChange={(e) =>
              updateValidation(question.id, {
                step: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="1"
            className="h-8 text-sm"
          />
        </FieldRow>
        <div className="flex items-center justify-between pt-1">
          <Label htmlFor="val-int-only" className="text-sm font-medium">
            Integers only (whole numbers)
          </Label>
          <Switch
            id="val-int-only"
            checked={!!validation.integerOnly}
            onCheckedChange={(v) =>
              updateValidation(question.id, { integerOnly: v })
            }
          />
        </div>
      </div>
    );
  }

  // 4. Email
  if (type === "email") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="val-block-free" className="text-sm font-medium">
              Block personal emails
            </Label>
            <span className="text-xs text-muted-foreground">
              Disallow @gmail, @yahoo, @hotmail, etc.
            </span>
          </div>
          <Switch
            id="val-block-free"
            checked={!!validation.disallowFreeEmails}
            onCheckedChange={(v) =>
              updateValidation(question.id, { disallowFreeEmails: v })
            }
          />
        </div>
        <FieldRow label="Allowed domains" htmlFor="val-email-domains">
          <Input
            id="val-email-domains"
            value={validation.allowedDomains ?? ""}
            onChange={(e) =>
              updateValidation(question.id, {
                allowedDomains: e.target.value || undefined,
              })
            }
            placeholder="company.com, acme.org"
            className="h-8 text-sm"
          />
        </FieldRow>
      </div>
    );
  }

  // 5. Phone
  if (type === "phone") {
    return (
      <div className="flex flex-col gap-3">
        <FieldRow label="Format standard" htmlFor="val-phone-format">
          <Select
            value={validation.phoneFormat ?? "any"}
            onValueChange={(v) =>
              updateValidation(question.id, {
                phoneFormat: v as "any" | "e164" | "us",
              })
            }
          >
            <SelectTrigger id="val-phone-format" className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any" className="text-sm">Any valid phone format</SelectItem>
              <SelectItem value="e164" className="text-sm">International (E.164 with +)</SelectItem>
              <SelectItem value="us" className="text-sm">US / Canada (10 digits)</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
        <div className="flex gap-2">
          <FieldRow label="Min digits" htmlFor="val-phone-min">
            <Input
              id="val-phone-min"
              type="number"
              min={0}
              value={validation.minLength ?? ""}
              onChange={(e) =>
                updateValidation(question.id, {
                  minLength: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="7"
              className="h-8 text-sm"
            />
          </FieldRow>
          <FieldRow label="Max digits" htmlFor="val-phone-max">
            <Input
              id="val-phone-max"
              type="number"
              min={0}
              value={validation.maxLength ?? ""}
              onChange={(e) =>
                updateValidation(question.id, {
                  maxLength: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="15"
              className="h-8 text-sm"
            />
          </FieldRow>
        </div>
      </div>
    );
  }

  // 6. Date
  if (type === "date") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="val-dis-past" className="text-sm font-medium">
            Disable past dates
          </Label>
          <Switch
            id="val-dis-past"
            checked={!!validation.disablePastDates}
            onCheckedChange={(v) =>
              updateValidation(question.id, { disablePastDates: v })
            }
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="val-dis-future" className="text-sm font-medium">
            Disable future dates
          </Label>
          <Switch
            id="val-dis-future"
            checked={!!validation.disableFutureDates}
            onCheckedChange={(v) =>
              updateValidation(question.id, { disableFutureDates: v })
            }
          />
        </div>
        <div className="flex gap-2">
          <FieldRow label="Min date" htmlFor="val-mindate">
            <Input
              id="val-mindate"
              type="date"
              value={validation.minDate ?? ""}
              onChange={(e) =>
                updateValidation(question.id, {
                  minDate: e.target.value || undefined,
                })
              }
              className="h-8 text-sm"
            />
          </FieldRow>
          <FieldRow label="Max date" htmlFor="val-maxdate">
            <Input
              id="val-maxdate"
              type="date"
              value={validation.maxDate ?? ""}
              onChange={(e) =>
                updateValidation(question.id, {
                  maxDate: e.target.value || undefined,
                })
              }
              className="h-8 text-sm"
            />
          </FieldRow>
        </div>
      </div>
    );
  }

  // 7. Time
  if (type === "time") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <FieldRow label="Min time" htmlFor="val-mintime">
            <Input
              id="val-mintime"
              type="time"
              value={validation.minTime ?? ""}
              onChange={(e) =>
                updateValidation(question.id, {
                  minTime: e.target.value || undefined,
                })
              }
              className="h-8 text-sm"
            />
          </FieldRow>
          <FieldRow label="Max time" htmlFor="val-maxtime">
            <Input
              id="val-maxtime"
              type="time"
              value={validation.maxTime ?? ""}
              onChange={(e) =>
                updateValidation(question.id, {
                  maxTime: e.target.value || undefined,
                })
              }
              className="h-8 text-sm"
            />
          </FieldRow>
        </div>
        <FieldRow label="Minute interval" htmlFor="val-time-step">
          <Select
            value={String(validation.stepMinutes ?? 15)}
            onValueChange={(v) =>
              updateValidation(question.id, { stepMinutes: Number(v) })
            }
          >
            <SelectTrigger id="val-time-step" className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1" className="text-sm">1 minute</SelectItem>
              <SelectItem value="5" className="text-sm">5 minutes</SelectItem>
              <SelectItem value="15" className="text-sm">15 minutes</SelectItem>
              <SelectItem value="30" className="text-sm">30 minutes</SelectItem>
              <SelectItem value="60" className="text-sm">60 minutes</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
      </div>
    );
  }

  // 8. Datetime
  if (type === "datetime") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="val-dis-past-dt" className="text-sm font-medium">
            Disable past date & time
          </Label>
          <Switch
            id="val-dis-past-dt"
            checked={!!validation.disablePastDates}
            onCheckedChange={(v) =>
              updateValidation(question.id, { disablePastDates: v })
            }
          />
        </div>
        <FieldRow label="Min date & time" htmlFor="val-mindatetime">
          <Input
            id="val-mindatetime"
            type="datetime-local"
            value={validation.minDateTime ?? ""}
            onChange={(e) =>
              updateValidation(question.id, {
                minDateTime: e.target.value || undefined,
              })
            }
            className="h-8 text-sm"
          />
        </FieldRow>
        <FieldRow label="Max date & time" htmlFor="val-maxdatetime">
          <Input
            id="val-maxdatetime"
            type="datetime-local"
            value={validation.maxDateTime ?? ""}
            onChange={(e) =>
              updateValidation(question.id, {
                maxDateTime: e.target.value || undefined,
              })
            }
            className="h-8 text-sm"
          />
        </FieldRow>
      </div>
    );
  }

  // 9. Select (Dropdown)
  if (type === "select") {
    return (
      <div className="flex flex-col gap-3">
        <FieldRow label="Default selected option" htmlFor="val-select-default">
          <Select
            value={validation.defaultValue || "_none"}
            onValueChange={(v) =>
              updateValidation(question.id, {
                defaultValue: v === "_none" ? undefined : v,
              })
            }
          >
            <SelectTrigger id="val-select-default" className="h-8 text-sm">
              <SelectValue placeholder="None (prompt user)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none" className="text-sm">None (prompt user)</SelectItem>
              {question.options.map((opt) => (
                <SelectItem key={opt.id} value={opt.label} className="text-sm">
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldRow>
      </div>
    );
  }

  // 10. Multi-Select
  if (type === "multi_select") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <FieldRow label="Min selections" htmlFor="val-ms-min">
            <Input
              id="val-ms-min"
              type="number"
              min={0}
              value={validation.minSelections ?? ""}
              onChange={(e) =>
                updateValidation(question.id, {
                  minSelections: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="0"
              className="h-8 text-sm"
            />
          </FieldRow>
          <FieldRow label="Max selections" htmlFor="val-ms-max">
            <Input
              id="val-ms-max"
              type="number"
              min={0}
              value={validation.maxSelections ?? ""}
              onChange={(e) =>
                updateValidation(question.id, {
                  maxSelections: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="∞"
              className="h-8 text-sm"
            />
          </FieldRow>
        </div>
      </div>
    );
  }

  // 11. Radio (Single Choice)
  if (type === "radio") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="val-allow-other" className="text-sm font-medium">
              Allow &quot;Other&quot; write-in
            </Label>
            <span className="text-xs text-muted-foreground">
              User can type a custom response
            </span>
          </div>
          <Switch
            id="val-allow-other"
            checked={!!validation.allowOther}
            onCheckedChange={(v) =>
              updateValidation(question.id, { allowOther: v })
            }
          />
        </div>
      </div>
    );
  }

  // 12. Checkbox (Multiple Choice)
  if (type === "checkbox") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <FieldRow label="Min checked" htmlFor="val-cb-min">
            <Input
              id="val-cb-min"
              type="number"
              min={0}
              value={validation.minSelections ?? ""}
              onChange={(e) =>
                updateValidation(question.id, {
                  minSelections: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="0"
              className="h-8 text-sm"
            />
          </FieldRow>
          <FieldRow label="Max checked" htmlFor="val-cb-max">
            <Input
              id="val-cb-max"
              type="number"
              min={0}
              value={validation.maxSelections ?? ""}
              onChange={(e) =>
                updateValidation(question.id, {
                  maxSelections: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              placeholder="∞"
              className="h-8 text-sm"
            />
          </FieldRow>
        </div>
        <FieldRow label="Exact count required" htmlFor="val-cb-exact">
          <Input
            id="val-cb-exact"
            type="number"
            min={0}
            value={validation.exactSelections ?? ""}
            onChange={(e) =>
              updateValidation(question.id, {
                exactSelections: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="— (optional)"
            className="h-8 text-sm"
          />
        </FieldRow>
      </div>
    );
  }

  // 13. Rating
  if (type === "rating") {
    return (
      <div className="flex flex-col gap-3">
        <FieldRow label="Rating scale" htmlFor="val-rating-max">
          <Select
            value={String(validation.maxRating ?? 5)}
            onValueChange={(v) =>
              updateValidation(question.id, { maxRating: Number(v) })
            }
          >
            <SelectTrigger id="val-rating-max" className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5" className="text-sm">5 Stars</SelectItem>
              <SelectItem value="10" className="text-sm">10 Stars</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label="Min stars required" htmlFor="val-rating-min">
          <Input
            id="val-rating-min"
            type="number"
            min={1}
            max={validation.maxRating ?? 5}
            value={validation.minRating ?? ""}
            onChange={(e) =>
              updateValidation(question.id, {
                minRating: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="1"
            className="h-8 text-sm"
          />
        </FieldRow>
      </div>
    );
  }

  // 14. Scale (Opinion / Likert)
  if (type === "scale") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <FieldRow label="Start at" htmlFor="val-scale-min">
            <Select
              value={String(validation.minScale ?? 1)}
              onValueChange={(v) =>
                updateValidation(question.id, { minScale: Number(v) })
              }
            >
              <SelectTrigger id="val-scale-min" className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0" className="text-sm">0</SelectItem>
                <SelectItem value="1" className="text-sm">1</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
          <FieldRow label="End at" htmlFor="val-scale-max">
            <Select
              value={String(validation.maxScale ?? 10)}
              onValueChange={(v) =>
                updateValidation(question.id, { maxScale: Number(v) })
              }
            >
              <SelectTrigger id="val-scale-max" className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5" className="text-sm">5</SelectItem>
                <SelectItem value="7" className="text-sm">7</SelectItem>
                <SelectItem value="10" className="text-sm">10</SelectItem>
              </SelectContent>
            </Select>
          </FieldRow>
        </div>
        <div className="flex gap-2">
          <FieldRow label="Lowest label" htmlFor="val-scale-lbl-min">
            <Input
              id="val-scale-lbl-min"
              value={validation.minLabel ?? ""}
              onChange={(e) =>
                updateValidation(question.id, {
                  minLabel: e.target.value || undefined,
                })
              }
              placeholder="Not likely"
              className="h-8 text-sm"
            />
          </FieldRow>
          <FieldRow label="Highest label" htmlFor="val-scale-lbl-max">
            <Input
              id="val-scale-lbl-max"
              value={validation.maxLabel ?? ""}
              onChange={(e) =>
                updateValidation(question.id, {
                  maxLabel: e.target.value || undefined,
                })
              }
              placeholder="Very likely"
              className="h-8 text-sm"
            />
          </FieldRow>
        </div>
      </div>
    );
  }

  // 15. Yes / No
  if (type === "yes_no") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="val-must-yes" className="text-sm font-medium">
              Require &quot;Yes&quot; to proceed
            </Label>
            <span className="text-xs text-muted-foreground">
              Required for consent or terms acceptance
            </span>
          </div>
          <Switch
            id="val-must-yes"
            checked={!!validation.mustBeYes}
            onCheckedChange={(v) =>
              updateValidation(question.id, { mustBeYes: v })
            }
          />
        </div>
      </div>
    );
  }

  // 16. File Upload
  if (type === "file") {
    return (
      <div className="flex flex-col gap-3">
        <FieldRow label="Max file size" htmlFor="val-file-size">
          <Select
            value={String(validation.maxFileSizeMB ?? 10)}
            onValueChange={(v) =>
              updateValidation(question.id, { maxFileSizeMB: Number(v) })
            }
          >
            <SelectTrigger id="val-file-size" className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5" className="text-sm">5 MB</SelectItem>
              <SelectItem value="10" className="text-sm">10 MB</SelectItem>
              <SelectItem value="25" className="text-sm">25 MB</SelectItem>
              <SelectItem value="50" className="text-sm">50 MB</SelectItem>
              <SelectItem value="100" className="text-sm">100 MB</SelectItem>
            </SelectContent>
          </Select>
        </FieldRow>
        <FieldRow label="Allowed extensions" htmlFor="val-file-ext">
          <Input
            id="val-file-ext"
            value={validation.allowedExtensions ?? ""}
            onChange={(e) =>
              updateValidation(question.id, {
                allowedExtensions: e.target.value || undefined,
              })
            }
            placeholder=".pdf, .png, .jpg, .docx"
            className="h-8 text-sm"
          />
        </FieldRow>
        <FieldRow label="Max number of files" htmlFor="val-file-max-count">
          <Input
            id="val-file-max-count"
            type="number"
            min={1}
            max={10}
            value={validation.maxFiles ?? ""}
            onChange={(e) =>
              updateValidation(question.id, {
                maxFiles: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            placeholder="1"
            className="h-8 text-sm"
          />
        </FieldRow>
      </div>
    );
  }

  // 17. URL
  if (type === "url") {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="val-https" className="text-sm font-medium">
              Enforce HTTPS
            </Label>
            <span className="text-xs text-muted-foreground">
              URL must start with https://
            </span>
          </div>
          <Switch
            id="val-https"
            checked={!!validation.requireHttps}
            onCheckedChange={(v) =>
              updateValidation(question.id, { requireHttps: v })
            }
          />
        </div>
        <FieldRow label="Allowed domains" htmlFor="val-url-domains">
          <Input
            id="val-url-domains"
            value={validation.allowedUrlDomains ?? ""}
            onChange={(e) =>
              updateValidation(question.id, {
                allowedUrlDomains: e.target.value || undefined,
              })
            }
            placeholder="linkedin.com, github.com"
            className="h-8 text-sm"
          />
        </FieldRow>
      </div>
    );
  }

  return null;
}

// --------------------------------------------------------
// Question properties
// --------------------------------------------------------

function QuestionProperties({ questionId }: { questionId: string }) {
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

// --------------------------------------------------------
// Root inspector
// --------------------------------------------------------

export function PropertiesInspector({ className }: { className?: string } = {}) {
  const { selectedElement, rightPanelTab, setRightPanelTab } = useBuilderStore();

  const renderHeader = () => {
    if (rightPanelTab === "settings") return "Form Settings";
    if (!selectedElement) return "Form Properties";
    if (selectedElement.type === "section") return "Section Properties";
    return "Question Properties";
  };

  return (
    <aside className={cn("flex h-full w-full flex-col bg-background overflow-hidden", className)}>
      {/* Panel header */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-border px-3.5">
        <span className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
          {renderHeader()}
        </span>
        {rightPanelTab === "settings" && (
          <Button
            variant="ghost"
            size="xs"
            onClick={() => setRightPanelTab("properties")}
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            Done
          </Button>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {rightPanelTab === "settings" ? (
          <FormSettingsPanel />
        ) : (
          <>
            {!selectedElement && <FormProperties />}

            {selectedElement?.type === "section" && (
              <SectionProperties sectionId={selectedElement.id} />
            )}

            {selectedElement?.type === "question" && (
              <QuestionProperties questionId={selectedElement.id} />
            )}
          </>
        )}
      </div>
    </aside>
  );
}
