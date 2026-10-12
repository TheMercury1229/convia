"use client";

import React from "react";
import { PageHeading } from "@/components/dashboard/page-heading";
import { TemplateCard } from "@/components/templates/template-card";
import { FORM_TEMPLATES } from "@/components/templates/template-data";

export default function TemplatesPage() {
  return (
    <div className="space-y-6 max-w-7xl pb-10">
      {/* Standard Page Heading without badges or action buttons */}
      <PageHeading
        title="Templates"
        description="Choose a pre-built template to quickly create conversational forms."
      />

      {/* Grid of 6 Template Cards matching FormCard styling */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {FORM_TEMPLATES.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </div>
  );
}
