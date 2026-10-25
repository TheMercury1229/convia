import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  real,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { organization } from "./auth-schema";
import { user } from "./auth-schema";

// ---------------------------------------------------------------------------
// Plan constants — single source of truth
// ---------------------------------------------------------------------------

export const PLAN_CREDITS: Record<string, number> = {
  free: 100,
  builder: 600,
  pro: 2000,
};

export const CREDIT_COSTS = {
  AI_GENERATE_FORM: 10,
  GRIZZY_ANALYTICS: 0.5,
  GRIZZY_BUILDER: 0.5,
} as const;

export type CreditReason =
  | "ai_generate_form"
  | "grizzy_analytics"
  | "grizzy_builder"
  | "plan_renewal"
  | "plan_upgrade"
  | "plan_downgrade"
  | "initial_grant";

export type Plan = "free" | "builder" | "pro";

// ---------------------------------------------------------------------------
// org_credits — one row per org, holds the current billing state
// ---------------------------------------------------------------------------

export const orgCredits = pgTable(
  "org_credits",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id")
      .notNull()
      .unique()
      .references(() => organization.id, { onDelete: "cascade" }),
    plan: text("plan").default("free").notNull(), // "free" | "builder" | "pro"
    // real supports 0.5 fractional deductions natively in Postgres
    creditsRemaining: real("credits_remaining").default(100).notNull(),
    creditsTotal: integer("credits_total").default(100).notNull(),
    cycleStart: timestamp("cycle_start").defaultNow().notNull(),
    // 1 month from cycleStart — used for lazy monthly reset on free plan
    cycleEnd: timestamp("cycle_end").notNull(),
    // Dodo Payments linkage — subscription is scoped to the org
    dodoCustomerId: text("dodo_customer_id"),
    dodoSubscriptionId: text("dodo_subscription_id"),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index("org_credits_orgId_idx").on(table.orgId)],
);

// ---------------------------------------------------------------------------
// org_credit_transactions — audit log per debit/credit event
// Both orgId and userId are recorded so owner/admin can see who used what
// ---------------------------------------------------------------------------

export const orgCreditTransactions = pgTable(
  "org_credit_transactions",
  {
    id: text("id").primaryKey(),
    orgId: text("org_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    // The member who triggered the action
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    // Negative = debit (usage), positive = credit (grant/renewal)
    amount: real("amount").notNull(),
    reason: text("reason").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("org_credit_tx_orgId_idx").on(table.orgId),
    index("org_credit_tx_userId_idx").on(table.userId),
    index("org_credit_tx_createdAt_idx").on(table.createdAt),
  ],
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------

export const orgCreditsRelations = relations(orgCredits, ({ one }) => ({
  organization: one(organization, {
    fields: [orgCredits.orgId],
    references: [organization.id],
  }),
}));

export const orgCreditTransactionsRelations = relations(
  orgCreditTransactions,
  ({ one }) => ({
    organization: one(organization, {
      fields: [orgCreditTransactions.orgId],
      references: [organization.id],
    }),
    user: one(user, {
      fields: [orgCreditTransactions.userId],
      references: [user.id],
    }),
  }),
);
