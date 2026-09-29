"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { FieldRow } from "./inspector-primitives";

export interface ValidationStrategyProps {
  question: Question;
}

// --------------------------------------------------------
// Validation Strategy Implementations
// --------------------------------------------------------

function TextValidation({ question }: ValidationStrategyProps) {
  const { updateValidation } = useBuilderStore();
  const { validation } = question;

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

function ParagraphValidation({ question }: ValidationStrategyProps) {
  const { updateValidation } = useBuilderStore();
  const { validation } = question;

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

function NumberValidation({ question }: ValidationStrategyProps) {
  const { updateValidation } = useBuilderStore();
  const { validation } = question;

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

function EmailValidation({ question }: ValidationStrategyProps) {
  const { updateValidation } = useBuilderStore();
  const { validation } = question;

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

function PhoneValidation({ question }: ValidationStrategyProps) {
  const { updateValidation } = useBuilderStore();
  const { validation } = question;

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

function DateValidation({ question }: ValidationStrategyProps) {
  const { updateValidation } = useBuilderStore();
  const { validation } = question;

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

function TimeValidation({ question }: ValidationStrategyProps) {
  const { updateValidation } = useBuilderStore();
  const { validation } = question;

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

function DateTimeValidation({ question }: ValidationStrategyProps) {
  const { updateValidation } = useBuilderStore();
  const { validation } = question;

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

function SelectValidation({ question }: ValidationStrategyProps) {
  const { updateValidation } = useBuilderStore();
  const { validation } = question;

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

function MultiSelectValidation({ question }: ValidationStrategyProps) {
  const { updateValidation } = useBuilderStore();
  const { validation } = question;

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

function RadioValidation({ question }: ValidationStrategyProps) {
  const { updateValidation } = useBuilderStore();
  const { validation } = question;

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

function CheckboxValidation({ question }: ValidationStrategyProps) {
  const { updateValidation } = useBuilderStore();
  const { validation } = question;

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

function RatingValidation({ question }: ValidationStrategyProps) {
  const { updateValidation } = useBuilderStore();
  const { validation } = question;

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

function ScaleValidation({ question }: ValidationStrategyProps) {
  const { updateValidation } = useBuilderStore();
  const { validation } = question;

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

function YesNoValidation({ question }: ValidationStrategyProps) {
  const { updateValidation } = useBuilderStore();
  const { validation } = question;

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

function FileValidation({ question }: ValidationStrategyProps) {
  const { updateValidation } = useBuilderStore();
  const { validation } = question;

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

function UrlValidation({ question }: ValidationStrategyProps) {
  const { updateValidation } = useBuilderStore();
  const { validation } = question;

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

// --------------------------------------------------------
// Validation Strategy Registry
// --------------------------------------------------------

const VALIDATION_STRATEGIES: Partial<
  Record<QuestionType, React.ComponentType<ValidationStrategyProps>>
> = {
  text: TextValidation,
  textarea: ParagraphValidation,
  paragraph: ParagraphValidation,
  number: NumberValidation,
  email: EmailValidation,
  phone: PhoneValidation,
  date: DateValidation,
  time: TimeValidation,
  datetime: DateTimeValidation,
  select: SelectValidation,
  multi_select: MultiSelectValidation,
  radio: RadioValidation,
  checkbox: CheckboxValidation,
  rating: RatingValidation,
  scale: ScaleValidation,
  yes_no: YesNoValidation,
  file: FileValidation,
  url: UrlValidation,
};

// --------------------------------------------------------
// ValidationEditor Dispatcher Component
// --------------------------------------------------------

export function ValidationEditor({ question }: ValidationStrategyProps) {
  const Strategy = VALIDATION_STRATEGIES[question.type];
  if (!Strategy) return null;
  return <Strategy question={question} />;
}
