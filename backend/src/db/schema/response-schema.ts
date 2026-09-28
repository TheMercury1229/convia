import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  json,
  index,
} from "drizzle-orm/pg-core";
import { form, question } from "./form-schema";

// ---------------------------------------------------------------------------
// Response
// ---------------------------------------------------------------------------

export const response = pgTable(
  "response",
  {
    id: text("id").primaryKey(),
    formId: text("form_id")
      .notNull()
      .references(() => form.id, { onDelete: "cascade" }),
    // No respondent identity � form filling is anonymous and public
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  },
  (table) => [index("response_formId_idx").on(table.formId)],
);

// ---------------------------------------------------------------------------
// Answer
// ---------------------------------------------------------------------------

export const answer = pgTable(
  "answer",
  {
    id: text("id").primaryKey(),
    responseId: text("response_id")
      .notNull()
      .references(() => response.id, { onDelete: "cascade" }),
    questionId: text("question_id")
      .notNull()
      .references(() => question.id, { onDelete: "cascade" }),
    // Denormalized from question  avoids joins during AI analysis and CSV export
    fieldName: text("field_name").notNull(),
    // JSON  handles all value types: string, number, boolean, array (multi-select)
    value: json("value"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("answer_responseId_idx").on(table.responseId),
    index("answer_questionId_idx").on(table.questionId),
  ],
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const responseRelations = relations(response, ({ one, many }) => ({
  form: one(form, {
    fields: [response.formId],
    references: [form.id],
  }),
  answers: many(answer),
}));

export const answerRelations = relations(answer, ({ one }) => ({
  response: one(response, {
    fields: [answer.responseId],
    references: [response.id],
  }),
  question: one(question, {
    fields: [answer.questionId],
    references: [question.id],
  }),
}));
