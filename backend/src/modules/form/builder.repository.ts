import { eq } from "drizzle-orm";
import db from "../../db/db";
import { section, question } from "../../db/schema/form-schema";
import type { SaveBuilderInput } from "./builder.schema";

/**
 * Fully replaces the sections and questions for a given form.
 *
 * Strategy: delete-then-insert within a transaction.
 * This keeps the implementation simple and correct for a drag-and-drop builder
 * where position/ownership can change arbitrarily.
 *
 * Cascade delete on section → question means a single delete on sections
 * wipes all orphaned questions too, so we only need to re-insert both.
 */
export async function replaceBuilderState(
  formId: string,
  input: SaveBuilderInput,
): Promise<void> {
  await db.transaction(async (tx) => {
    // 1. Wipe existing sections (cascade removes questions automatically)
    await tx.delete(section).where(eq(section.formId, formId));

    // 2. Re-insert sections
    if (input.sections.length > 0) {
      await tx.insert(section).values(
        input.sections.map((s) => ({
          id: s.id,
          formId,
          title: s.title ?? null,
          description: s.description ?? null,
          position: s.position,
        })),
      );
    }

    // 3. Re-insert questions
    if (input.questions.length > 0) {
      await tx.insert(question).values(
        input.questions.map((q) => ({
          id: q.id,
          sectionId: q.sectionId,
          formId,
          fieldName: q.fieldName,
          label: q.label,
          description: q.description ?? null,
          placeholder: q.placeholder ?? null,
          type: q.type,
          isRequired: q.isRequired,
          position: q.position,
          options: q.options ?? null,
          validation: q.validation ?? null,
        })),
      );
    }
  });
}
