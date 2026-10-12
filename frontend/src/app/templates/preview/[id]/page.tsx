"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { FormViewer } from "@/components/form-viewer/form-viewer";
import { FormUnavailableState } from "@/components/form-viewer/form-unavailable-state";
import { FormLoadingScreen } from "@/components/form-viewer/form-loading-screen";
import { getTemplateById, templateToFormWithSections } from "@/components/templates/template-data";

function TemplatePreviewContent() {
  const params = useParams<{ id: string }>();
  const templateId = params?.id;

  const template = React.useMemo(() => {
    return templateId ? getTemplateById(templateId) : undefined;
  }, [templateId]);

  if (!template) {
    return (
      <FormUnavailableState
        reason="not-found"
        errorMessage="The requested template could not be found."
        dashboard={true}
      />
    );
  }

  const formData = React.useMemo(() => {
    return templateToFormWithSections(template);
  }, [template]);

  return <FormViewer form={formData} isPreview={true} />;
}

export default function TemplatePreviewPage() {
  return (
    <React.Suspense fallback={<FormLoadingScreen />}>
      <TemplatePreviewContent />
    </React.Suspense>
  );
}
