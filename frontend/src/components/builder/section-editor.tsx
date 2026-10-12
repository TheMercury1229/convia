"use client";

import * as React from "react";
import { useDrag, useDrop } from "react-dnd";
import {
  GripVertical,
  MoreHorizontal,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  PencilIcon,
} from "lucide-react";
import { ADD_ITEMS } from "@/lib/question-registry";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useBuilderStore, useBuilderTheme } from "@/store/builder-store";
import {
  DND_TYPES,
  type SectionDragItem,
  type PaletteDragItem,
  type QuestionDragItem,
} from "./dnd-types";
import { QuestionCard } from "./question-card";
import type { Section, Question, QuestionType } from "@/types/builder";
import { type FormThemeResolved } from "@/lib/builder-themes";

// ─────────────────────────────────────────────────────────
// Add Question popover
// ─────────────────────────────────────────────────────────



function AddQuestionPopover({ sectionId, theme }: { sectionId: string; theme: FormThemeResolved }) {
  const addQuestion = useBuilderStore((s) => s.addQuestion);
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="flex w-full items-center justify-center gap-2 rounded-md py-2.5 border border-dashed text-sm font-medium transition-all cursor-pointer hover:border-[var(--btn-hover-border)] hover:bg-[var(--btn-hover-bg)] hover:text-[var(--btn-hover-text)]"
          style={{
            borderColor: theme.colors.cardBorder,
            backgroundColor: "transparent",
            color: theme.colors.cardMuted,
            ["--btn-hover-border" as string]: `color-mix(in oklch, ${theme.colors.primary} 50%, ${theme.colors.cardBorder})`,
            ["--btn-hover-bg" as string]: `color-mix(in oklch, ${theme.colors.primary} 7%, transparent)`,
            ["--btn-hover-text" as string]: theme.colors.primary,
          } as React.CSSProperties}
        >
          <Plus className="size-4 text-inherit" />
          Add question
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="center" className="w-56 max-h-80 overflow-y-auto p-1.5" sideOffset={6}>
        <p className="px-2.5 py-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">
          Field type
        </p>
        {ADD_ITEMS.map(({ type, label, Icon }) => (
          <button
            key={type}
            onClick={() => { addQuestion(sectionId, type); setOpen(false); }}
            className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
          >
            <Icon className="size-4 text-muted-foreground" />
            {label}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

// ─────────────────────────────────────────────────────────
// Shared visual indicator for question and section drop slots
// ─────────────────────────────────────────────────────────

interface DropSlotIndicatorProps {
  active: boolean;
  theme: FormThemeResolved;
  isCompact?: boolean;
}

const DropSlotIndicator = React.forwardRef<HTMLDivElement, DropSlotIndicatorProps>(
  ({ active, theme, isCompact }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative flex items-center transition-all duration-100",
        active ? "h-8 py-0" : isCompact ? "h-2" : "h-3",
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-1/2 -translate-y-1/2 h-0.5 rounded-full transition-all duration-100",
          active ? "scale-x-100 opacity-100" : "opacity-0 scale-x-75",
        )}
        style={{ backgroundColor: theme.colors.primary }}
      />
      {active && (
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 size-2 rounded-full ring-2 ring-background"
          style={{ backgroundColor: theme.colors.primary }}
        />
      )}
    </div>
  ),
);
DropSlotIndicator.displayName = "DropSlotIndicator";

// ─────────────────────────────────────────────────────────
// QuestionDropSlot
// ─────────────────────────────────────────────────────────

interface QuestionDropSlotProps {
  sectionId: string;
  insertAt: number;
  theme: FormThemeResolved;
}

function QuestionDropSlot({ sectionId, insertAt, theme }: QuestionDropSlotProps) {
  const { addQuestion, reorderQuestions, moveQuestion, readOnly } = useBuilderStore();

  const [{ isOver, canDrop }, drop] = useDrop<
    PaletteDragItem | QuestionDragItem,
    void,
    { isOver: boolean; canDrop: boolean }
  >(
    () => ({
      accept: [DND_TYPES.PALETTE_COMPONENT, DND_TYPES.QUESTION_CARD],
      canDrop(item) {
        if (readOnly) return false;
        if (item.type === DND_TYPES.QUESTION_CARD) {
          if (item.sectionId === sectionId) {
            return item.index !== insertAt && item.index !== insertAt - 1;
          }
        }
        return true;
      },
      drop(item) {
        if (readOnly) return;
        if (item.type === DND_TYPES.PALETTE_COMPONENT) {
          addQuestion(sectionId, item.questionType as QuestionType, insertAt);
        } else {
          if (item.sectionId === sectionId) {
            reorderQuestions(sectionId, item.index, insertAt);
          } else {
            moveQuestion(item.questionId, sectionId, insertAt);
          }
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [sectionId, insertAt, readOnly],
  );

  if (readOnly) return null;

  return (
    <DropSlotIndicator
      ref={drop as unknown as React.Ref<HTMLDivElement>}
      active={isOver && canDrop}
      theme={theme}
    />
  );
}

// ─────────────────────────────────────────────────────────
// SectionDropSlot — for reordering sections
// ─────────────────────────────────────────────────────────

interface SectionDropSlotProps {
  insertAt: number;
  theme: FormThemeResolved;
}

export function SectionDropSlot({ insertAt, theme }: SectionDropSlotProps) {
  const { reorderSections, readOnly } = useBuilderStore();

  const [{ isOver, canDrop }, drop] = useDrop<
    SectionDragItem,
    void,
    { isOver: boolean; canDrop: boolean }
  >(
    () => ({
      accept: DND_TYPES.SECTION,
      canDrop(item) {
        if (readOnly) return false;
        return item.index !== insertAt && item.index !== insertAt - 1;
      },
      drop(item) {
        if (readOnly) return;
        reorderSections(item.index, insertAt);
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [insertAt, readOnly],
  );

  if (readOnly) return null;

  return (
    <DropSlotIndicator
      ref={drop as unknown as React.Ref<HTMLDivElement>}
      active={isOver && canDrop}
      theme={theme}
      isCompact
    />
  );
}

// ─────────────────────────────────────────────────────────
// Empty-section drop zone (no questions yet)
// ─────────────────────────────────────────────────────────

function EmptySectionDropZone({ sectionId, theme }: { sectionId: string; theme: FormThemeResolved }) {
  // Only subscribe to the actions this component calls — no form/theme resolution here.
  const { addQuestion, moveQuestion, readOnly } = useBuilderStore();

  const [{ isOver, canDrop }, drop] = useDrop<
    PaletteDragItem | QuestionDragItem,
    void,
    { isOver: boolean; canDrop: boolean }
  >(
    () => ({
      accept: [DND_TYPES.PALETTE_COMPONENT, DND_TYPES.QUESTION_CARD],
      canDrop: () => !readOnly,
      drop(item) {
        if (readOnly) return;
        if (item.type === DND_TYPES.PALETTE_COMPONENT) {
          addQuestion(sectionId, item.questionType as QuestionType, 0);
        } else {
          moveQuestion(item.questionId, sectionId, 0);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
        canDrop: monitor.canDrop(),
      }),
    }),
    [sectionId, readOnly],
  );

  return (
    <div
      ref={readOnly ? undefined : (drop as unknown as React.Ref<HTMLDivElement>)}
      className="flex h-20 items-center justify-center rounded-lg border border-dashed transition-all"
      style={{
        borderColor: isOver && canDrop
          ? theme.colors.primary
          : theme.colors.cardBorder,
        backgroundColor: isOver && canDrop
          ? `color-mix(in oklch, ${theme.colors.primary} 7%, transparent)`
          : "transparent",
        color: isOver && canDrop ? theme.colors.primary : theme.colors.cardMuted,
      }}
    >
      <p className="text-sm font-medium">
        {readOnly
          ? "No questions in this section"
          : isOver && canDrop
            ? "Release to add here"
            : "Drop a component or use + Add question"}
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SectionEditor
// ─────────────────────────────────────────────────────────

interface SectionEditorProps {
  section: Section;
  index: number;
  isFirst?: boolean;
  isLast?: boolean;
}

export function SectionEditor({
  section,
  index,
  isFirst = false,
  isLast = false,
}: SectionEditorProps) {
  const {
    questions: allQuestions,
    selectedElement,
    selectElement,
    updateSection,
    deleteSection,
    moveSectionUp,
    moveSectionDown,
    readOnly,
  } = useBuilderStore();

  const currentTheme = useBuilderTheme();

  const questions: Question[] = allQuestions
    .filter((q) => q.sectionId === section.id)
    .sort((a, b) => a.position - b.position);

  const isSelected = selectedElement?.id === section.id;

  const [editingTitle, setEditingTitle] = React.useState(false);
  const [titleDraft, setTitleDraft] = React.useState(section.title);
  const titleInputRef = React.useRef<HTMLInputElement>(null);
  const headerRef = React.useRef<HTMLDivElement>(null);

  // Sync title draft when section.title changes externally
  React.useEffect(() => { setTitleDraft(section.title); }, [section.title]);
  React.useEffect(() => { if (editingTitle) titleInputRef.current?.focus(); }, [editingTitle]);

  const commitTitle = () => {
    if (readOnly) return;
    updateSection(section.id, { title: titleDraft.trim() || "Untitled Section" });
    setEditingTitle(false);
  };

  // ── Section drag source (only from the grip handle) ──
  const [{ isDragging }, drag, dragPreview] = useDrag<
    SectionDragItem,
    void,
    { isDragging: boolean }
  >(() => ({
    type: DND_TYPES.SECTION,
    item: () => ({ type: DND_TYPES.SECTION, sectionId: section.id, index }),
    canDrag: () => !readOnly,
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  }), [section.id, index, readOnly]);

  // Attach drag preview to the section card (not the grip alone)
  const sectionRef = React.useRef<HTMLDivElement>(null);
  dragPreview(sectionRef);

  return (
    <div
      ref={sectionRef}
      className={cn(
        "rounded-xl border transition-all duration-150 min-w-0 max-w-full overflow-hidden",
        isDragging && "opacity-40",
      )}
      style={{
        backgroundColor: currentTheme.colors.cardBg,
        borderColor: isSelected
          ? `color-mix(in oklch, ${currentTheme.colors.cardBorder} 70%, ${currentTheme.colors.primary} 30%)`
          : currentTheme.colors.cardBorder,
        borderWidth: "1px",
        color: currentTheme.colors.cardText,
      }}
      onClick={(e) => {
        e.stopPropagation();
        selectElement({ type: "section", id: section.id });
      }}
    >
      {/* ── Section header ───────────────────────────── */}
      <div
        ref={headerRef}
        className="group flex items-center gap-2.5 border-b px-5 py-3.5 min-w-0 overflow-hidden"
        style={{ borderColor: currentTheme.colors.cardBorder }}
      >
        {/* Drag grip */}
        {!readOnly && (
          <div
            ref={drag as unknown as React.Ref<HTMLDivElement>}
            className="cursor-grab opacity-0 group-hover:opacity-100 transition-opacity active:cursor-grabbing shrink-0"
            onClick={(e) => e.stopPropagation()}
            title="Drag to reorder section"
          >
            <GripVertical className="size-4.5 text-muted-foreground/50" />
          </div>
        )}

        {/* Title */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {!readOnly && editingTitle ? (
            <input
              ref={titleInputRef}
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitTitle();
                if (e.key === "Escape") { setTitleDraft(section.title); setEditingTitle(false); }
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-transparent text-base font-semibold outline-none border-b pb-px break-words"
              style={{
                color: currentTheme.colors.cardText,
                borderColor: currentTheme.colors.primary,
              }}
            />
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <h3
                className="text-base font-semibold truncate break-words min-w-0"
                style={{ color: currentTheme.colors.cardText }}
              >
                {section.title}
              </h3>
              {!readOnly && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setTitleDraft(section.title);
                    setEditingTitle(true);
                  }}
                  className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity cursor-pointer shrink-0"
                  title="Edit section title"
                >
                  <PencilIcon className="size-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          )}
          {section.description && (
            <p
              className="text-sm mt-1 truncate break-words min-w-0"
              style={{ color: currentTheme.colors.cardMuted }}
            >
              {section.description}
            </p>
          )}
        </div>

        {/* Section actions: move up/down + menu */}
        {!readOnly && (
          <div
            className={cn(
              "flex items-center gap-0.5 transition-opacity shrink-0",
              isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
          >
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:pointer-events-none"
              onClick={(e) => {
                e.stopPropagation();
                moveSectionUp(section.id);
              }}
              disabled={isFirst}
              title="Move section up"
            >
              <ArrowUp className="size-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:opacity-25 disabled:pointer-events-none"
              onClick={(e) => {
                e.stopPropagation();
                moveSectionDown(section.id);
              }}
              disabled={isLast}
              title="Move section down"
            >
              <ArrowDown className="size-4" />
            </Button>

            {/* Section menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                >
                  <MoreHorizontal className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSection(section.id);
                  }}
                >
                  <Trash2 className="size-4 mr-2" />
                  Delete section
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {/* ── Question list with interleaved drop slots ─ */}
      <div className="px-5 pb-5 pt-3">
        {questions.length === 0 ? (
          <EmptySectionDropZone sectionId={section.id} theme={currentTheme} />
        ) : (
          <div>
            {/* Slot before the first card */}
            {!readOnly && (
              <QuestionDropSlot sectionId={section.id} insertAt={0} theme={currentTheme} />
            )}

            {questions.map((q, idx) => (
              <React.Fragment key={q.id}>
                <QuestionCard
                  question={q}
                  index={idx}
                  isFirst={idx === 0}
                  isLast={idx === questions.length - 1}
                  theme={currentTheme}
                />
                {/* Slot after each card */}
                {!readOnly && (
                  <QuestionDropSlot sectionId={section.id} insertAt={idx + 1} theme={currentTheme} />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Add question button */}
        {!readOnly && (
          <div className="mt-2">
            <AddQuestionPopover theme={currentTheme} sectionId={section.id} />
          </div>
        )}
      </div>
    </div>
  );
}
