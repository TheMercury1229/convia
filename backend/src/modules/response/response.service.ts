import { randomUUID } from "crypto";
import { ApiError } from "../../utils/api-error";
import type { SubmitResponseInput } from "./response.schema";
import * as responseRepo from "./response.repository";
import * as formRepo from "../form/form.repository";
import * as analyticsRepo from "../analytics/analytics.repository";

// ---------------------------------------------------------------------------
// Submit a response to a form (public — no auth)
// ---------------------------------------------------------------------------

export const submitResponse = async (formId: string, input: SubmitResponseInput) => {
  // 1. Fetch the form — must exist, be published, and be within deadline
  const formData = await formRepo.findFormById(formId);
  if (!formData) throw ApiError.notFound("Form not found");

  if (!formData.isPublished) {
    throw ApiError.forbidden("This form is not accepting responses");
  }

  if (formData.deadline && new Date() > new Date(formData.deadline)) {
    throw ApiError.forbidden(
      "This form is no longer accepting responses — deadline has passed",
    );
  }

  // 2. Fetch form questions to auto-resolve fieldName & calculate completion rate
  const questions = await responseRepo.findQuestionsByFormId(formId);
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  // 3. Normalize input.answers whether passed as array or dictionary
  const rawList: { questionId: string; fieldName?: string; value?: unknown }[] = [];
  if (Array.isArray(input.answers)) {
    rawList.push(...input.answers);
  } else if (input.answers && typeof input.answers === "object") {
    for (const [qId, val] of Object.entries(input.answers)) {
      rawList.push({ questionId: qId, value: val });
    }
  }

  // 4. Create the response record
  const responseId = randomUUID();
  const newResponse = await responseRepo.insertResponse({ id: responseId, formId });

  // 5. Prepare answers for insertion with fieldName resolved
  const answersToInsert = rawList.map((item) => {
    const q = questionMap.get(item.questionId);
    return {
      id: randomUUID(),
      responseId,
      questionId: item.questionId,
      fieldName: item.fieldName || q?.fieldName || item.questionId,
      value: item.value !== undefined ? item.value : null,
    };
  });

  const savedAnswers = await responseRepo.insertAnswers(answersToInsert);

  // 6. Calculate completion rate for this submission
  const answerableQuestions = questions.filter((q) => q.type !== "heading");
  const totalAnswerable = answerableQuestions.length;

  let answeredCount = 0;
  for (const a of answersToInsert) {
    const isAnswered =
      a.value !== null &&
      a.value !== undefined &&
      a.value !== "" &&
      !(Array.isArray(a.value) && a.value.length === 0);
    if (isAnswered) answeredCount++;
  }

  const completionRate =
    totalAnswerable === 0
      ? 100
      : Math.min(100, Math.round((answeredCount / totalAnswerable) * 100));

  // 7. If sessionId was passed, mark form session as completed
  if (input.sessionId) {
    try {
      await analyticsRepo.completeFormSession(formId, input.sessionId, responseId);
    } catch (err) {
      console.warn("Failed to mark formSession completed:", err);
    }
  }

  return {
    ...newResponse,
    answers: savedAnswers,
    completionRate,
  };
};

// ---------------------------------------------------------------------------
// Get all responses across all forms for an organisation
// ---------------------------------------------------------------------------

export const getAllOrgResponses = async (orgId: string) => {
  const [responses, metrics] = await Promise.all([
    responseRepo.findAllResponsesForOrg(orgId),
    responseRepo.getOrgResponseMetrics(orgId),
  ]);
  return { responses, metrics };
};

// ---------------------------------------------------------------------------
// Get all responses for a form (org-scoped)
// ---------------------------------------------------------------------------

export const getFormResponses = async (formId: string, orgId: string) => {
  const formData = await formRepo.findFormById(formId);
  if (!formData) throw ApiError.notFound("Form not found");
  if (formData.orgId !== orgId) throw ApiError.forbidden("Access denied");

  return responseRepo.findAllResponsesForForm(formId);
};

// ---------------------------------------------------------------------------
// Get a single response (org-scoped)
// ---------------------------------------------------------------------------

export const getResponseById = async (
  responseId: string,
  orgId: string,
) => {
  const responseData = await responseRepo.findFullResponseById(responseId);
  if (!responseData) throw ApiError.notFound("Response not found");

  const formData = await formRepo.findFormById(responseData.formId);
  if (!formData || formData.orgId !== orgId) throw ApiError.forbidden("Access denied");

  return responseData;
};

// ---------------------------------------------------------------------------
// Get completion rate for a form (org-scoped)
// ---------------------------------------------------------------------------

export const getFormCompletionRate = async (formId: string, orgId: string) => {
  const formData = await formRepo.findFormById(formId);
  if (!formData) throw ApiError.notFound("Form not found");
  if (formData.orgId !== orgId) throw ApiError.forbidden("Access denied");

  return responseRepo.getCompletionRate(formId);
};

// ---------------------------------------------------------------------------
// Delete a response (org-scoped)
// ---------------------------------------------------------------------------

export const deleteResponse = async (responseId: string, orgId: string) => {
  const responseData = await responseRepo.findResponseById(responseId);
  if (!responseData) throw ApiError.notFound("Response not found");

  const formData = await formRepo.findFormById(responseData.formId);
  if (!formData || formData.orgId !== orgId) throw ApiError.forbidden("Access denied");

  await responseRepo.deleteResponseById(responseId);
};
