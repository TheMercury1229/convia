"use client";

import * as React from "react";
import { Check, Clock, Globe, Palette, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useBuilderStore } from "@/store/builder-store";
import { BUILDER_THEMES } from "@/lib/builder-themes";

// --------------------------------------------------------
// Helper UI wrappers
// --------------------------------------------------------

function SettingsSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
        {Icon && <Icon className="size-3.5 text-primary/80" />}
        <span>{title}</span>
      </div>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

// --------------------------------------------------------
// Main Form Settings Component
// --------------------------------------------------------

export function FormSettingsPanel() {
  const { form, updateForm } = useBuilderStore();

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const formatted = raw
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-");
    updateForm({ slug: formatted });
  };

  // Helper to format ISO or Date string into local YYYY-MM-DDTHH:mm for datetime-local input
  const formatToDatetimeLocal = (isoStr?: string | null): string => {
    if (!isoStr) return "";
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return "";
    const pad = (n: number) => n.toString().padStart(2, "0");
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const hasDeadline = Boolean(form.deadline);

  const handleDeadlineToggle = (checked: boolean) => {
    if (!checked) {
      updateForm({ deadline: null });
    } else {
      // Default to 7 days from now at end of day (23:59)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      nextWeek.setHours(23, 59, 0, 0);
      updateForm({ deadline: nextWeek.toISOString() });
    }
  };

  const currentThemeId = form.themeId || "nova";

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* ── 1. General Info & URL ─────────────────────────── */}
      <SettingsSection title="General" icon={Globe}>
        {/* Title */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="settings-form-title" className="text-xs font-medium text-muted-foreground">
            Form Title
          </Label>
          <Input
            id="settings-form-title"
            value={form.title}
            onChange={(e) => updateForm({ title: e.target.value })}
            placeholder="Form title"
            className="h-9 text-sm"
          />
        </div>

        {/* Slug */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="settings-form-slug" className="text-xs font-medium text-muted-foreground">
            URL Slug
          </Label>
          <div className="flex items-center rounded-md border border-input bg-muted/30 focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40">
            <span className="shrink-0 select-none pl-3 text-xs font-mono text-muted-foreground">
              form/
            </span>
            <input
              id="settings-form-slug"
              type="text"
              value={form.slug ?? ""}
              onChange={handleSlugChange}
              placeholder="my-form-slug"
              className="h-9 w-full min-w-0 bg-transparent px-1.5 text-xs font-mono text-foreground outline-none"
            />
          </div>
        </div>
      </SettingsSection>

      {/* ── 2. Deadline ────────────────────────────────────── */}
      <SettingsSection title="Deadline" icon={Clock}>
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted/20 p-3">
          <div className="flex flex-col gap-0.5">
            <Label htmlFor="settings-deadline-toggle" className="text-sm font-medium cursor-pointer">
              Set Expiration Deadline
            </Label>
            <span className="text-xs text-muted-foreground">
              Automatically close form after this date
            </span>
          </div>
          <Switch
            id="settings-deadline-toggle"
            checked={hasDeadline}
            onCheckedChange={handleDeadlineToggle}
          />
        </div>

        {hasDeadline && (
          <div className="flex flex-col gap-2 pl-1">
            <div className="flex items-center gap-2">
              <Calendar className="size-4 text-muted-foreground shrink-0" />
              <Input
                type="datetime-local"
                value={formatToDatetimeLocal(form.deadline)}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val || !val.trim()) {
                    updateForm({ deadline: null });
                  } else {
                    const d = new Date(val);
                    if (!isNaN(d.getTime())) {
                      updateForm({ deadline: d.toISOString() });
                    }
                  }
                }}
                className="h-9 text-xs font-mono bg-background"
              />
            </div>
            {form.deadline && (
              <p className="text-[11px] text-muted-foreground pl-6">
                Closes {new Date(form.deadline).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
              </p>
            )}
          </div>
        )}
      </SettingsSection>

      {/* ── 3. Themes (Only name and icon in 3x2 grid) ─────── */}
      <SettingsSection title="Theme" icon={Palette}>
        <div className="grid grid-cols-3 gap-2">
          {BUILDER_THEMES.map((theme) => {
            const isSelected = currentThemeId === theme.id;

            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => updateForm({ themeId: theme.id })}
                className={cn(
                  "group relative flex flex-col items-center justify-center gap-2 rounded-xl border py-3 px-2 text-center transition-all cursor-pointer",
                  isSelected
                    ? "border-primary bg-primary/10 ring-1 ring-primary/40 shadow-xs"
                    : "border-border/60 bg-card hover:bg-muted/40 hover:border-border"
                )}
              >
                <img
                  src={`https://api.dicebear.com/9.x/glass/svg?seed=${theme.avatarSeed}`}
                  alt={theme.name}
                  className="size-10 rounded-lg border border-border/40 shrink-0 bg-background/50 object-cover shadow-2xs transition-transform group-hover:scale-105"
                />

                <span className="text-xs font-semibold text-foreground truncate max-w-full">
                  {theme.name}
                </span>

                {isSelected && (
                  <div className="absolute top-1.5 right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-2xs">
                    <Check className="size-2.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </SettingsSection>

    </div>
  );
}
