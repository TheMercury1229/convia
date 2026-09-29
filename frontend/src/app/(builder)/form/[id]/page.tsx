"use client";

import { FormBuilderHeader } from "@/components/builder/form-builder-header";
import { FormBuilder } from "@/components/builder/form-builder";
import { useBuilderStore } from "@/store/builder-store";

/**
 * Full-screen form builder page.
 * Lives in the (builder) route group so it renders without the dashboard sidebar.
 *
 * Note: The form ID from params will be used to load/save the form
 * once the API integration is implemented. For now, the store is
 * seeded with demo data.
 */
export default function FormBuilderPage() {
  const title = useBuilderStore((s) => s.form.title);

  return (
    <>
      <FormBuilderHeader backHref="/my-forms" title={title} />
      <FormBuilder />
    </>
  );
}
