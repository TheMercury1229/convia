import { randomUUID } from "crypto";
import { ApiError } from "../../utils/api-error";
import { generateSlug, makeSlugUnique } from "../../utils/slug";
import type { CreateFormInput, UpdateFormInput } from "./form.schema";
import * as formRepo from "./form.repository";

// ---------------------------------------------------------------------------
// List — scoped to the caller's organisation
// ---------------------------------------------------------------------------

export const getAllForms = async (orgId: string) => {
  return formRepo.findAllForms(orgId);
};

// ---------------------------------------------------------------------------
// Get single — full (with sections + questions)
// Verifies the form belongs to the caller's organisation.
// ---------------------------------------------------------------------------

export const getFormById = async (id: string, orgId: string) => {
  const formData = await formRepo.findFullFormById(id);
  if (!formData) throw ApiError.notFound("Form not found");
  if (formData.orgId !== orgId) throw ApiError.forbidden("Access denied");
  return formData;
};

// ---------------------------------------------------------------------------
// Public form — for respondents (unauthenticated, no org check)
// ---------------------------------------------------------------------------

export const getPublicForm = async (slug: string) => {
  const formData = await formRepo.findFullFormBySlug(slug);
  if (!formData) throw ApiError.notFound("Form not found");

  if (!formData.isPublished) {
    throw ApiError.forbidden("This form is not accepting responses");
  }

  if (formData.deadline && new Date() > formData.deadline) {
    throw ApiError.forbidden(
      "This form is no longer accepting responses — deadline has passed",
    );
  }

  return formData;
};

// ---------------------------------------------------------------------------
// Create — always pinned to the caller's org
// ---------------------------------------------------------------------------

export const createForm = async (
  input: CreateFormInput,
  orgId: string,
  userId?: string,
) => {
  // Generate slug from title if not provided
  let slug = input.slug ?? generateSlug(input.title);

  // Ensure slug uniqueness within the org — append numeric suffix on collision
  let existing = await formRepo.findFormBySlug(slug, orgId);
  let attempt = 2;
  while (existing) {
    slug = makeSlugUnique(generateSlug(input.slug ?? input.title), attempt);
    existing = await formRepo.findFormBySlug(slug, orgId);
    attempt++;
  }

  const formId = randomUUID();
  const sectionId = randomUUID();

  const newForm = await formRepo.insertForm({
    ...input,
    id: formId,
    slug,
    orgId,
    updatedBy: userId,
  });

  // Always create a default section — API enforces sections as mandatory
  await formRepo.insertDefaultSection({ id: sectionId, formId });

  return newForm;
};

// ---------------------------------------------------------------------------
// Update — verifies form belongs to caller's org before mutating
// ---------------------------------------------------------------------------

export const updateForm = async (
  id: string,
  input: UpdateFormInput,
  orgId: string,
  userId?: string,
) => {
  const existing = await formRepo.findFormById(id);
  if (!existing) throw ApiError.notFound("Form not found");
  if (existing.orgId !== orgId) throw ApiError.forbidden("Access denied");

  // If slug is changing, check for conflicts within the same org
  if (input.slug && input.slug !== existing.slug) {
    const slugTaken = await formRepo.findFormBySlug(input.slug, orgId);
    if (slugTaken) {
      throw ApiError.conflict(
        "A form with this slug already exists in your organisation",
      );
    }
  }

  const updated = await formRepo.updateFormById(id, {
    ...input,
    updatedBy: userId,
  });
  if (!updated) throw ApiError.notFound("Form not found");
  return updated;
};

// ---------------------------------------------------------------------------
// Toggle publish — verifies org membership
// ---------------------------------------------------------------------------

export const togglePublish = async (id: string, orgId: string) => {
  const existing = await formRepo.findFormById(id);
  if (!existing) throw ApiError.notFound("Form not found");
  if (existing.orgId !== orgId) throw ApiError.forbidden("Access denied");

  const updated = await formRepo.updatePublishStatus(id, !existing.isPublished);
  if (!updated) throw ApiError.internal();
  return updated;
};

// ---------------------------------------------------------------------------
// Duplicate — verifies org membership, copies within the same org
// ---------------------------------------------------------------------------

export const duplicateForm = async (
  id: string,
  orgId: string,
  userId?: string,
) => {
  const original = await formRepo.findFullFormById(id);
  if (!original) throw ApiError.notFound("Form not found");
  if (original.orgId !== orgId) throw ApiError.forbidden("Access denied");

  // Generate a unique slug for the copy within the org
  let newSlug = makeSlugUnique(original.slug, 2);
  let existing = await formRepo.findFormBySlug(newSlug, orgId);
  let attempt = 3;
  while (existing) {
    newSlug = makeSlugUnique(original.slug, attempt);
    existing = await formRepo.findFormBySlug(newSlug, orgId);
    attempt++;
  }

  const newFormId = randomUUID();

  return formRepo.duplicateFormGraph({
    form: {
      id: newFormId,
      title: `${original.title} (Copy)`,
      description: original.description,
      slug: newSlug,
      orgId,
      themeId: original.themeId,
      isPublished: false,
      deadline: original.deadline,
      updatedBy: userId ?? null,
    },
    sections: original.sections.map((sec) => ({
      id: randomUUID(),
      title: sec.title ?? undefined,
      description: sec.description ?? undefined,
      position: sec.position,
      questions: sec.questions.map((q) => ({
        id: randomUUID(),
        fieldName: q.fieldName,
        label: q.label,
        description: q.description ?? undefined,
        placeholder: q.placeholder ?? undefined,
        type: q.type,
        isRequired: q.isRequired,
        position: q.position,
        options: q.options ?? undefined,
        validation: q.validation ?? undefined,
      })),
    })),
  });
};

// ---------------------------------------------------------------------------
// Delete — verifies org membership
// ---------------------------------------------------------------------------

export const deleteForm = async (id: string, orgId: string) => {
  const existing = await formRepo.findFormById(id);
  if (!existing) throw ApiError.notFound("Form not found");
  if (existing.orgId !== orgId) throw ApiError.forbidden("Access denied");
  await formRepo.deleteFormById(id);
};
