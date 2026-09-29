"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useBuilderStore } from "@/store/builder-store";
import { FieldRow, InspectorSection } from "./inspector-primitives";

export function SectionProperties({ sectionId }: { sectionId: string }) {
  const { sections, updateSection, deleteSection, selectElement } = useBuilderStore();
  const section = sections.find((s) => s.id === sectionId);
  if (!section) return null;

  return (
    <div className="flex flex-col gap-4 p-4">
      <InspectorSection title="Section">
        <FieldRow label="Title" htmlFor="sec-title">
          <Input
            id="sec-title"
            value={section.title}
            onChange={(e) => updateSection(sectionId, { title: e.target.value })}
            placeholder="Section title"
            className="h-9 text-sm"
          />
        </FieldRow>
        <FieldRow label="Description" htmlFor="sec-desc">
          <textarea
            id="sec-desc"
            value={section.description}
            onChange={(e) => updateSection(sectionId, { description: e.target.value })}
            placeholder="Optional description"
            rows={3}
            className={cn(
              "resize-none rounded-md border border-input bg-background px-3 py-2",
              "text-sm text-foreground placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            )}
          />
        </FieldRow>
      </InspectorSection>

      <Separator />

      <InspectorSection title="Actions">
        <Button
          variant="destructive"
          size="sm"
          className="w-full justify-start gap-2 text-sm"
          onClick={() => {
            deleteSection(sectionId);
            selectElement(null);
          }}
        >
          <Trash2 className="size-4" />
          Delete section
        </Button>
      </InspectorSection>
    </div>
  );
}
