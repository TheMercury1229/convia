import { eq, count, and, ne, asc, desc } from "drizzle-orm";
import db from "../../db/db";
import { response, answer } from "../../db/schema/response-schema";
import { form, question } from "../../db/schema/form-schema";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const findResponseById = async (id: string) => {
  const rows = await db.select().from(response).where(eq(response.id, id)).limit(1);
  return rows[0] ?? null;
};

export const findResponsesByFormId = async (formId: string) => {
  return db.select().from(response).where(eq(response.formId, formId)).orderBy(asc(response.submittedAt));
};

export const findQuestionsByFormId = async (formId: string) => {
  return db
    .select()
    .from(question)
    .where(eq(question.formId, formId))
    .orderBy(asc(question.position));
};

/**
 * Returns a response with all its answers.
 */
export const findFullResponseById = async (id: string) => {
  const responseRow = await findResponseById(id);
  if (!responseRow) return null;

  const answers = await db
    .select({
      id: answer.id,
      questionId: answer.questionId,
      fieldName: answer.fieldName,
      value: answer.value,
      createdAt: answer.createdAt,
    })
    .from(answer)
    .where(eq(answer.responseId, id));

  const formQuestions = await db
    .select({
      id: question.id,
      isRequired: question.isRequired,
    })
    .from(question)
    .where(and(eq(question.formId, responseRow.formId), ne(question.type, "heading")));

  const totalQuestions = formQuestions.length;
  let answeredCount = 0;
  for (const a of answers) {
    const isAnswered =
      a.value !== null &&
      a.value !== undefined &&
      a.value !== "" &&
      !(Array.isArray(a.value) && a.value.length === 0);
    if (isAnswered) answeredCount++;
  }

  const completionRate =
    totalQuestions === 0
      ? 100
      : Math.min(100, Math.round((answeredCount / totalQuestions) * 100));

  return { ...responseRow, answers, completionRate };
};

/**
 * Returns all responses for a form with their answers.
 */
export const findAllResponsesForForm = async (formId: string) => {
  const responses = await findResponsesByFormId(formId);

  // Fetch answerable questions for this form to compute completion rate
  const formQuestions = await db
    .select({
      id: question.id,
      isRequired: question.isRequired,
    })
    .from(question)
    .where(and(eq(question.formId, formId), ne(question.type, "heading")));

  const totalQuestions = formQuestions.length;

  const result = await Promise.all(
    responses.map(async (r) => {
      const answers = await db
        .select({
          id: answer.id,
          questionId: answer.questionId,
          fieldName: answer.fieldName,
          value: answer.value,
          createdAt: answer.createdAt,
        })
        .from(answer)
        .where(eq(answer.responseId, r.id));

      let answeredCount = 0;
      for (const a of answers) {
        const isAnswered =
          a.value !== null &&
          a.value !== undefined &&
          a.value !== "" &&
          !(Array.isArray(a.value) && a.value.length === 0);
        if (isAnswered) answeredCount++;
      }

      const completionRate =
        totalQuestions === 0
          ? 100
          : Math.min(100, Math.round((answeredCount / totalQuestions) * 100));

      return { ...r, answers, completionRate };
    }),
  );

  return result;
};

/**
 * Returns all responses across all forms in an organisation with their answers and form metadata.
 */
export const findAllResponsesForOrg = async (orgId: string) => {
  // 1. Fetch all forms in this org
  const forms = await db
    .select({
      id: form.id,
      title: form.title,
      slug: form.slug,
    })
    .from(form)
    .where(eq(form.orgId, orgId));

  if (forms.length === 0) return [];

  const formMap = new Map(forms.map((f) => [f.id, f]));

  // 2. Fetch all answerable questions for these forms to compute completion rates
  const questions = await db
    .select({
      id: question.id,
      formId: question.formId,
      isRequired: question.isRequired,
    })
    .from(question)
    .where(ne(question.type, "heading"));

  const formQuestionsMap = new Map<string, typeof questions>();
  for (const q of questions) {
    if (!formQuestionsMap.has(q.formId)) {
      formQuestionsMap.set(q.formId, []);
    }
    formQuestionsMap.get(q.formId)!.push(q);
  }

  // 3. Fetch all responses belonging to this org's forms
  const responses = await db
    .select({
      id: response.id,
      formId: response.formId,
      submittedAt: response.submittedAt,
    })
    .from(response)
    .innerJoin(form, eq(response.formId, form.id))
    .where(eq(form.orgId, orgId))
    .orderBy(desc(response.submittedAt));

  if (responses.length === 0) return [];

  // 4. Fetch all answers for these responses
  const result = await Promise.all(
    responses.map(async (r) => {
      const answers = await db
        .select({
          id: answer.id,
          questionId: answer.questionId,
          fieldName: answer.fieldName,
          value: answer.value,
          createdAt: answer.createdAt,
        })
        .from(answer)
        .where(eq(answer.responseId, r.id));

      const formMeta = formMap.get(r.formId);
      const formQs = formQuestionsMap.get(r.formId) || [];
      const totalQ = formQs.length;

      let answeredCount = 0;
      for (const a of answers) {
        const isAnswered =
          a.value !== null &&
          a.value !== undefined &&
          a.value !== "" &&
          !(Array.isArray(a.value) && a.value.length === 0);
        if (isAnswered) answeredCount++;
      }

      const completionRate =
        totalQ === 0 ? 100 : Math.min(100, Math.round((answeredCount / totalQ) * 100));

      return {
        ...r,
        formTitle: formMeta?.title || "Untitled Form",
        formSlug: formMeta?.slug || r.formId,
        answers,
        completionRate,
      };
    }),
  );

  return result;
};

/**
 * Returns org-wide aggregated response metrics.
 */
export const getOrgResponseMetrics = async (orgId: string) => {
  const forms = await db
    .select({ id: form.id })
    .from(form)
    .where(eq(form.orgId, orgId));

  const totalForms = forms.length;

  const responses = await db
    .select({
      id: response.id,
      formId: response.formId,
      submittedAt: response.submittedAt,
    })
    .from(response)
    .innerJoin(form, eq(response.formId, form.id))
    .where(eq(form.orgId, orgId));

  const totalResponses = responses.length;
  const activeFormsWithResponses = new Set(responses.map((r) => r.formId)).size;

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const responsesToday = responses.filter(
    (r) => r.submittedAt && new Date(r.submittedAt) >= oneDayAgo,
  ).length;

  let averageCompletionRate = 0;
  if (totalResponses > 0) {
    const allOrgResponses = await findAllResponsesForOrg(orgId);
    const sumRate = allOrgResponses.reduce((acc, r) => acc + (r.completionRate ?? 100), 0);
    averageCompletionRate = Math.round(sumRate / totalResponses);
  }

  return {
    totalForms,
    totalResponses,
    activeFormsWithResponses,
    averageCompletionRate,
    responsesToday,
  };
};

/**
 * Returns the completion rate metrics for a form.
 * Completion rate = (responses that answered all required questions) / total responses * 100
 * Average completion rate = average % of answerable questions answered per response
 */
export const getCompletionRate = async (formId: string) => {
  const [totalRow] = await db
    .select({ count: count() })
    .from(response)
    .where(eq(response.formId, formId));

  const totalResponses = totalRow?.count ?? 0;
  if (totalResponses === 0) {
    return {
      totalResponses: 0,
      completedResponses: 0,
      completionRate: 0,
      averageCompletionRate: 0,
    };
  }

  // Answerable questions (exclude headings)
  const answerableQuestions = await db
    .select({ id: question.id, isRequired: question.isRequired })
    .from(question)
    .where(and(eq(question.formId, formId), ne(question.type, "heading")));

  const totalAnswerable = answerableQuestions.length;
  if (totalAnswerable === 0) {
    return {
      totalResponses,
      completedResponses: totalResponses,
      completionRate: 100,
      averageCompletionRate: 100,
    };
  }

  const requiredQuestionIds = new Set(
    answerableQuestions.filter((q) => q.isRequired).map((q) => q.id),
  );
  const requiredCount = requiredQuestionIds.size;

  // Fetch all answers for these responses
  const answers = await db
    .select({
      responseId: answer.responseId,
      questionId: answer.questionId,
      value: answer.value,
    })
    .from(answer)
    .innerJoin(response, eq(answer.responseId, response.id))
    .where(eq(response.formId, formId));

  // Group non-empty answers by responseId
  const responseAnswersMap = new Map<string, Set<string>>();
  for (const a of answers) {
    const isAnswered =
      a.value !== null &&
      a.value !== undefined &&
      a.value !== "" &&
      !(Array.isArray(a.value) && a.value.length === 0);

    if (isAnswered) {
      if (!responseAnswersMap.has(a.responseId)) {
        responseAnswersMap.set(a.responseId, new Set());
      }
      responseAnswersMap.get(a.responseId)!.add(a.questionId);
    }
  }

  const allResponseRows = await db
    .select({ id: response.id })
    .from(response)
    .where(eq(response.formId, formId));

  let completedResponses = 0;
  let totalPercentageSum = 0;

  for (const r of allResponseRows) {
    const answeredSet = responseAnswersMap.get(r.id) ?? new Set();
    const answeredCount = answeredSet.size;

    const isCompleted =
      requiredCount > 0
        ? Array.from(requiredQuestionIds).every((qId) => answeredSet.has(qId))
        : answeredCount >= totalAnswerable;

    if (isCompleted) {
      completedResponses++;
    }

    const pct = Math.min(100, Math.round((answeredCount / totalAnswerable) * 100));
    totalPercentageSum += pct;
  }

  const completionRate = Math.round((completedResponses / totalResponses) * 100);
  const averageCompletionRate = Math.round(totalPercentageSum / totalResponses);

  return {
    totalResponses,
    completedResponses,
    completionRate,
    averageCompletionRate,
  };
};

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const insertResponse = async (data: { id: string; formId: string }) => {
  const rows = await db
    .insert(response)
    .values({ id: data.id, formId: data.formId })
    .returning();
  return rows[0];
};

export const insertAnswers = async (
  answers: {
    id: string;
    responseId: string;
    questionId: string;
    fieldName: string;
    value: unknown;
  }[],
) => {
  if (answers.length === 0) return [];
  const rows = await db.insert(answer).values(answers).returning();
  return rows;
};

export const deleteResponseById = async (id: string) => {
  await db.delete(response).where(eq(response.id, id));
};
