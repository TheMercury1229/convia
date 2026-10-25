import { randomUUID } from "crypto";
import { eq, desc, sql } from "drizzle-orm";
import db from "../../db/db";
import { orgCredits, orgCreditTransactions, PLAN_CREDITS } from "../../db/schema/billing-schema";
import { user } from "../../db/schema/auth-schema";
import type { Plan, CreditReason } from "../../db/schema/billing-schema";

// ---------------------------------------------------------------------------
// Seed — called when a new org is created
// ---------------------------------------------------------------------------

export const seedOrgCredits = async (orgId: string): Promise<void> => {
  const now = new Date();
  const cycleEnd = new Date(now);
  cycleEnd.setMonth(cycleEnd.getMonth() + 1);

  await db.insert(orgCredits).values({
    id: randomUUID(),
    orgId,
    plan: "free",
    creditsRemaining: PLAN_CREDITS.free,
    creditsTotal: PLAN_CREDITS.free,
    cycleStart: now,
    cycleEnd,
  });
};

// ---------------------------------------------------------------------------
// Read
// ---------------------------------------------------------------------------

export const findOrgCredits = async (orgId: string) => {
  return db.query.orgCredits.findFirst({
    where: eq(orgCredits.orgId, orgId),
  });
};

// ---------------------------------------------------------------------------
// Deduct — atomic check + debit + audit log in a single transaction
// Returns false if insufficient credits (caller throws 402)
// ---------------------------------------------------------------------------

export const deductOrgCredits = async (
  orgId: string,
  userId: string,
  amount: number,
  reason: CreditReason,
): Promise<boolean> => {
  return await db.transaction(async (tx) => {
    // Lock the row
    const [row] = await tx
      .select()
      .from(orgCredits)
      .where(eq(orgCredits.orgId, orgId))
      .for("update");

    if (!row) return false;

    // Lazy monthly reset — if the cycle has expired, reset before checking
    const now = new Date();
    let remaining = row.creditsRemaining;
    let cycleStart = row.cycleStart;
    let cycleEnd = row.cycleEnd;

    if (now > row.cycleEnd) {
      remaining = row.creditsTotal;
      cycleStart = now;
      cycleEnd = new Date(now);
      cycleEnd.setMonth(cycleEnd.getMonth() + 1);
    }

    if (remaining < amount) return false;

    const newRemaining = Math.round((remaining - amount) * 100) / 100;

    await tx
      .update(orgCredits)
      .set({
        creditsRemaining: newRemaining,
        cycleStart,
        cycleEnd,
        updatedAt: new Date(),
      })
      .where(eq(orgCredits.orgId, orgId));

    await tx.insert(orgCreditTransactions).values({
      id: randomUUID(),
      orgId,
      userId,
      amount: -amount,
      reason,
      createdAt: new Date(),
    });

    return true;
  });
};

// ---------------------------------------------------------------------------
// Grant — set plan + reset credits (called by webhook)
// ---------------------------------------------------------------------------

export const grantPlanCredits = async (
  orgId: string,
  plan: Plan,
  dodoCustomerId?: string,
  dodoSubscriptionId?: string,
): Promise<void> => {
  const now = new Date();
  const cycleEnd = new Date(now);
  cycleEnd.setMonth(cycleEnd.getMonth() + 1);
  const total = PLAN_CREDITS[plan];

  await db
    .update(orgCredits)
    .set({
      plan,
      creditsRemaining: total,
      creditsTotal: total,
      cycleStart: now,
      cycleEnd,
      ...(dodoCustomerId && { dodoCustomerId }),
      ...(dodoSubscriptionId && { dodoSubscriptionId }),
      updatedAt: new Date(),
    })
    .where(eq(orgCredits.orgId, orgId));
};

// ---------------------------------------------------------------------------
// Downgrade — set plan on cycleEnd (called by cancellation webhook)
// We just update the plan immediately; on next cycle reset it normalises
// ---------------------------------------------------------------------------

export const setOrgPlan = async (orgId: string, plan: Plan): Promise<void> => {
  await db
    .update(orgCredits)
    .set({ plan, updatedAt: new Date() })
    .where(eq(orgCredits.orgId, orgId));
};

// ---------------------------------------------------------------------------
// Transactions log — paginated, with user name/email joined
// Only exposed to owner/admin via the controller
// ---------------------------------------------------------------------------

export const findOrgTransactions = async (
  orgId: string,
  page: number,
  limit: number,
) => {
  const offset = (page - 1) * limit;

  const rows = await db
    .select({
      id: orgCreditTransactions.id,
      amount: orgCreditTransactions.amount,
      reason: orgCreditTransactions.reason,
      createdAt: orgCreditTransactions.createdAt,
      userId: orgCreditTransactions.userId,
      userName: user.name,
      userEmail: user.email,
      userImage: user.image,
    })
    .from(orgCreditTransactions)
    .innerJoin(user, eq(orgCreditTransactions.userId, user.id))
    .where(eq(orgCreditTransactions.orgId, orgId))
    .orderBy(desc(orgCreditTransactions.createdAt))
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(orgCreditTransactions)
    .where(eq(orgCreditTransactions.orgId, orgId));

  return { rows, total: count };
};
