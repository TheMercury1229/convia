import { relations } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { form } from "./form-schema";
import { user } from "./auth-schema";

export const aiFeatureEnum = pgEnum("ai_feature", [
  "fill_form",
  "builder_chat",
  "analyze_responses",
]);

export const aiUsageLog = pgTable(
  "ai_usage_log",
  {
    id: text("id").primaryKey(),

    // Organisation scoping
    orgId: text("org_id").notNull(),

    // User who triggered this turn (nullable for anonymous respondents if needed)
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),

    // The form associated with this chat turn
    formId: text("form_id")
      .notNull()
      .references(() => form.id, { onDelete: "cascade" }),

    // Feature category
    feature: aiFeatureEnum("feature").notNull(),

    // User prompt/message
    userMessage: text("user_message").notNull(),

    // AI's response text (truncated to avoid unbounded growth)
    aiReply: text("ai_reply").notNull(),

    // Turn position in the session
    turnIndex: integer("turn_index").notNull().default(0),

    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("ai_usage_log_orgId_idx").on(table.orgId),
    index("ai_usage_log_formId_idx").on(table.formId),
    index("ai_usage_log_feature_idx").on(table.feature),
    index("ai_usage_log_createdAt_idx").on(table.createdAt),
  ],
);

export const aiUsageLogRelations = relations(aiUsageLog, ({ one }) => ({
  form: one(form, {
    fields: [aiUsageLog.formId],
    references: [form.id],
  }),
  user: one(user, {
    fields: [aiUsageLog.userId],
    references: [user.id],
  }),
}));

