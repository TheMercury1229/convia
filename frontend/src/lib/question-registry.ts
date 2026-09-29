import type { QuestionType } from "@/types/builder";
import {
  Heading1,
  AlignLeft,
  Type,
  AlignJustify,
  Mail,
  Hash,
  Phone,
  Link,
  ChevronDown,
  ListFilter,
  CircleDot,
  CheckSquare,
  ToggleLeft,
  Calendar,
  Clock,
  CalendarClock,
  Star,
  Sliders,
  Upload,
} from "lucide-react";
import type * as React from "react";

export type PaletteGroupName =
  | "Text & Input"
  | "Choices"
  | "Date & Time"
  | "Feedback & Media";

export interface QuestionMeta {
  type: QuestionType;
  label: string;
  icon: React.ElementType;
  group: PaletteGroupName;
}

export const QUESTION_DEFINITIONS: QuestionMeta[] = [
  // Text & Input
  { type: "heading", label: "Heading", icon: Heading1, group: "Text & Input" },
  { type: "text", label: "Short Text", icon: Type, group: "Text & Input" },
  { type: "textarea", label: "Long Text", icon: AlignJustify, group: "Text & Input" },
  { type: "paragraph", label: "Paragraph", icon: AlignLeft, group: "Text & Input" },
  { type: "number", label: "Number", icon: Hash, group: "Text & Input" },
  { type: "email", label: "Email", icon: Mail, group: "Text & Input" },
  { type: "phone", label: "Phone", icon: Phone, group: "Text & Input" },
  { type: "url", label: "Website / URL", icon: Link, group: "Text & Input" },

  // Choices
  { type: "select", label: "Dropdown", icon: ChevronDown, group: "Choices" },
  { type: "multi_select", label: "Multi Select", icon: ListFilter, group: "Choices" },
  { type: "radio", label: "Single Choice", icon: CircleDot, group: "Choices" },
  { type: "checkbox", label: "Multiple Choice", icon: CheckSquare, group: "Choices" },
  { type: "yes_no", label: "Yes / No", icon: ToggleLeft, group: "Choices" },

  // Date & Time
  { type: "date", label: "Date", icon: Calendar, group: "Date & Time" },
  { type: "time", label: "Time", icon: Clock, group: "Date & Time" },
  { type: "datetime", label: "Date & Time", icon: CalendarClock, group: "Date & Time" },

  // Feedback & Media
  { type: "rating", label: "Rating", icon: Star, group: "Feedback & Media" },
  { type: "scale", label: "Opinion Scale", icon: Sliders, group: "Feedback & Media" },
  { type: "file", label: "File Upload", icon: Upload, group: "Feedback & Media" },
];

export const TYPE_ICONS: Record<QuestionType, React.ElementType> =
  QUESTION_DEFINITIONS.reduce((acc, item) => {
    acc[item.type] = item.icon;
    return acc;
  }, {} as Record<QuestionType, React.ElementType>);

export const TYPE_LABELS: Record<QuestionType, string> =
  QUESTION_DEFINITIONS.reduce((acc, item) => {
    acc[item.type] = item.label;
    return acc;
  }, {} as Record<QuestionType, string>);

export const QUESTION_TYPES: { value: QuestionType; label: string }[] =
  QUESTION_DEFINITIONS.map((item) => ({
    value: item.type,
    label: item.label,
  }));

export const ADD_ITEMS: { type: QuestionType; label: string; Icon: React.ElementType }[] =
  QUESTION_DEFINITIONS.map((item) => ({
    type: item.type,
    label: item.label,
    Icon: item.icon,
  }));

export interface PaletteEntry {
  type: QuestionType;
  label: string;
  Icon: React.ElementType;
}

export interface PaletteGroup {
  group: PaletteGroupName;
  items: PaletteEntry[];
}

export const PALETTE_GROUPS: PaletteGroup[] = [
  "Text & Input",
  "Choices",
  "Date & Time",
  "Feedback & Media",
].map((groupName) => ({
  group: groupName as PaletteGroupName,
  items: QUESTION_DEFINITIONS.filter((item) => item.group === groupName).map((item) => ({
    type: item.type,
    label: item.label,
    Icon: item.icon,
  })),
}));

export function getTypeLabel(type: QuestionType): string {
  return TYPE_LABELS[type] ?? type;
}
