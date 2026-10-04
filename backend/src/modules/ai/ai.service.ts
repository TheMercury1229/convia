/**
 * modules/ai/ai.service.ts
 * -------------------------
 * Business logic for AI-assisted form generation.
 *
 * Flow:
 *  1. Client calls POST /api/ai/generate-form
 *  2. We create an ai_job row (status=pending) and return the jobId immediately
 *  3. We fire-and-forget the heavy async work:
 *       a. Call the Python AI backend → get { form, sections, questions }
 *       b. Create a form record in the DB (title + description)
 *       c. Transform AI output → builder schema (generate UUIDs, resolve section_index)
 *       d. Replace builder state with the generated sections + questions
 *       e. Mark the job as ready (formId populated)
 *  4. Client polls GET /api/ai/jobs/:jobId/status
 *     → { status, formId? } — redirects to /builder/:formId once ready
 */

import { randomUUID } from "crypto";
import aiClient from "../../lib/ai-client";
import { ApiError } from "../../utils/api-error";
import { generateSlug, makeSlugUnique } from "../../utils/slug";
import * as formRepo from "../form/form.repository";
import { replaceBuilderState } from "../form/builder.repository";
import * as aiRepo from "./ai.repository";
import { SaveBuilderInput } from "../form/builder.schema";

// ---------------------------------------------------------------------------
// Shape of the AI backend's generate-form response
// ---------------------------------------------------------------------------
type QuestionType = SaveBuilderInput["questions"][number]["type"];
interface AiFormOutput {
  success: boolean;
  data: {
    form: { title: string; description?: string };
    sections: Array<{
      title?: string;
      description?: string;
      position: number;
    }>;
    questions: Array<{
      section_index: number;
      field_name: string;
      label: string;
      description?: string;
      placeholder?: string;
      type: QuestionType;
      is_required: boolean;
      position: number;
      options?: Array<{ id: string; label: string }>;
      validation?: Record<string, unknown>;
    }>;
  };
}

// ---------------------------------------------------------------------------
// Kick off a form-generation job (non-blocking)
// ---------------------------------------------------------------------------

export async function startFormGenerationJob(
  userQuery: string,
  orgId: string,
  userId?: string,
): Promise<{ jobId: string }> {
  const jobId = randomUUID();

  // Persist the pending job — this is what the client will poll
  await aiRepo.insertAiJob({ id: jobId, orgId });

  // Fire-and-forget — do NOT await this
  runGenerationJob(jobId, userQuery, orgId, userId).catch(() => {
    // Error is already persisted in the DB by runGenerationJob's catch block
  });

  return { jobId };
}

// ---------------------------------------------------------------------------
// Internal: runs the full AI → DB pipeline, updates job status on completion
// ---------------------------------------------------------------------------

async function runGenerationJob(
  jobId: string,
  userQuery: string,
  orgId: string,
  userId?: string,
): Promise<void> {
  try {
    // 1. Call the Python AI backend
    const { data: aiResponse } = await aiClient.post<AiFormOutput>(
      "/api/generate-form",
      { user_query: userQuery },
    );

    if (!aiResponse.success) {
      throw new Error("AI backend returned success=false");
    }

    const { form: aiForm, sections: aiSections, questions: aiQuestions } =
      aiResponse.data;

    // 2. Create the form record (slug must be unique within the org)
    let slug = generateSlug(aiForm.title);
    let existing = await formRepo.findFormBySlug(slug, orgId);
    let attempt = 2;
    while (existing) {
      slug = makeSlugUnique(generateSlug(aiForm.title), attempt);
      existing = await formRepo.findFormBySlug(slug, orgId);
      attempt++;
    }

    const formId = randomUUID();
    await formRepo.insertForm({
      id: formId,
      title: aiForm.title,
      description: aiForm.description,
      slug,
      orgId,
      updatedBy: userId,
    });

    // 3. Transform AI output → builder schema
    //    • Generate a UUID for each section and build an index → id lookup
    //    • Rename snake_case fields to camelCase
    //    • Resolve section_index to the real sectionId
    const sectionIds = aiSections.map(() => randomUUID());

    const sections = aiSections.map((s, i) => ({
      id: sectionIds[i],
      title: s.title ?? null,
      description: s.description ?? null,
      position: s.position,
    }));

    const questions = aiQuestions.map((q) => ({
      id: randomUUID(),
      sectionId: sectionIds[q.section_index],
      fieldName: q.field_name,
      label: q.label,
      description: q.description ?? null,
      placeholder: q.placeholder ?? null,
      type: q.type,
      isRequired: q.is_required,
      position: q.position,
      options: q.options ?? null,
      validation: q.validation ?? null,
    }));

    // 4. Write sections + questions to the DB via the existing builder repo
    await replaceBuilderState(formId, { sections, questions });

    // 5. Mark the job as ready
    await aiRepo.markAiJobReady(jobId, formId);
  } catch (err: unknown) {
    const message =
      (err as { aiDetail?: string })?.aiDetail ??
      (err instanceof Error ? err.message : "Unknown error");

    await aiRepo.markAiJobFailed(jobId, message);
  }
}

// ---------------------------------------------------------------------------
// Poll job status (called by the status endpoint)
// ---------------------------------------------------------------------------

export async function getJobStatus(jobId: string, orgId: string) {
  const job = await aiRepo.findAiJobById(jobId);

  if (!job) throw ApiError.notFound("Job not found");
  if (job.orgId !== orgId) throw ApiError.forbidden("Access denied");

  return {
    status: job.status,
    formId: job.formId ?? undefined,
    error: job.error ?? undefined,
  };
}
