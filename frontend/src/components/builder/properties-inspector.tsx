"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useBuilderStore } from "@/store/builder-store";
import { FormSettingsPanel } from "./form-settings-panel";
import { FormProperties } from "./inspector/form-properties";
import { SectionProperties } from "./inspector/section-properties";
import { QuestionProperties, QUESTION_TYPES } from "./inspector/question-properties";
import { GrizzyBuilderPanel } from "./grizzy-builder-panel";

export { QUESTION_TYPES };

export function PropertiesInspector({ className }: { className?: string } = {}) {
  const { selectedElement, rightPanelTab, setRightPanelTab } = useBuilderStore();

  const isGrizzy = rightPanelTab === "grizzy";

  const headerTitle =
    rightPanelTab === "settings"
      ? "Form Settings"
      : !selectedElement
        ? "Form Properties"
        : selectedElement.type === "section"
          ? "Section Properties"
          : "Question Properties";

  return (
    <aside className={cn("flex h-full w-full flex-col bg-background overflow-hidden relative", className)}>
      {/* Grizzy Chat Panel — kept mounted in DOM so session, scroll, and draft stay active */}
      <div className={cn("h-full w-full flex flex-col", !isGrizzy && "hidden")}>
        <GrizzyBuilderPanel />
      </div>

      {/* Properties or Settings Panel */}
      {!isGrizzy && (
        <div className="flex h-full w-full flex-col overflow-hidden">
          {/* Panel header */}
          <div className="flex h-11 shrink-0 items-center justify-between border-b border-border px-3.5">
            <span className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
              {headerTitle}
            </span>
            {rightPanelTab === "settings" && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => setRightPanelTab("properties")}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                Done
              </Button>
            )}
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">
            {rightPanelTab === "settings" ? (
              <FormSettingsPanel />
            ) : (
              <>
                {!selectedElement && <FormProperties />}

                {selectedElement?.type === "section" && (
                  <SectionProperties sectionId={selectedElement.id} />
                )}

                {selectedElement?.type === "question" && (
                  <QuestionProperties questionId={selectedElement.id} />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
