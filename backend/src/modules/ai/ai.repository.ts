import { eq } from "drizzle-orm";
import db from "../../db/db";
import { aiJob } from "../../db/schema/ai-job-schema";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AiJobStatus = "pending" | "ready" | "failed";

export interface InsertAiJobInput {
  id: string;
  orgId: string;
}

// ---------------------------------------------------------------------------
// Insert a new pending job row
// ---------------------------------------------------------------------------

export async function insertAiJob(input: InsertAiJobInput) {
  const [row] = await db
    .insert(aiJob)
    .values({
      id: input.id,
      orgId: input.orgId,
      status: "pending",
    })
    .returning();
  return row;
}

// ---------------------------------------------------------------------------
// Mark a job as ready — set formId + resolvedAt
// ---------------------------------------------------------------------------

export async function markAiJobReady(id: string, formId: string) {
  const [row] = await db
    .update(aiJob)
    .set({ status: "ready", formId, resolvedAt: new Date() })
    .where(eq(aiJob.id, id))
    .returning();
  return row;
}

// ---------------------------------------------------------------------------
// Mark a job as failed — store error message + resolvedAt
// ---------------------------------------------------------------------------

export async function markAiJobFailed(id: string, error: string) {
  const [row] = await db
    .update(aiJob)
    .set({ status: "failed", error, resolvedAt: new Date() })
    .where(eq(aiJob.id, id))
    .returning();
  return row;
}

// ---------------------------------------------------------------------------
// Find a job by id (used by the status polling endpoint)
// ---------------------------------------------------------------------------

export async function findAiJobById(id: string) {
  const [row] = await db.select().from(aiJob).where(eq(aiJob.id, id)).limit(1);
  return row ?? null;
}
