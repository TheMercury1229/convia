"use client";

import * as React from "react";
import Image from "next/image";
import {
  ArrowUp,
  RotateCcw,
  Undo2,
  X,
  Check,
  Copy,
  FileText,
  Layers,
  HelpCircle,
  Hash,
  Mail,
  Calendar,
  ListFilter,
  CheckSquare,
  Star,
  UploadCloud,
  Link2,
  Clock,
  ToggleLeft,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GrizzyMarkdown } from "@/components/analytics/grizzy-markdown";
import { useBuilderStore } from "@/store/builder-store";
import { useGrizzyBuilderChat } from "@/hooks/use-grizzy-builder-chat";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { GrizzyChangeReviewCard } from "@/components/builder/grizzy-change-review-card";
import { CreditGateInline } from "@/components/billing/credit-gate";

// Icon mapper for question types
function getQuestionTypeIcon(type?: string) {
  switch (type) {
    case "text":
    case "textarea":
    case "paragraph":
      return FileText;
    case "number":
      return Hash;
    case "email":
      return Mail;
    case "date":
    case "datetime":
      return Calendar;
    case "time":
      return Clock;
    case "select":
    case "radio":
      return ListFilter;
    case "checkbox":
    case "multi_select":
      return CheckSquare;
    case "rating":
    case "scale":
      return Star;
    case "file":
      return UploadCloud;
    case "url":
      return Link2;
    case "yes_no":
      return ToggleLeft;
    default:
      return HelpCircle;
  }
}

// ---------------------------------------------------------------------------
// GrizzyBuilderPanel Component
// ---------------------------------------------------------------------------

export function GrizzyBuilderPanel() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  const userInitials = user?.name
    ? user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
    : "ME";

  const {
    form,
    sections,
    questions,
    selectedElement,
    setRightPanelTab,
  } = useBuilderStore();

  const {
    messages,
    isStreaming,
    error,
    sendMessage,
    retryLastMessage,
    clearChat,
    acceptChanges,
    rejectChanges,
  } = useGrizzyBuilderChat();

  const [actionLoadingId, setActionLoadingId] = React.useState<string | null>(null);

  const handleAccept = async (messageId: string) => {
    setActionLoadingId(messageId);
    try {
      await acceptChanges(messageId);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (messageId: string) => {
    setActionLoadingId(messageId);
    try {
      await rejectChanges(messageId);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Active target context resolution
  const selectedQuestion = React.useMemo(() => {
    if (selectedElement?.type === "question") {
      return questions.find((q) => q.id === selectedElement.id);
    }
    return null;
  }, [selectedElement, questions]);

  const selectedSection = React.useMemo(() => {
    if (selectedElement?.type === "section") {
      return sections.find((s) => s.id === selectedElement.id);
    }
    return null;
  }, [selectedElement, sections]);

  const [input, setInput] = React.useState("");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll on new messages or streaming deltas
  React.useEffect(() => {
    if (isStreaming) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming]);

  // Focus textarea when panel opens
  React.useEffect(() => {
    const timer = setTimeout(() => {
      textareaRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Dynamic suggestions based on selectedElement
  const suggestions = React.useMemo(() => {
    if (!selectedElement) {
      return [
        { id: "s1", title: "Add 5-star rating", query: "Add a 5-star rating question for satisfaction" },
        { id: "s2", title: "Make all required", query: "Make all questions in this form required" },
        { id: "s3", title: "Add Contact section", query: "Add a new section for Contact Information" },
        { id: "s4", title: "Add Net Promoter Score", query: "Add a 0-10 Net Promoter Score question" },
      ];
    }

    if (selectedElement.type === "section") {
      return [
        { id: "sec1", title: "Rename section", query: "Rename this section to Contact Details" },
        { id: "sec2", title: "Add email field", query: "Add an email question inside this section" },
        { id: "sec3", title: "Add section description", query: "Write a clear, welcoming description for this section" },
      ];
    }

    if (selectedElement.type === "question" && selectedQuestion) {
      const type = selectedQuestion.type;
      const list: Array<{ id: string; title: string; query: string }> = [];

      if (!selectedQuestion.required) {
        list.push({ id: "q-req", title: "Make required", query: "Make this question required" });
      } else {
        list.push({ id: "q-opt", title: "Make optional", query: "Make this question optional" });
      }

      switch (type) {
        case "text":
        case "textarea":
          list.push({ id: "q-len", title: "Min 10 characters", query: "Set minimum length to 10 characters" });
          list.push({ id: "q-ph", title: "Add placeholder", query: "Add a clear placeholder example for this input" });
          break;
        case "number":
          list.push({ id: "q-num", title: "Set range 1–100", query: "Set minimum value to 1 and maximum value to 100" });
          list.push({ id: "q-int", title: "Integers only", query: "Allow only whole numbers" });
          break;
        case "email":
          list.push({ id: "q-work", title: "Block free emails", query: "Disallow free personal email providers" });
          list.push({ id: "q-eph", title: "Add work email hint", query: "Set placeholder to 'you@company.com'" });
          break;
        case "date":
        case "datetime":
          list.push({ id: "q-past", title: "Disable past dates", query: "Do not allow past dates to be selected" });
          list.push({ id: "q-drange", title: "Set date range", query: "Set max date to one month from now" });
          break;
        case "file":
          list.push({ id: "q-fsize", title: "Limit to 5MB", query: "Limit max file size to 5MB" });
          list.push({ id: "q-fext", title: "Allow only PDF", query: "Only allow .pdf file uploads" });
          break;
        case "select":
        case "radio":
        case "checkbox":
        case "multi_select":
          list.push({ id: "q-other", title: "Allow 'Other'", query: "Enable 'Other' option so users can type custom answers" });
          list.push({ id: "q-opts", title: "Add more options", query: "Add 'High', 'Medium', and 'Low' options" });
          break;
        default:
          list.push({ id: "q-lbl", title: "Improve label", query: "Reword this question label to be friendlier and clearer" });
          list.push({ id: "q-desc", title: "Add description", query: "Add a helpful description explaining why we ask this" });
      }

      return list.slice(0, 4);
    }

    return [
      { id: "f1", title: "Review form", query: "Review my form structure and suggest improvements" },
      { id: "f2", title: "Make concise", query: "Suggest ways to make this form shorter and higher converting" },
    ];
  }, [selectedElement, selectedQuestion]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const handleSend = (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || isStreaming) return;

    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }

    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyMessage = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  // Extract active constraint pills from selected question validation
  const activeValidationList = React.useMemo(() => {
    if (!selectedQuestion?.validation) return [];
    const v = selectedQuestion.validation;
    const entries: string[] = [];

    if (v.minLength !== undefined) entries.push(`minLength: ${v.minLength}`);
    if (v.maxLength !== undefined) entries.push(`maxLength: ${v.maxLength}`);
    if (v.min !== undefined) entries.push(`min: ${v.min}`);
    if (v.max !== undefined) entries.push(`max: ${v.max}`);
    if (v.disallowFreeEmails) entries.push("work emails only");
    if (v.disablePastDates) entries.push("no past dates");
    if (v.maxFileSizeMB) entries.push(`max ${v.maxFileSizeMB}MB`);
    if (v.allowedExtensions) entries.push(v.allowedExtensions);
    if (v.minSelections) entries.push(`min ${v.minSelections} choices`);
    if (v.mustBeYes) entries.push("must agree");

    return entries;
  }, [selectedQuestion]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex h-full w-full flex-col bg-background overflow-hidden">
        {/* ────────────────────────────────────────────────────────── */}
        {/* HEADER (Inspired by Analytics Chat Sheet Header)          */}
        {/* ────────────────────────────────────────────────────────── */}
        <div className="px-4 py-3 border-b border-border/60 shrink-0 flex items-center justify-between gap-3 bg-background">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="size-7 shrink-0 rounded-full bg-primary/10 ring-1 ring-border/80 overflow-hidden flex items-center justify-center">
              <Image
                src="/grizzy/avatar.png"
                alt="Grizzy"
                width={28}
                height={28}
                className="object-contain"
                style={{ width: "auto", height: "auto" }}
              />
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-sm font-semibold tracking-tight text-foreground">
                Ask Grizzy
              </span>
              {form.title && (
                <span className="text-xs text-muted-foreground truncate max-w-[140px] sm:max-w-[180px]">
                  • {form.title}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={clearChat}
                  disabled={messages.length <= 1 || isStreaming}
                  className="size-7 rounded-md text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-40"
                  aria-label="Reset conversation"
                >
                  <RotateCcw className="size-3.5" />
                  <span className="sr-only">Reset conversation</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Reset conversation
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setRightPanelTab("properties")}
                  className="size-7 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label="Back to Properties"
                >
                  <X className="size-3.5" />
                  <span className="sr-only">Back to Properties</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                Back to Properties
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* ────────────────────────────────────────────────────────── */}
        {/* CHAT MESSAGES BODY                                         */}
        {/* ────────────────────────────────────────────────────────── */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto px-4 py-5 space-y-5 text-sm"
        >
          {messages.map((message) => {
            const isAi = message.role === "assistant";
            const isWelcome = message.id.startsWith("welcome");

            return (
              <div
                key={message.id}
                className={cn(
                  "flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200",
                  isAi ? "items-start" : "items-end"
                )}
              >
                <div
                  className={cn(
                    "flex items-start gap-2",
                    isAi ? "w-full max-w-[96%] flex-row" : "max-w-[85%] flex-row-reverse",
                  )}
                >
                  {/* Avatar */}
                  {isAi ? (
                    <div className="size-6 shrink-0 rounded-full bg-primary/10 ring-1 ring-border/80 overflow-hidden flex items-center justify-center mt-0.5">
                      <Image
                        src="/grizzy/avatar.png"
                        alt="Grizzy"
                        width={24}
                        height={24}
                        className="object-contain"
                        style={{ width: "auto", height: "auto" }}
                      />
                    </div>
                  ) : (
                    <Avatar className="size-6 shrink-0 ring-1 ring-border/80 mt-0.5">
                      <AvatarImage src={user?.image ?? undefined} />
                      <AvatarFallback className="text-[10px] font-semibold bg-muted text-foreground">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  {/* Bubble */}
                  <div
                    className={cn(
                      "relative group rounded-xl px-3 py-2 text-xs leading-relaxed min-w-0 flex-1",
                      isAi
                        ? message.isError
                          ? "bg-destructive/5 border border-destructive/30 text-card-foreground rounded-tl-xs"
                          : "bg-card border border-border/80 text-card-foreground rounded-tl-xs"
                        : "bg-primary text-primary-foreground rounded-tr-xs ml-auto flex-initial",
                    )}
                  >
                    {isAi ? (
                      <div>
                        {message.content ? (
                          <GrizzyMarkdown content={message.content} />
                        ) : null}

                        {/* Error state inside bubble */}
                        {message.isError && (
                          message.errorMessage?.toLowerCase().includes("credit") ||
                          message.errorMessage?.includes("402") ? (
                            <CreditGateInline
                              actionName="Grizzy Builder"
                              requiredCredits={0.5}
                              className="mt-2"
                            />
                          ) : (
                            <div className={cn("flex flex-col gap-2", message.content && "mt-2 pt-2 border-t border-destructive/20")}>
                              <div className="flex items-start gap-2 text-destructive text-xs">
                                <AlertCircle className="size-4 shrink-0 mt-0.5" />
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-xs text-destructive">
                                    Unable to apply changes
                                  </p>
                                  <p className="text-xs text-muted-foreground leading-relaxed">
                                    {message.errorMessage || "An error occurred with the AI builder."}
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={retryLastMessage}
                                disabled={isStreaming}
                                className="h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/10 cursor-pointer self-start"
                              >
                                <RotateCcw className="size-3 mr-1" />
                                Retry
                              </Button>
                            </div>
                          )
                        )}

                        {/* Typing dots while awaiting first token */}
                        {isStreaming && !message.content && !message.isError && (
                          <div className="flex items-center gap-1.5 py-0.5 text-muted-foreground">
                            <span className="size-1.5 rounded-full bg-primary animate-bounce" />
                            <span
                              className="size-1.5 rounded-full bg-primary animate-bounce"
                              style={{ animationDelay: "150ms" }}
                            />
                            <span
                              className="size-1.5 rounded-full bg-primary animate-bounce"
                              style={{ animationDelay: "300ms" }}
                            />
                            <span className="text-xs ml-1.5 text-muted-foreground font-mono">
                              Grizzy is thinking…
                            </span>
                          </div>
                        )}

                        {/* Change Review Card (Cursor Composer / v0 Diff Card Style) */}
                        {((message.changeItems && message.changeItems.length > 0) ||
                          (message.appliedChanges && message.appliedChanges.length > 0)) && (
                            <GrizzyChangeReviewCard
                              messageId={message.id}
                              changeItems={message.changeItems}
                              appliedChanges={message.appliedChanges}
                              status={message.changeStatus}
                              isLoading={actionLoadingId === message.id}
                              onAccept={handleAccept}
                              onReject={handleReject}
                            />
                          )}

                        {/* Timestamp & Copy on Hover */}
                        {message.content && !isStreaming && !message.isError && (
                          <div className="mt-2 pt-1.5 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                            <span className="font-mono text-[10px]">
                              {new Date(message.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleCopyMessage(message.id, message.content)
                                  }
                                  className="size-6 rounded-md text-muted-foreground hover:text-foreground cursor-pointer"
                                >
                                  {copiedId === message.id ? (
                                    <Check className="size-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="size-3" />
                                  )}
                                  <span className="sr-only">Copy message</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="text-xs">
                                {copiedId === message.id ? "Copied" : "Copy message"}
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    )}
                  </div>
                </div>

                {/* Suggestions Pills Aligned with Indent (Analytics pattern) */}
                {isWelcome && messages.length === 1 && !isStreaming && (
                  <div className="pl-9.5 pt-2 flex flex-wrap items-center gap-1.5 animate-in fade-in duration-200">
                    {suggestions.map((suggestion) => (
                      <Badge
                        key={suggestion.id}
                        variant="outline"
                        onClick={() => handleSend(suggestion.query)}
                        className="px-2.5 py-1 text-xs font-normal text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer transition-colors border-border/70 rounded-full"
                      >
                        {suggestion.title}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Standalone Error Banner if not in a message bubble */}
          {error && !messages.some((m) => m.isError) && (
            <div className="flex items-center justify-between gap-3 p-3 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={retryLastMessage}
                disabled={isStreaming}
                className="h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/20 cursor-pointer"
              >
                <RotateCcw className="size-3 mr-1" />
                Retry
              </Button>
            </div>
          )}

          <div ref={messagesEndRef} className="h-1" />
        </div>

        {/* ────────────────────────────────────────────────────────── */}
        {/* INPUT CONTAINER (Analytics Sheet Pattern)                   */}
        {/* ────────────────────────────────────────────────────────── */}
        <div className="p-3 sm:p-4 bg-background shrink-0 border-t border-border/60 space-y-2">
          {/* Live Context Indicator Pill */}
          <div className="flex items-center justify-between gap-1.5 rounded-lg bg-muted/40 border border-border/60 px-2.5 py-1 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              {selectedQuestion ? (
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-medium text-foreground truncate max-w-[150px]">
                    {selectedQuestion.label || "Untitled Question"}
                  </span>
                  <Badge variant="secondary" className="h-4.5 px-1.5 text-[10px] font-mono">
                    {selectedQuestion.type}
                  </Badge>
                  {selectedQuestion.required && (
                    <Badge variant="outline" className="h-4.5 px-1.5 text-[10px] text-destructive border-destructive/30">
                      required
                    </Badge>
                  )}
                </div>
              ) : selectedSection ? (
                <div className="flex items-center gap-1.5 truncate">
                  <span className="font-medium text-foreground truncate max-w-[180px]">
                    {selectedSection.title || "Untitled Section"}
                  </span>
                  <Badge variant="secondary" className="h-4.5 px-1.5 text-[10px]">
                    section
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 truncate text-muted-foreground">
                  <span className="font-medium text-foreground truncate max-w-[180px]">
                    {form.title || "Untitled Form"}
                  </span>
                  <span className="text-xs">
                    ({questions.length} questions)
                  </span>
                </div>
              )}
            </div>

            {/* Active validation preview */}
            {activeValidationList.length > 0 && (
              <span
                className="shrink-0 text-[11px] text-muted-foreground truncate max-w-[110px] font-mono"
                title={activeValidationList.join(", ")}
              >
                {activeValidationList[0]}
              </span>
            )}
          </div>

          {/* Textarea & Prominent Send Button */}
          <div className="relative flex items-end gap-2 rounded-xl border border-border/80 bg-background p-2 shadow-xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              placeholder={
                selectedQuestion
                  ? `Ask Grizzy to edit "${selectedQuestion.label.slice(0, 20)}…"…`
                  : selectedSection
                    ? `Ask Grizzy to edit this section…`
                    : "Ask Grizzy to add questions, change title…"
              }
              className="max-h-28 min-h-[36px] flex-1 resize-none bg-transparent px-2.5 py-1.5 text-xs sm:text-sm leading-relaxed outline-none placeholder:text-muted-foreground disabled:opacity-50 text-foreground"
            />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isStreaming}
                  className="size-8 rounded-lg shrink-0 bg-primary text-primary-foreground hover:opacity-90 active:scale-95 transition-all disabled:opacity-30 cursor-pointer"
                  aria-label="Send message"
                >
                  <ArrowUp className="size-4 stroke-[2.5]" />
                  <span className="sr-only">Send</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                Send instruction
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
