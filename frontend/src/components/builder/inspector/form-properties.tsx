"use client";

import * as React from "react";
import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { useBuilderStore } from "@/store/builder-store";
import { FieldRow, InspectorSection } from "./inspector-primitives";

export function FormProperties() {
  const { form, updateForm, setRightPanelTab } = useBuilderStore();

  return (
    <div className="flex flex-col gap-4 p-4">
      <InspectorSection title="Form">
        <FieldRow label="Title" htmlFor="form-title-inspector">
          <Input
            id="form-title-inspector"
            value={form.title}
            onChange={(e) => updateForm({ title: e.target.value })}
            placeholder="Form title"
            className="h-9 text-sm"
          />
        </FieldRow>
        <FieldRow label="Description" htmlFor="form-desc-inspector">
          <textarea
            id="form-desc-inspector"
            value={form.description}
            onChange={(e) => updateForm({ description: e.target.value })}
            placeholder="Form description"
            rows={3}
            className={cn(
              "resize-none rounded-md border border-input bg-background px-3 py-2",
              "text-sm text-foreground placeholder:text-muted-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            )}
          />
        </FieldRow>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setRightPanelTab("settings")}
          className="mt-2 w-full gap-2 text-xs font-medium"
        >
          <Settings className="size-3.5" />
          Open Form Settings
        </Button>
      </InspectorSection>
    </div>
  );
}
