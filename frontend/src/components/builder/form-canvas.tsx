"use client";

import * as React from "react";
import { Plus, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBuilderStore } from "@/store/builder-store";
import { SectionEditor, SectionDropSlot } from "./section-editor";
import { useTheme } from "next-themes";
import { getFormTheme, getFontOption } from "@/lib/builder-themes";

export function FormCanvas() {
  const { form, sections, selectedElement, selectElement, updateForm, addSection } =
    useBuilderStore();

  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const currentTheme = getFormTheme(form.themeId || "nova", isDark);
  const currentFont = getFontOption(form.fontFamily || "sans");

  const sortedSections = [...sections].sort((a, b) => a.position - b.position);

  const [editingTitle, setEditingTitle] = React.useState(false);
  const [editingDesc, setEditingDesc] = React.useState(false);
  const [titleDraft, setTitleDraft] = React.useState(form.title);
  const [descDraft, setDescDraft] = React.useState(form.description);
  const titleRef = React.useRef<HTMLInputElement>(null);
  const descRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => { setTitleDraft(form.title); }, [form.title]);
  React.useEffect(() => { setDescDraft(form.description); }, [form.description]);
  React.useEffect(() => { if (editingTitle) titleRef.current?.focus(); }, [editingTitle]);
  React.useEffect(() => { if (editingDesc) descRef.current?.focus(); }, [editingDesc]);

  const commitTitle = () => {
    updateForm({ title: titleDraft.trim() || "Untitled Form" });
    setEditingTitle(false);
  };
  const commitDesc = () => {
    updateForm({ description: descDraft });
    setEditingDesc(false);
  };

  return (
    <div
      className="flex h-full flex-col overflow-y-auto transition-colors duration-200"
      style={{
        backgroundColor: currentTheme.colors.canvasBg,
        fontFamily: currentFont.fontFamily,
      }}
      onClick={() => selectElement(null)}
    >
      <div className="mx-auto w-full max-w-4xl xl:max-w-5xl px-6 md:px-8 py-8 flex flex-col transition-all">

        {/* ── Form header card ─────────────────────────── */}
        <div
          className="rounded-xl border px-6 py-5 transition-all duration-150"
          style={{
            backgroundColor: currentTheme.colors.cardBg,
            borderColor: selectedElement === null
              ? `color-mix(in oklch, ${currentTheme.colors.cardBorder} 80%, ${currentTheme.colors.primary} 20%)`
              : currentTheme.colors.cardBorder,
            borderWidth: "1px",
            color: currentTheme.colors.cardText,
          }}
          onClick={(e) => { e.stopPropagation(); selectElement(null); }}
        >
          {/* Title */}
          {editingTitle ? (
            <input
              ref={titleRef}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitTitle();
                if (e.key === "Escape") { setTitleDraft(form.title); setEditingTitle(false); }
              }}
              className="w-full bg-transparent font-heading text-2xl font-bold outline-none border-b pb-px"
              style={{
                color: currentTheme.colors.cardText,
                borderColor: currentTheme.colors.primary,
              }}
            />
          ) : (
            <h1
              className="cursor-text font-heading text-2xl font-bold hover:opacity-85 transition-opacity"
              style={{ color: currentTheme.colors.cardText }}
              onClick={(e) => { e.stopPropagation(); setTitleDraft(form.title); setEditingTitle(true); }}
            >
              {form.title}
            </h1>
          )}

          {/* Description */}
          {editingDesc ? (
            <textarea
              ref={descRef}
              value={descDraft}
              onChange={(e) => setDescDraft(e.target.value)}
              onBlur={commitDesc}
              onKeyDown={(e) => {
                if (e.key === "Escape") { setDescDraft(form.description); setEditingDesc(false); }
              }}
              rows={2}
              className="mt-2 w-full resize-none rounded-lg border px-3 py-2 text-base outline-none"
              style={{
                backgroundColor: currentTheme.colors.cardInputBg,
                borderColor: currentTheme.colors.cardInputBorder,
                color: currentTheme.colors.cardText,
              }}
            />
          ) : (
            <p
              className="mt-2 cursor-text text-base transition-colors hover:opacity-80"
              style={{ color: currentTheme.colors.cardMuted }}
              onClick={(e) => { e.stopPropagation(); setDescDraft(form.description); setEditingDesc(true); }}
            >
              {form.description || "Click to add a description…"}
            </p>
          )}

          {/* Expiration deadline badge */}
          {form.deadline && (
            <div
              className="mt-3 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-mono font-medium"
              style={{
                backgroundColor: currentTheme.colors.badgeBg,
                color: currentTheme.colors.badgeText,
              }}
            >
              <Clock className="size-3.5" />
              <span>
                Closes {new Date(form.deadline).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
              </span>
            </div>
          )}
        </div>

        {/* ── Sections with drop slots between them ─── */}
        <div className="mt-5">
          {/* Slot before first section */}
          <SectionDropSlot insertAt={0} totalSections={sortedSections.length} />

          {sortedSections.map((section, idx) => (
            <React.Fragment key={section.id}>
              <SectionEditor
                section={section}
                index={idx}
                isFirst={idx === 0}
                isLast={idx === sortedSections.length - 1}
              />
              {/* Slot after each section */}
              <SectionDropSlot insertAt={idx + 1} totalSections={sortedSections.length} />
            </React.Fragment>
          ))}
        </div>

        {/* ── Add Section ──────────────────────────────── */}
        <button
          onClick={(e) => { e.stopPropagation(); addSection(); }}
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
