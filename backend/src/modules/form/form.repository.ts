import { eq, asc, and, inArray } from "drizzle-orm";
import db from "../../db/db";
import { form, section, question } from "../../db/schema/form-schema";
import { response } from "../../db/schema/response-schema";
import type { CreateFormInput, UpdateFormInput } from "./form.schema";
import type { FormWithSections } from "../../types/index";

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const findAllForms = async (orgId: string) => {
  const forms = await db
    .select()
    .from(form)
    .where(eq(form.orgId, orgId))
    .orderBy(asc(form.createdAt));

  if (forms.length === 0)
    return forms.map((item) => ({ ...item, responseCount: 0 }));

  const responseCounts = await db
    .select({ formId: response.formId })
    .from(response)
    .where(
      inArray(
        response.formId,
        forms.map((item) => item.id),
      ),
    );
  const counts = new Map<string, number>();

  for (const item of responseCounts) {
    counts.set(item.formId, (counts.get(item.formId) ?? 0) + 1);
  }

  return forms.map((item) => ({
    ...item,
    responseCount: counts.get(item.id) ?? 0,
  }));
};

export const findFormById = async (id: string) => {
  const rows = await db.select().from(form).where(eq(form.id, id)).limit(1);
  return rows[0] ?? null;
};

export const findFormBySlug = async (slug: string, orgId?: string) => {
  const where = orgId
    ? and(eq(form.slug, slug), eq(form.orgId, orgId))
    : eq(form.slug, slug);
  const rows = await db.select().from(form).where(where).limit(1);
  return rows[0] ?? null;
};

/**
 * Returns a form with its sections (ordered by position) and each
 * section's questions (ordered by position). Used for the builder view
 * and the public form filling view.
 */
export const findFullFormById = async (
  id: string,
): Promise<FormWithSections | null> => {
  const formRow = await findFormById(id);
  if (!formRow) return null;

  const sections = await db
    .select()
    .from(section)
    .where(eq(section.formId, id))
    .orderBy(asc(section.position));

  const questions = await db
    .select()
    .from(question)
    .where(eq(question.formId, id))
    .orderBy(asc(question.position));

  const sectionsWithQuestions = sections.map((s) => ({
    ...s,
    questions: questions.filter((q) => q.sectionId === s.id),
  }));

  return { ...formRow, sections: sectionsWithQuestions };
};

export const findFullFormBySlug = async (
  slug: string,
): Promise<FormWithSections | null> => {
  const formRow = await findFormBySlug(slug);
  if (!formRow) return null;
  return findFullFormById(formRow.id);
};

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const insertForm = async (
  data: {
    id: string;
    slug: string;
    orgId: string;
    updatedBy?: string;
  } & CreateFormInput,
) => {
  const rows = await db
    .insert(form)
    .values({
      id: data.id,
      title: data.title,
      description: data.description ?? null,
      slug: data.slug,
      orgId: data.orgId,
      themeId: data.themeId ?? null,
      isPublished: false,
      deadline: data.deadline ? new Date(data.deadline) : null,
      updatedBy: data.updatedBy ?? null,
    })
    .returning();
  return rows[0];
};

export const insertDefaultSection = async (data: {
  id: string;
  formId: string;
}) => {
  const rows = await db
    .insert(section)
    .values({
      id: data.id,
      formId: data.formId,
      title: null,
      description: null,
      position: 0,
    })
    .returning();
  return rows[0];
};

export const updateFormById = async (
  id: string,
  data: UpdateFormInput & { updatedBy?: string },
) => {
  const updateData: Partial<typeof form.$inferInsert> = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.slug !== undefined) updateData.slug = data.slug;
  if (data.themeId !== undefined) updateData.themeId = data.themeId;
  if (data.deadline !== undefined)
    updateData.deadline = data.deadline ? new Date(data.deadline) : null;
  if (data.maxResponses !== undefined) updateData.maxResponses = data.maxResponses;
  if (data.redirectUrl !== undefined) updateData.redirectUrl = data.redirectUrl;
  if (data.completionTitle !== undefined) updateData.completionTitle = data.completionTitle;
  if (data.completionMessage !== undefined) updateData.completionMessage = data.completionMessage;
  if (data.updatedBy !== undefined) updateData.updatedBy = data.updatedBy;

  const rows = await db
    .update(form)
    .set(updateData)
    .where(eq(form.id, id))
    .returning();
  return rows[0] ?? null;
};

export const updatePublishStatus = async (id: string, isPublished: boolean) => {
  const rows = await db
    .update(form)
    .set({ isPublished })
    .where(eq(form.id, id))
    .returning();
  return rows[0] ?? null;
};

export const deleteFormById = async (id: string) => {
  await db.delete(form).where(eq(form.id, id));
};

export const insertSection = async (data: {
  id: string;
  formId: string;
  title?: string;
  description?: string;
  position: number;
}) => {
  const rows = await db
    .insert(section)
    .values({
      id: data.id,
      formId: data.formId,
      title: data.title ?? null,
      description: data.description ?? null,
      position: data.position,
    })
    .returning();
  return rows[0];
};

export const insertQuestion = async (data: {
  id: string;
  sectionId: string;
  formId: string;
  fieldName: string;
  label: string;
  description?: string;
  placeholder?: string;
  type: (typeof question.$inferInsert)["type"];
  isRequired: boolean;
  position: number;
  options?: unknown;
  validation?: unknown;
}) => {
  const rows = await db
    .insert(question)
    .values({
      id: data.id,
      sectionId: data.sectionId,
      formId: data.formId,
      fieldName: data.fieldName,
      label: data.label,
      description: data.description ?? null,
      placeholder: data.placeholder ?? null,
      type: data.type,
      isRequired: data.isRequired,
      position: data.position,
      options: data.options ?? null,
      validation: data.validation ?? null,
    })
    .returning();
  return rows[0];
};

export const duplicateFormGraph = async (data: {
  form: typeof form.$inferInsert;
  sections: Array<{
    id: string;
    title?: string;
    description?: string;
    position: number;
    questions: Array<{
      id: string;
      fieldName: string;
      label: string;
      description?: string;
      placeholder?: string;
      type: (typeof question.$inferInsert)["type"];
      isRequired: boolean;
      position: number;
      options?: unknown;
      validation?: unknown;
    }>;
  }>;
}) => {
  return db.transaction(async (tx) => {
    const [newForm] = await tx.insert(form).values(data.form).returning();

    for (const sectionData of data.sections) {
      await tx.insert(section).values({
        id: sectionData.id,
        formId: data.form.id,
        title: sectionData.title ?? null,
        description: sectionData.description ?? null,
        position: sectionData.position,
      });

      if (sectionData.questions.length > 0) {
        await tx.insert(question).values(
          sectionData.questions.map((questionData) => ({
            id: questionData.id,
            sectionId: sectionData.id,
            formId: data.form.id,
            fieldName: questionData.fieldName,
            label: questionData.label,
            description: questionData.description ?? null,
            placeholder: questionData.placeholder ?? null,
            type: questionData.type,
            isRequired: questionData.isRequired,
            position: questionData.position,
            options: questionData.options ?? null,
            validation: questionData.validation ?? null,
          })),
        );
      }
    }

    return newForm;
  });
};
