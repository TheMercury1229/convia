"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { useBuilderStore } from "@/store/builder-store";
import type { FormThemeResolved } from "@/lib/builder-themes";

interface FormHeaderCardProps {
  theme: FormThemeResolved;
}

export function FormHeaderCard({ theme }: FormHeaderCardProps) {
  const { form, selectedElement, selectElement, updateForm } = useBuilderStore();

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
      className="rounded-xl border px-6 py-5 transition-all duration-150"
      style={{
        backgroundColor: theme.colors.cardBg,
        borderColor: selectedElement === null
          ? `color-mix(in oklch, ${theme.colors.cardBorder} 80%, ${theme.colors.primary} 20%)`
          : theme.colors.cardBorder,
        borderWidth: "1px",
        color: theme.colors.cardText,
      }}
      onClick={(e) => {
        e.stopPropagation();
        selectElement(null);
      }}
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
            if (e.key === "Escape") {
              setTitleDraft(form.title);
              setEditingTitle(false);
            }
          }}
          className="w-full bg-transparent font-heading text-2xl font-bold outline-none border-b pb-px"
          style={{
            color: theme.colors.cardText,
            borderColor: theme.colors.primary,
          }}
        />
      ) : (
        <h1
          className="cursor-text font-heading text-2xl font-bold hover:opacity-85 transition-opacity"
          style={{ color: theme.colors.cardText }}
          onClick={(e) => {
            e.stopPropagation();
            setTitleDraft(form.title);
            setEditingTitle(true);
          }}
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
            if (e.key === "Escape") {
              setDescDraft(form.description);
              setEditingDesc(false);
            }
          }}
          rows={2}
          className="mt-2 w-full resize-none rounded-lg border px-3 py-2 text-base outline-none"
          style={{
            backgroundColor: theme.colors.cardInputBg,
            borderColor: theme.colors.cardInputBorder,
            color: theme.colors.cardText,
          }}
        />
      ) : (
        <p
          className="mt-2 cursor-text text-base transition-colors hover:opacity-80"
          style={{ color: theme.colors.cardMuted }}
          onClick={(e) => {
            e.stopPropagation();
            setDescDraft(form.description);
            setEditingDesc(true);
          }}
        >
          {form.description || "Click to add a description…"}
        </p>
      )}

      {/* Expiration deadline badge */}
      {form.deadline && (
        <div
          className="mt-3 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-mono font-medium"
          style={{
            backgroundColor: theme.colors.badgeBg,
            color: theme.colors.badgeText,
          }}
        >
          <Clock className="size-3.5" />
          <span>
            Closes {new Date(form.deadline).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
          </span>
        </div>
      )}
    </div>
  );
}
