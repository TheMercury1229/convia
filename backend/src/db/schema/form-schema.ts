import { relations } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  text,
  boolean,
  integer,
  timestamp,
  json,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const questionTypeEnum = pgEnum("question_type", [
  "text",
  "textarea",
  "number",
  "email",
  "phone",
  "date",
  "select",
  "multi_select",
  "radio",
  "checkbox",
  "rating",
  "file",
]);

// ---------------------------------------------------------------------------
// Form
// ---------------------------------------------------------------------------

export const form = pgTable(
  "form",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    slug: text("slug").notNull(),
    themeId: text("theme_id"),
    isPublished: boolean("is_published").default(false).notNull(),
    // Nullable — if set, form stops accepting responses after this timestamp
    deadline: timestamp("deadline", { withTimezone: true }),
    // FK -> organization.id — scopes the form to its organisation
    orgId: text("org_id").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    updatedBy: text("updated_by"), // FK -> user.id
  },
  (table) => [
    // slug must be unique within an organisation
    uniqueIndex("form_slug_org_idx").on(table.slug, table.orgId),
    index("form_orgId_idx").on(table.orgId),
    index("form_updatedBy_idx").on(table.updatedBy),
  ],
);

// ---------------------------------------------------------------------------
// Section
// ---------------------------------------------------------------------------

export const section = pgTable(
  "section",
  {
    id: text("id").primaryKey(),
    formId: text("form_id")
      .notNull()
      .references(() => form.id, { onDelete: "cascade" }),
    // Nullable — default section (auto-created by API) has no title/description
    title: text("title"),
    description: text("description"),
    position: integer("position").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("section_formId_idx").on(table.formId)],
);

// ---------------------------------------------------------------------------
// Question
// ---------------------------------------------------------------------------

export const question = pgTable(
  "question",
  {
    id: text("id").primaryKey(),
    sectionId: text("section_id")
      .notNull()
      .references(() => section.id, { onDelete: "cascade" }),
    // Denormalized for unique constraint + faster full-form queries without joining through section
    formId: text("form_id")
      .notNull()
      .references(() => form.id, { onDelete: "cascade" }),
    // Auto-slugified from label on creation, never regenerated after that
    fieldName: text("field_name").notNull(),
    label: text("label").notNull(),
    description: text("description"),
    placeholder: text("placeholder"),
    type: questionTypeEnum("type").notNull(),
    isRequired: boolean("is_required").default(false).notNull(),
    position: integer("position").notNull(),
    // JSON — for select/radio/multi_select/checkbox: array of option strings
    options: json("options"),
    // JSON — loose, type-specific validation rules e.g. { max_length: 500 }, { min: 1, max: 10 }
    validation: json("validation"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    // field_name must be unique per form
    uniqueIndex("question_formId_fieldName_idx").on(table.formId, table.fieldName),
    index("question_sectionId_idx").on(table.sectionId),
    index("question_formId_idx").on(table.formId),
  ],
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const formRelations = relations(form, ({ many }) => ({
  sections: many(section),
  // responses relation is defined in response-schema to avoid circular imports
}));

export const sectionRelations = relations(section, ({ one, many }) => ({
  form: one(form, {
    fields: [section.formId],
    references: [form.id],
  }),
  questions: many(question),
}));

export const questionRelations = relations(question, ({ one }) => ({
  section: one(section, {
    fields: [question.sectionId],
    references: [section.id],
  }),
  form: one(form, {
    fields: [question.formId],
    references: [form.id],
  }),
  // answers relation is defined in response-schema to avoid circular imports
}));
