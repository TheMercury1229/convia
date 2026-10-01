"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { FormResponse } from "@/lib/api/responses";
import type { ApiQuestion, ApiSection } from "@/lib/api/forms";
import {
  Copy,
  Check,
  Star,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface ResponseDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  response: FormResponse | null;
  questions: ApiQuestion[];
  sections?: (ApiSection & { questions?: ApiQuestion[] })[];
  responseIndex?: number;
}

export function ResponseDetailDialog({
  isOpen,
  onClose,
  response,
  questions,
  sections,
}: ResponseDetailDialogProps) {
  const [copied, setCopied] = React.useState(false);

  // Group answerable questions by sections
  const sectionList = React.useMemo(() => {
    if (!sections || sections.length === 0) return [];

    const list = sections
      .map((sec, idx) => {
        const secQuestions = questions.filter(
          (q) => q.sectionId === sec.id && q.type !== "heading"
        );
        return {
          id: sec.id,
          title: sec.title?.trim() || `Section ${idx + 1}`,
          description: sec.description?.trim() || null,
          position: sec.position ?? idx,
          questions: secQuestions,
        };
      })
      .filter((sec) => sec.questions.length > 0)
      .sort((a, b) => a.position - b.position);

    // Any answerable questions without matching sectionId
    const knownIds = new Set(list.map((s) => s.id));
    const unassigned = questions.filter(
      (q) => q.type !== "heading" && (!q.sectionId || !knownIds.has(q.sectionId))
    );
    if (unassigned.length > 0) {
      list.push({
        id: "unassigned",
        title: "Other Questions",
        description: null,
        position: 9999,
        questions: unassigned,
      });
    }

    return list;
  }, [sections, questions]);

  const hasMultipleSections = sectionList.length > 1;

  // Track active tab: default to first section if multiple sections exist
  const [activeTab, setActiveTab] = React.useState<string>("all");

  React.useEffect(() => {
    if (isOpen) {
      if (hasMultipleSections && sectionList.length > 0) {
        setActiveTab(sectionList[0].id);
      } else {
        setActiveTab("all");
      }
    }
  }, [isOpen, response?.id, hasMultipleSections, sectionList]);

  if (!response) return null;

  const isCompleted = (response.completionRate ?? 100) >= 100;
  const submittedDate = response.submittedAt
    ? new Date(response.submittedAt)
    : new Date();

  // Create question -> answer lookup map
  const answerMap = new Map<string, unknown>();
  for (const a of response.answers || []) {
    answerMap.set(a.questionId, a.value);
    answerMap.set(a.fieldName, a.value);
  }

  const currentSection = sectionList.find((s) => s.id === activeTab);

  const displayedQuestions =
    hasMultipleSections && activeTab !== "all" && currentSection
      ? currentSection.questions
      : questions.filter((q) => q.type !== "heading");

  const handleCopyAnswers = () => {
    const questionsToCopy = displayedQuestions;

    const formatted = questionsToCopy
      .map((q) => {
        const val = answerMap.get(q.id) ?? answerMap.get(q.fieldName) ?? "Not answered";
        const valStr = typeof val === "object" ? JSON.stringify(val) : String(val);
        return `${q.label}\n${valStr}`;
      })
      .join("\n\n");

    navigator.clipboard.writeText(formatted);
    setCopied(true);
    toast.success(
      hasMultipleSections && activeTab !== "all"
        ? `"${currentSection?.title}" answers copied to clipboard`
        : "Answers copied to clipboard"
    );
    setTimeout(() => setCopied(false), 2000);
  };

  const renderQuestionItem = (q: ApiQuestion) => {
    const rawValue = answerMap.get(q.id) ?? answerMap.get(q.fieldName);
    const hasValue =
      rawValue !== undefined &&
      rawValue !== null &&
      rawValue !== "" &&
      !(Array.isArray(rawValue) && rawValue.length === 0);

    return (
      <div key={q.id} className="py-4.5 first:pt-3 last:pb-3 space-y-2">
        {/* Question Label with red asterisk if required */}
        <h4 className="text-sm font-medium text-muted-foreground leading-snug flex items-center gap-1">
          <span>{q.label}</span>
          {q.isRequired && (
            <span className="text-red-500 font-semibold text-sm leading-none" title="Required">
              *
            </span>
          )}
        </h4>

        {/* Answer Value */}
        <div className="text-base font-medium text-foreground leading-relaxed">
          {!hasValue ? (
            <span className="text-muted-foreground/40 font-normal text-sm">—</span>
          ) : (
            renderAnswerValue(q.type, rawValue)
          )}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-3xl lg:max-w-4xl w-full max-h-[85vh] flex flex-col p-0 gap-0 overflow-hidden sm:rounded-2xl border-border bg-card">
        {/* ---------------------------------------------------------------- */}
        {/* Header: Title + Completion on Left, Date + Copy on Right         */}
        {/* ---------------------------------------------------------------- */}
        <DialogHeader className="p-6 pb-4 border-b border-border bg-muted/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-12">
            {/* Left: Title + Completion Pill */}
            <div className="flex items-center gap-3">
              <DialogTitle className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
                Submission Details
              </DialogTitle>
              <span className="inline-flex items-center gap-1.5 text-xs font-mono font-medium px-2.5 py-0.5 rounded-full border border-border bg-muted/40 text-foreground">
                <span
                  className={`size-1.5 rounded-full ${
                    isCompleted ? "bg-primary" : "bg-muted-foreground/50"
                  }`}
                />
                {isCompleted ? "100% Complete" : `${response.completionRate ?? 0}% Partial`}
              </span>
            </div>

            {/* Right: Detailed Timestamp + Copy Button */}
            <TooltipProvider delayDuration={150}>
              <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-medium shrink-0">
                <div className="flex items-center gap-1.5">
                  <Calendar className="size-3.5" />
                  <span>{format(submittedDate, "PPP 'at' p")}</span>
                </div>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleCopyAnswers}
                      className="size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    >
                      {copied ? (
                        <Check className="size-4 text-primary" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                      <span className="sr-only">Copy answers</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {copied
                      ? "Copied!"
                      : hasMultipleSections && activeTab !== "all"
                      ? `Copy ${currentSection?.title || "section"} answers`
                      : "Copy answers"}
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          </div>
        </DialogHeader>

        {/* ---------------------------------------------------------------- */}
        {/* Muted Tab Structure for Multiple Sections                        */}
        {/* ---------------------------------------------------------------- */}
        {hasMultipleSections && (
          <div className="border-b border-border/50 bg-muted/20 px-6 py-2">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {sectionList.map((sec) => {
                const isActive = activeTab === sec.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => setActiveTab(sec.id)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? "bg-background text-foreground shadow-xs border border-border/80 font-semibold"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                    }`}
                  >
                    <span className="truncate max-w-[160px] sm:max-w-[200px]">
                      {sec.title}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full transition-colors ${
                        isActive
                          ? "bg-muted text-foreground"
                          : "bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      {sec.questions.length}
                    </span>
                  </button>
                );
              })}

              {/* All Questions Tab */}
              <button
                type="button"
                onClick={() => setActiveTab("all")}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  activeTab === "all"
                    ? "bg-background text-foreground shadow-xs border border-border/80 font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent"
                }`}
              >
                <span>All Questions</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full transition-colors ${
                    activeTab === "all"
                      ? "bg-muted text-foreground"
                      : "bg-muted/50 text-muted-foreground"
                  }`}
                >
                  {questions.filter((q) => q.type !== "heading").length}
                </span>
              </button>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* Clean, Uncluttered Question & Answer List                        */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex-1 overflow-y-auto px-6 py-2 divide-y divide-border/40 max-h-[70vh]">
          {questions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No questions found for this form.
            </div>
          ) : hasMultipleSections && activeTab === "all" ? (
            // All Tab: show sections with clean demarcations
            <div className="space-y-6 py-2">
              {sectionList.map((sec, secIdx) => (
                <div key={sec.id} className={secIdx > 0 ? "pt-4 border-t border-border/40" : ""}>
                  <div className="pb-3">
                    <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {sec.title}
                    </h5>
                    {sec.description && (
                      <p className="text-xs text-muted-foreground/70 mt-0.5">
                        {sec.description}
                      </p>
                    )}
                  </div>
                  <div className="divide-y divide-border/30">
                    {sec.questions.map((q) => renderQuestionItem(q))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Single Section View
            <div className="divide-y divide-border/40">
              {hasMultipleSections && currentSection?.description && (
                <div className="py-2.5 text-xs text-muted-foreground/80 italic border-b border-border/30">
                  {currentSection.description}
                </div>
              )}
              {displayedQuestions.map((q) => renderQuestionItem(q))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Render Helper for various Question Types
// ---------------------------------------------------------------------------

function renderAnswerValue(type: string, value: unknown): React.ReactNode {
  // 1. Rating
  if (type === "rating" && typeof value === "number") {
    return (
      <div className="flex items-center gap-1.5 pt-0.5">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`size-4 ${
                i < value
                  ? "text-primary fill-primary"
                  : "text-muted-foreground/20 fill-muted-foreground/10"
              }`}
            />
          ))}
        </div>
        <span className="text-sm font-mono font-medium text-foreground">{value} / 5</span>
      </div>
    );
  }

  // 2. Multi-Select / Checkbox Array
  if (Array.isArray(value)) {
    return (
      <div className="flex flex-wrap gap-1.5 pt-0.5">
        {value.map((item, i) => (
          <span
            key={i}
            className="text-sm px-2.5 py-0.5 rounded-md font-mono border border-border bg-muted/30 text-foreground"
          >
            {String(item)}
          </span>
        ))}
      </div>
    );
  }

  // 3. Yes / No or Boolean
  if (type === "yes_no" || typeof value === "boolean") {
    const isYes = value === true || value === "Yes" || value === "true" || value === 1;
    return (
      <span className="text-sm px-2.5 py-0.5 font-medium rounded-md border border-border bg-muted/30 text-foreground font-mono inline-block">
        {isYes ? "Yes" : "No"}
      </span>
    );
  }

  // 4. URL or Link
  if (type === "url" && typeof value === "string") {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-4 hover:opacity-80 flex items-center gap-1 text-sm font-mono"
      >
        {value}
        <ExternalLink className="size-3.5" />
      </a>
    );
  }

  // 5. Long text / Textarea / Paragraph
  if (type === "textarea" || type === "paragraph") {
    return (
      <p className="text-base text-foreground whitespace-pre-wrap leading-relaxed font-normal">
        {String(value)}
      </p>
    );
  }

  // Default string / number fallback
  return (
    <span className="text-base font-medium text-foreground">
      {String(value)}
    </span>
  );
}
