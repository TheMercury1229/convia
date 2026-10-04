import { relations } from "drizzle-orm";
import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { form } from "./form-schema";

export const aiJobStatusEnum = pgEnum("ai_job_status", [
  "pending",
  "ready",
  "failed",
]);

export const aiJob = pgTable(
  "ai_job",
  {
    id: text("id").primaryKey(),

    // Which organisation triggered this job
    orgId: text("org_id").notNull(),

    // Job lifecycle
    status: aiJobStatusEnum("status").notNull().default("pending"),

    // Populated once the form + sections + questions have been written to DB
    formId: text("form_id").references(() => form.id, { onDelete: "set null" }),

    // Human-readable error surfaced to the client on failure
    error: text("error"),

    createdAt: timestamp("created_at").defaultNow().notNull(),

    // Lets the client/admin know when the job resolved (ready or failed)
    resolvedAt: timestamp("resolved_at"),
  },
  (table) => [
    // Poll by job id → primary key (implicit), no extra index needed
    // Fetch all jobs for an org (dashboard / history view)
    index("ai_job_orgId_idx").on(table.orgId),
    // Look up the job that created a specific form (useful for builder redirect logic)
    index("ai_job_formId_idx").on(table.formId),
    // Filter pending jobs efficiently (background worker / cleanup queries)
    index("ai_job_status_idx").on(table.status),
  ],
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const aiJobRelations = relations(aiJob, ({ one }) => ({
  form: one(form, {
    fields: [aiJob.formId],
    references: [form.id],
  }),
}));
