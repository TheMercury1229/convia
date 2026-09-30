"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { useBuilderStore, useBuilderTheme } from "@/store/builder-store";
import { SectionEditor, SectionDropSlot } from "./section-editor";
import { FormHeaderCard } from "./form-header-card";

export function FormCanvas() {
  const { form, sections, selectElement, addSection } = useBuilderStore();

  const currentTheme = useBuilderTheme();

  const sortedSections = [...sections].sort((a, b) => a.position - b.position);

  return (
    <div
      className="flex h-full flex-col overflow-y-auto transition-colors duration-200"
      style={{
        backgroundColor: currentTheme.colors.canvasBg,
      }}
      onClick={() => selectElement(null)}
    >
      <div className="mx-auto w-full max-w-4xl xl:max-w-5xl px-6 md:px-8 py-8 flex flex-col transition-all">
        {/* ── Form header card ─────────────────────────── */}
        <FormHeaderCard theme={currentTheme} />

        {/* ── Sections with drop slots between them ─── */}
        <div className="mt-5">
          {/* Slot before first section */}
          <SectionDropSlot insertAt={0} theme={currentTheme} />

          {sortedSections.map((section, idx) => (
            <React.Fragment key={section.id}>
              <SectionEditor
                section={section}
                index={idx}
                isFirst={idx === 0}
                isLast={idx === sortedSections.length - 1}
              />
              {/* Slot after each section */}
              <SectionDropSlot insertAt={idx + 1} theme={currentTheme} />
            </React.Fragment>
          ))}
        </div>

        {/* ── Add Section ──────────────────────────────── */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            addSection();
          }}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed py-4 text-base font-medium transition-all hover:opacity-90 cursor-pointer"
          style={{
            borderColor: currentTheme.colors.cardBorder,
            backgroundColor: `${currentTheme.colors.cardBg}88`,
            color: currentTheme.colors.cardMuted,
          }}
        >
          <Plus className="size-5" style={{ color: currentTheme.colors.primary }} />
          Add section
        </button>

        <div className="h-16" />
      </div>
    </div>
  );
}
