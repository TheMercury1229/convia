import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { form } from "./form-schema";
import { response } from "./response-schema";

// ---------------------------------------------------------------------------
// form_view — fires once when the public form page loads
// ---------------------------------------------------------------------------
// session_id is a UUID generated client-side and stored in sessionStorage.
// It is shared with form_session so views can be linked to starts → submits.
// The unique index on (form_id, session_id) prevents refresh double-counting.
// ---------------------------------------------------------------------------

export const formView = pgTable(
  "form_view",
  {
    id:        text("id").primaryKey(),
    formId:    text("form_id").notNull().references(() => form.id, { onDelete: "cascade" }),
    sessionId: text("session_id").notNull(),
    viewedAt:  timestamp("viewed_at").defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("form_view_form_session_idx").on(t.formId, t.sessionId),
    index("form_view_form_idx").on(t.formId),
    index("form_view_viewed_at_idx").on(t.viewedAt),
  ]
);

// ---------------------------------------------------------------------------
// form_session — created when a respondent clicks "Start" / reaches Q1
// ---------------------------------------------------------------------------
// last_question_index is patched (via sendBeacon) on every question advance.
// If the tab closes before submission, the last recorded index shows exactly
// where the respondent dropped off — enabling the per-question funnel.
// completed_at + response_id are populated on successful form submission.
// ---------------------------------------------------------------------------

export const formSession = pgTable(
  "form_session",
  {
    id:                text("id").primaryKey(),
    formId:            text("form_id").notNull().references(() => form.id, { onDelete: "cascade" }),
    sessionId:         text("session_id").notNull(),
    startedAt:         timestamp("started_at").defaultNow().notNull(),
    lastQuestionIndex: integer("last_question_index").default(0).notNull(),
    completedAt:       timestamp("completed_at"),                          // null = in-progress or abandoned
    responseId:        text("response_id").references(() => response.id, { onDelete: "set null" }),
  },
  (t) => [
    uniqueIndex("form_session_form_session_idx").on(t.formId, t.sessionId),
    index("form_session_form_idx").on(t.formId),
    index("form_session_completed_at_idx").on(t.completedAt),
  ]
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const formViewRelations = relations(formView, ({ one }) => ({
  form: one(form, { fields: [formView.formId], references: [form.id] }),
}));

export const formSessionRelations = relations(formSession, ({ one }) => ({
  form:     one(form,     { fields: [formSession.formId],     references: [form.id]     }),
  response: one(response, { fields: [formSession.responseId], references: [response.id] }),
}));
