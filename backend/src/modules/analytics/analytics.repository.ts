import { randomUUID } from "crypto";
import { eq, and, sql, desc, asc, inArray } from "drizzle-orm";
import db from "../../db/db";
import { formView, formSession } from "../../db/schema/analytics-schema";
import { form, question, section } from "../../db/schema/form-schema";
import { response, answer } from "../../db/schema/response-schema";

// ---------------------------------------------------------------------------
// Beacon & Session Ingestion
// ---------------------------------------------------------------------------

export const recordFormView = async (formId: string, sessionId: string) => {
  await db
    .insert(formView)
    .values({
      id: randomUUID(),
      formId,
      sessionId,
      viewedAt: new Date(),
    })
    .onConflictDoNothing();
};

export const startFormSession = async (formId: string, sessionId: string) => {
  await db
    .insert(formSession)
    .values({
      id: randomUUID(),
      formId,
      sessionId,
      startedAt: new Date(),
      lastQuestionIndex: 0,
    })
    .onConflictDoNothing();
};

export const updateFormSessionProgress = async (
  formId: string,
  sessionId: string,
  lastQuestionIndex: number,
) => {
  await db
    .update(formSession)
    .set({
      lastQuestionIndex: sql`GREATEST(${formSession.lastQuestionIndex}, ${lastQuestionIndex})`,
    })
    .where(
      and(eq(formSession.formId, formId), eq(formSession.sessionId, sessionId)),
    );
};

export const completeFormSession = async (
  formId: string,
  sessionId: string,
  responseId?: string,
) => {
  const updateValues: Record<string, unknown> = {
    completedAt: new Date(),
  };
  if (responseId) {
    updateValues.responseId = responseId;
  }

  await db
    .update(formSession)
    .set(updateValues)
    .where(
      and(eq(formSession.formId, formId), eq(formSession.sessionId, sessionId)),
    );
};

// ---------------------------------------------------------------------------
// Analytics Data Retrieval
// ---------------------------------------------------------------------------

export const findFormById = async (formId: string) => {
  const rows = await db.select().from(form).where(eq(form.id, formId)).limit(1);
  return rows[0] ?? null;
};

export const findFormBySlug = async (slug: string, orgId: string) => {
  const rows = await db
    .select()
    .from(form)
    .where(and(eq(form.slug, slug), eq(form.orgId, orgId)))
    .limit(1);
  return rows[0] ?? null;
};

export const findQuestionsByFormId = async (formId: string) => {
  return db
    .select()
    .from(question)
    .where(eq(question.formId, formId))
    .orderBy(asc(question.position));
};

export const findFormViewsByFormId = async (formId: string) => {
  return db
    .select({
      id: formView.id,
      sessionId: formView.sessionId,
      viewedAt: formView.viewedAt,
    })
    .from(formView)
    .where(eq(formView.formId, formId))
    .orderBy(asc(formView.viewedAt));
};

export const findFormSessionsByFormId = async (formId: string) => {
  return db
    .select({
      id: formSession.id,
      sessionId: formSession.sessionId,
      startedAt: formSession.startedAt,
      lastQuestionIndex: formSession.lastQuestionIndex,
      completedAt: formSession.completedAt,
      responseId: formSession.responseId,
    })
    .from(formSession)
    .where(eq(formSession.formId, formId))
    .orderBy(asc(formSession.startedAt));
};

export const findResponsesByFormId = async (formId: string) => {
  return db
    .select({
      id: response.id,
      formId: response.formId,
      submittedAt: response.submittedAt,
    })
    .from(response)
    .where(eq(response.formId, formId))
    .orderBy(asc(response.submittedAt));
};

export const findAnswersByFormId = async (formId: string) => {
  return db
    .select({
      id: answer.id,
      responseId: answer.responseId,
      questionId: answer.questionId,
      fieldName: answer.fieldName,
      value: answer.value,
      createdAt: answer.createdAt,
    })
    .from(answer)
    .innerJoin(response, eq(answer.responseId, response.id))
    .where(eq(response.formId, formId))
    .orderBy(asc(answer.createdAt));
};

export const findOrgFormsWithCounts = async (orgId: string) => {
  return db
    .select({
      id: form.id,
      title: form.title,
      slug: form.slug,
      isPublished: form.isPublished,
      createdAt: form.createdAt,
      updatedAt: form.updatedAt,
    })
    .from(form)
    .where(eq(form.orgId, orgId))
    .orderBy(desc(form.updatedAt));
};
