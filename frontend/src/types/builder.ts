// ============================================================
// Builder Type Definitions
// Maps cleanly to the future backend Form → Section → Question
// ============================================================

// --------------------------------------------------------
// Question Types
// --------------------------------------------------------

export type QuestionType =
  | "text"
  | "textarea"
  | "paragraph"
  | "number"
  | "email"
  | "phone"
  | "date"
  | "select"
  | "multi_select"
  | "radio"
  | "checkbox"
  | "rating"
  | "file"
  | "url"
  | "time"
  | "datetime"
  | "yes_no"
  | "scale"
  | "heading";

export interface QuestionOption {
  id: string;
  label: string;
}

export interface QuestionValidation {
  // text, textarea
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  customError?: string;
  minWords?: number;
  maxWords?: number;

  // number
  min?: number;
  max?: number;
  step?: number;
  integerOnly?: boolean;

  // email
  disallowFreeEmails?: boolean;
  allowedDomains?: string;

  // phone
  phoneFormat?: "any" | "e164" | "us";

  // date, time, datetime
  minDate?: string;
  maxDate?: string;
  disablePastDates?: boolean;
  disableFutureDates?: boolean;
  minTime?: string;
  maxTime?: string;
  stepMinutes?: number;
  minDateTime?: string;
  maxDateTime?: string;

  // select, multi_select, radio, checkbox
  defaultValue?: string;
  minSelections?: number;
  maxSelections?: number;
  exactSelections?: number;
  allowOther?: boolean;

  // rating, scale
  maxRating?: number;
  minRating?: number;
  minScale?: number;
  maxScale?: number;
  minLabel?: string;
  maxLabel?: string;

  // yes_no
  mustBeYes?: boolean;

  // file
  maxFileSizeMB?: number;
  allowedExtensions?: string;
  maxFiles?: number;

  // url
  requireHttps?: boolean;
  allowedUrlDomains?: string;

  // Generic key index to allow loose backend JSON compatibility
  [key: string]: unknown;
}

export interface Question {
  id: string;
  sectionId: string;
  type: QuestionType;
  /** Machine-safe field name (e.g. "full_name") */
  fieldName: string;
  label: string;
  description: string;
  placeholder: string;
  required: boolean;
  /** 0-based position within the section */
  position: number;
  /** For select / radio / checkbox */
  options: QuestionOption[];
  validation: QuestionValidation;
}

// --------------------------------------------------------
// Section
// --------------------------------------------------------

export interface Section {
  id: string;
  formId: string;
  title: string;
  description: string;
  /** 0-based position within the form */
  position: number;
}

// --------------------------------------------------------
// Form (client-side shape)
// --------------------------------------------------------

export interface BuilderForm {
  id: string;
  title: string;
  description: string;
  slug?: string;
  deadline?: string | null;
  themeColor?: string;
  themeId?: string;
  fontFamily?: string;
}

// --------------------------------------------------------
// Selection
// --------------------------------------------------------

export type SelectedElementType = "form" | "section" | "question";

export interface SelectedElement {
  type: SelectedElementType;
  id: string;
}

// --------------------------------------------------------
// Palette component descriptor
// --------------------------------------------------------

export interface PaletteComponent {
  type: QuestionType;
  label: string;
  group: string;
  icon: string; // lucide icon name (resolved in palette)
}
