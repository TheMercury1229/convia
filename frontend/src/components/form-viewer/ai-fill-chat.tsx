"use client";

import * as React from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  Check,
  CheckCircle2,
  ExternalLink,
  FileText,
  Loader2,
  Moon,
  Paperclip,
  RotateCcw,
  Sun,
  Upload,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Attachment,
  AttachmentMedia,
  AttachmentContent,
  AttachmentTitle,
  AttachmentDescription,
  AttachmentActions,
  AttachmentAction,
} from "@/components/ui/attachment";
import { ChatMarkdown } from "./chat-markdown";
import { useAiFillChat } from "@/hooks/use-ai-fill-chat";
import { uploadToImageKit } from "@/lib/imagekit";
import type { FormWithSections } from "@/lib/api/forms";
import type { FormThemeResolved } from "@/lib/builder-themes";
import type { Question } from "@/types/builder";
import { apiQuestionToClientQuestion } from "@/lib/form-model";
import { validateQuestionAnswer } from "@/lib/validations/question-validator";
import { cn } from "@/lib/utils";

interface AiFillChatProps {
  form: FormWithSections;
  theme: FormThemeResolved;
  isDark: boolean;
  onToggleDark: () => void;
  onSwitchToManual: () => void;
  onComplete?: (filledAnswers: Record<string, unknown>) => void;
  initialAnswers?: Record<string, unknown>;
  onAnswersUpdate?: (answers: Record<string, unknown>) => void;
  onSubmitResponse?: (answers: Record<string, unknown>) => Promise<void> | void;
  isSubmitting?: boolean;
  isPreview?: boolean;
}

export function AiFillChat({
  form,
  theme,
  isDark,
  onToggleDark,
  onSwitchToManual,
  onComplete,
  initialAnswers,
  onAnswersUpdate,
  onSubmitResponse,
  isSubmitting = false,
  isPreview = false,
}: AiFillChatProps) {
  // Initial warm & friendly welcome message from Grizzy
  const initialWelcomeText = React.useMemo(() => {
    return `Hi there! 👋 I'm **Grizzy**, your personal form assistant for **${form.title || "this form"}**.\n\nNo need to click through endless fields — just chat with me naturally or share your details, and I'll take care of the rest.\n\n*Whenever you're ready, let me know what you'd like to start with!*`;
  }, [form.title]);

  const {
    messages,
    isStreaming,
    isComplete,
    error,
    filledAnswers,
    sendMessage,
    retryLastMessage,
    clearError,
  } = useAiFillChat({
    formId: form.id,
    isPreview,
    initialAnswers,
    initialMessages: [
      {
        id: "welcome-1",
        role: "assistant",
        content: initialWelcomeText,
        timestamp: new Date(),
      },
    ],
    onExtractedAnswers: onAnswersUpdate,
    onComplete,
  });

  const [input, setInput] = React.useState("");
  const [showScrollBottom, setShowScrollBottom] = React.useState(false);

  // File upload state
  const [isUploadingFile, setIsUploadingFile] = React.useState(false);
  const [uploadProgressText, setUploadProgressText] = React.useState<string | null>(null);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [submitValidationError, setSubmitValidationError] = React.useState<string | null>(null);
  const bottomFileInputRef = React.useRef<HTMLInputElement>(null);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Flattened questions list across all sections (excluding heading blocks)
  const allQuestions = React.useMemo(() => {
    return (form.sections || [])
      .flatMap((s) => s.questions || [])
      .filter((q) => q.type !== "heading")
      .map((q) => apiQuestionToClientQuestion(q, false));
  }, [form.sections]);

  const totalQuestions = allQuestions.length;

  const filledCount = React.useMemo(() => {
    return Object.keys(filledAnswers).filter(
      (k) =>
        filledAnswers[k] !== undefined &&
        filledAnswers[k] !== null &&
        filledAnswers[k] !== "",
    ).length;
  }, [filledAnswers]);

  // Questions of type "file"
  const fileQuestions = React.useMemo(() => {
    return allQuestions.filter((q) => q.type === "file");
  }, [allQuestions]);

  // Identify the question of type "file" that Grizzy is currently asking for
  const activeFileQuestion = React.useMemo(() => {
    if (isComplete) return null;

    // 1. Check if the latest assistant message explicitly asks for a file question
    const lastAssistantMsg = [...messages].reverse().find((m) => m.role === "assistant");
    if (lastAssistantMsg && fileQuestions.length > 0) {
      const mentionedFileQ = fileQuestions.find((q) => {
        const notFilled =
          filledAnswers[q.id] === undefined ||
          filledAnswers[q.id] === "" ||
          (Array.isArray(filledAnswers[q.id]) && (filledAnswers[q.id] as unknown[]).length === 0);
        return notFilled && lastAssistantMsg.content.toLowerCase().includes(q.label.toLowerCase());
      });
      if (mentionedFileQ) return mentionedFileQ;
    }

    // 2. Otherwise find the first unfilled question in form order
    const firstUnaddressed = allQuestions.find((q) => {
      const val = filledAnswers[q.id];
      return (
        val === undefined ||
        val === null ||
        val === "" ||
        (Array.isArray(val) && val.length === 0)
      );
    });

    return firstUnaddressed?.type === "file" ? firstUnaddressed : null;
  }, [allQuestions, fileQuestions, filledAnswers, messages, isComplete]);

  // Core file upload helper
  const handleFileUpload = async (file: File, targetQ?: Question | null) => {
    const targetQuestion = targetQ || activeFileQuestion || fileQuestions[0];
    const maxMb = targetQuestion?.validation?.maxFileSizeMB ?? 10;

    if (file.size > maxMb * 1024 * 1024) {
      setUploadError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum size is ${maxMb}MB.`);
      return;
    }

    setUploadError(null);
    setIsUploadingFile(true);
    setUploadProgressText(`Uploading ${file.name}...`);

    try {
      const upload = await uploadToImageKit({
        file,
        fileName: file.name,
        folder: "/convia/form-responses",
        useUniqueFileName: true,
      });

      if (targetQuestion) {
        const updatedAnswers = {
          ...filledAnswers,
          [targetQuestion.id]: upload.url,
        };
        onAnswersUpdate?.(updatedAnswers);
      }

      const messageText = targetQuestion
        ? `I have uploaded ${file.name} for "${targetQuestion.label}": ${upload.url}`
        : `I have uploaded ${file.name}: ${upload.url}`;

      sendMessage(messageText);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to upload file";
      setUploadError(msg);
    } finally {
      setIsUploadingFile(false);
      setUploadProgressText(null);
      if (bottomFileInputRef.current) {
        bottomFileInputRef.current.value = "";
      }
    }
  };

  // Theme hotkey support (Press 'd' or 'D' to toggle theme when not typing)
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName);
      if ((e.key === "d" || e.key === "D") && !isInput) {
        e.preventDefault();
        onToggleDark();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [onToggleDark]);

  // Quick suggestion prompts
  const suggestions = [
    "Let's start with the first question!",
    "What information do you need?",
    "I'll share my details all at once",
  ];

  // Auto scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  React.useEffect(() => {
    if (messages.length > 1 || isStreaming || isComplete) {
      scrollToBottom("smooth");
    }
  }, [messages, isStreaming, isComplete]);

  // Handle scroll detection for "Scroll to bottom" button
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setShowScrollBottom(distanceFromBottom > 120);
  };

  // Adjust textarea height automatically
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 128)}px`;
  };

  const handleSend = (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || isStreaming) return;

    sendMessage(text);
    setInput("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleAiSubmit = async () => {
    if (!onSubmitResponse || isSubmitting) return;

    for (const q of allQuestions) {
      const val = filledAnswers[q.id];
      const result = validateQuestionAnswer(q, val);
      if (!result.isValid) {
        const errorMsg = result.error || `Please provide an answer for "${q.label}".`;
        setSubmitValidationError(errorMsg);
        sendMessage(
          `Before we submit, we still need a valid answer for **${q.label}** (${errorMsg}). Could you please share that?`
        );
        return;
      }
    }

    setSubmitValidationError(null);
    await onSubmitResponse(filledAnswers);
  };

  return (
    <div
      className="relative flex h-screen w-full flex-col overflow-hidden transition-colors duration-300"
      style={{
        backgroundColor: theme.colors.canvasBg,
        color: theme.colors.cardText,
      }}
    >
      {/* Top Header Bar */}
      <header
        className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-end px-4 backdrop-blur-md transition-colors duration-300 sm:px-8"
        style={{
          backgroundColor: `color-mix(in oklch, ${theme.colors.canvasBg} 85%, transparent)`,
          borderBottomColor: `color-mix(in oklch, ${theme.colors.cardBorder} 40%, transparent)`,
        }}
      >

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {totalQuestions > 0 && (
            <span
              className="hidden xs:inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border shadow-2xs mr-1"
              style={{
                backgroundColor: theme.colors.cardInputBg,
                borderColor: theme.colors.cardInputBorder,
                color: theme.colors.cardText,
              }}
              title="Form completion progress"
            >
              <CheckCircle2 className="size-3 text-emerald-500" />
              <span>
                {filledCount} of {totalQuestions} answered
              </span>
            </span>
          )}

          {/* Quick Submit button in header when complete */}
          {isComplete && onSubmitResponse && (
            <Button
              size="sm"
              onClick={handleAiSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 rounded-xl text-xs font-semibold px-3.5 shadow-xs hover:opacity-90 active:scale-95 cursor-pointer"
              style={{
                backgroundColor: theme.colors.primary,
                color: theme.colors.primaryForeground,
              }}
            >
              {isSubmitting ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5 stroke-[2.5]" />
              )}
              <span>Submit</span>
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={onSwitchToManual}
            className="hidden md:inline-flex items-center gap-1.5 rounded-xl text-xs font-medium transition-all hover:opacity-90 cursor-pointer"
            style={{
              color: theme.colors.cardMuted,
            }}
            title="Switch to step-by-step form view"
          >
            <FileText className="size-3.5" />
            <span className="hidden sm:inline">Step-by-Step</span>
          </Button>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleDark}
            className="size-8 rounded-lg transition-colors hover:opacity-80 cursor-pointer"
            style={{
              color: theme.colors.cardText,
              backgroundColor: "transparent",
            }}
            aria-label="Toggle dark/light mode (Press D)"
            title="Toggle theme (D)"
          >
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
        </div>
      </header>

      {/* Main Conversation Stream */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto mask-scroll-b px-4 sm:px-6 overscroll-contain transition-colors"
      >
        <div className="mx-auto flex min-h-full max-w-3xl sm:max-w-4xl flex-col justify-start pt-6 pb-28 space-y-5">
          {messages.map((message, index) => {
            const isAi = message.role === "assistant";
            const isLastMessage = index === messages.length - 1;
            const prevMessage = messages[index - 1];
            const isFirstInSequence = !prevMessage || prevMessage.role !== message.role;
            const isCurrentStreaming = isStreaming && isAi && isLastMessage;
            const isAwaitingFirstToken = isCurrentStreaming && !message.content;

            return (
              <div
                key={message.id}
                className={cn(
                  "flex w-full min-w-0 gap-2.5 sm:gap-3 transition-opacity animate-in fade-in slide-in-from-bottom-2 duration-200",
                  isAi ? "justify-start" : "justify-end",
                )}
              >
                {/* AI Avatar on left */}
                {isAi && (
                  <div className="size-8 sm:size-8.5 shrink-0 select-none">
                    {isFirstInSequence ? (
                      <Avatar
                        className="size-8 sm:size-8.5 ring-1 shadow-2xs overflow-hidden shrink-0"
                        style={{
                          backgroundColor: `color-mix(in oklch, ${theme.colors.primary} 15%, ${theme.colors.cardInputBg})`,
                          borderColor: `color-mix(in oklch, ${theme.colors.primary} 25%, transparent)`,
                        }}
                      >
                        <AvatarImage src="/grizzy/avatar.png" alt="Grizzy" className="object-contain p-0.5" />
                        <AvatarFallback className="text-xs font-semibold">GZ</AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="size-8 sm:size-8.5" />
                    )}
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={cn(
                    "flex flex-col min-w-0 max-w-[88%] sm:max-w-[78%] rounded-2xl sm:rounded-3xl px-4 py-2.5 sm:px-5 sm:py-3 shadow-2xs text-[13.5px] sm:text-sm leading-relaxed",
                    isAi
                      ? "rounded-tl-md sm:rounded-tl-md border"
                      : "rounded-tr-md sm:rounded-tr-md ml-auto text-right",
                  )}
                  style={
                    isAi
                      ? {
                        backgroundColor: theme.colors.cardInputBg,
                        borderColor: theme.colors.cardInputBorder,
                        color: theme.colors.cardText,
                      }
                      : {
                        backgroundColor: theme.colors.primary,
                        color: theme.colors.primaryForeground,
                      }
                  }
                >
                  {isAi ? (
                    isAwaitingFirstToken ? (
                      /* Thinking dots while waiting for first token */
                      <div className="flex items-center gap-1.5 py-1">
                        <span
                          className="size-1.5 rounded-full animate-bounce"
                          style={{ backgroundColor: theme.colors.primary, animationDelay: "0ms" }}
                        />
                        <span
                          className="size-1.5 rounded-full animate-bounce"
                          style={{ backgroundColor: theme.colors.primary, animationDelay: "150ms" }}
                        />
                        <span
                          className="size-1.5 rounded-full animate-bounce"
                          style={{ backgroundColor: theme.colors.primary, animationDelay: "300ms" }}
                        />
                      </div>
                    ) : (
                      <div>
                        <ChatMarkdown content={message.content} />
                        {isCurrentStreaming && (
                          <span
                            className="inline-block size-2 ml-1 align-middle rounded-full animate-pulse"
                            style={{ backgroundColor: theme.colors.primary }}
                          />
                        )}

                        {/* Interactive Inline File Input Dropzone when Grizzy is asking for a file */}
                        {isLastMessage && !isStreaming && !isComplete && activeFileQuestion && (
                          <InlineFileDropzone
                            question={activeFileQuestion}
                            theme={theme}
                            isUploading={isUploadingFile}
                            uploadProgressText={uploadProgressText}
                            uploadError={uploadError}
                            onClearError={() => setUploadError(null)}
                            onFileSelect={(file) => handleFileUpload(file, activeFileQuestion)}
                            onSkip={() => handleSend("I'd like to skip this question")}
                            disabled={isStreaming || isUploadingFile}
                            uploadedUrl={
                              typeof filledAnswers[activeFileQuestion.id] === "string" &&
                              Boolean(filledAnswers[activeFileQuestion.id])
                                ? (filledAnswers[activeFileQuestion.id] as string)
                                : undefined
                            }
                            onRemoveFile={() => {
                              const updated = { ...filledAnswers };
                              delete updated[activeFileQuestion.id];
                              onAnswersUpdate?.(updated);
                            }}
                          />
                        )}
                      </div>
                    )
                  ) : (
                    /* User Bubble — format uploaded files nicely */
                    <UserMessageBubble content={message.content} />
                  )}
                </div>
              </div>
            );
          })}

          {/* Minimalist In-Chat Submit Action Card (shown when AI completes all questions and provides summary) */}
          {isComplete && !isStreaming && (
            <div className="flex w-full min-w-0 gap-2.5 sm:gap-3 transition-opacity animate-in fade-in slide-in-from-bottom-2 duration-300 justify-start">
              <div className="size-8 sm:size-8.5 shrink-0 select-none">
                <Avatar
                  className="size-8 sm:size-8.5 ring-1 shadow-2xs overflow-hidden shrink-0"
                  style={{
                    backgroundColor: `color-mix(in oklch, ${theme.colors.primary} 15%, ${theme.colors.cardInputBg})`,
                    borderColor: `color-mix(in oklch, ${theme.colors.primary} 25%, transparent)`,
                  }}
                >
                  <AvatarImage src="/grizzy/avatar.png" alt="Grizzy" className="object-contain p-0.5" />
                  <AvatarFallback className="text-xs font-semibold">GZ</AvatarFallback>
                </Avatar>
              </div>

              <div
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full max-w-[95%] sm:max-w-[85%] rounded-2xl rounded-tl-md sm:rounded-3xl sm:rounded-tl-md border p-4 sm:p-5 shadow-xs"
                style={{
                  backgroundColor: theme.colors.cardBg,
                  borderColor: theme.colors.cardInputBorder,
                  color: theme.colors.cardText,
                }}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className="size-8.5 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      backgroundColor: `color-mix(in oklch, ${theme.colors.primary} 15%, transparent)`,
                      color: theme.colors.primary,
                    }}
                  >
                    <CheckCircle2 className="size-5" />
                  </div>
                  <div>
                    <h4 className="font-heading text-sm sm:text-base font-bold" style={{ color: theme.colors.cardText }}>
                      Ready to submit?
                    </h4>
                    <p className="text-xs mt-0.5 leading-relaxed" style={{ color: theme.colors.cardMuted }}>
                      All details have been collected! Check Grizzy&apos;s summary above or click below to submit your response.
                    </p>
                  </div>
                </div>

                {onSubmitResponse && (
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAiSubmit}
                    disabled={isSubmitting}
                    className="h-10 rounded-xl text-xs sm:text-sm font-semibold px-6 shadow-sm hover:opacity-90 active:scale-95 cursor-pointer flex items-center justify-center gap-2 shrink-0"
                    style={{
                      backgroundColor: theme.colors.primary,
                      color: theme.colors.primaryForeground,
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        <span>Submitting...</span>
                      </>
                    ) : (
                      <>
                        <Check className="size-4 stroke-[2.5]" />
                        <span>Submit Response</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
              {submitValidationError && (
                <div className="mt-3 flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-xs font-medium text-destructive">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{submitValidationError}</span>
                </div>
              )}
            </div>
          )}

          {/* Prompt Suggestions (shown when only welcome message is present) */}
          {messages.length === 1 && !isStreaming && (
            <div className="pt-1 pl-10.5 sm:pl-11.5 flex flex-wrap gap-2 animate-in fade-in duration-300">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(suggestion)}
                  className="rounded-full border px-3 py-1 text-xs font-medium transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xs cursor-pointer"
                  style={{
                    backgroundColor: theme.colors.cardBg,
                    borderColor: theme.colors.cardInputBorder,
                    color: theme.colors.cardText,
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} className="h-2" />
        </div>
      </div>

      {/* Floating Scroll to Bottom Button */}
      {showScrollBottom && (
        <div className="absolute bottom-24 right-5 sm:right-8 z-30">
          <Button
            size="icon-sm"
            onClick={() => scrollToBottom("smooth")}
            className="size-8 rounded-full shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
            style={{
              backgroundColor: theme.colors.cardBg,
              color: theme.colors.cardText,
              borderColor: theme.colors.cardBorder,
              borderWidth: "1px",
            }}
            title="Scroll to bottom"
          >
            <ArrowDown className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Bottom Input Area */}
      <div
        className="fixed bottom-0 left-0 right-0 z-30 px-4 pb-3 pt-1.5 sm:px-6 transition-colors duration-300"
        style={{
          background: `linear-gradient(to top, ${theme.colors.canvasBg} 82%, color-mix(in oklch, ${theme.colors.canvasBg} 50%, transparent) 94%, transparent 100%)`,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <div className="mx-auto max-w-3xl sm:max-w-4xl">
          {/* Error Banner with Retry */}
          {error && (
            <div
              className="mb-2 flex items-center justify-between rounded-xl px-3.5 py-2 text-xs shadow-xs border animate-in fade-in duration-200"
              style={{
                backgroundColor: `color-mix(in oklch, red 12%, ${theme.colors.cardBg})`,
                borderColor: `color-mix(in oklch, red 30%, transparent)`,
                color: theme.colors.cardText,
              }}
            >
              <div className="flex items-center gap-2 min-w-0 pr-2">
                <AlertCircle className="size-3.5 text-red-500 shrink-0" />
                <span className="truncate">{error}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={retryLastMessage}
                  className="h-6 text-xs px-2 font-medium hover:bg-black/10 dark:hover:bg-white/10"
                >
                  <RotateCcw className="size-3 mr-1" />
                  Retry
                </Button>
                <button
                  type="button"
                  onClick={clearError}
                  className="text-xs opacity-60 hover:opacity-100 p-1"
                  aria-label="Dismiss error"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Hidden File Input for bottom paperclip button */}
          <input
            ref={bottomFileInputRef}
            type="file"
            className="hidden"
            accept={activeFileQuestion?.validation?.allowedExtensions}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && activeFileQuestion) {
                handleFileUpload(file, activeFileQuestion);
              }
            }}
            disabled={isUploadingFile || isStreaming}
          />

          {/* Upload Progress Preview Card above input box */}
          {isUploadingFile && (
            <div className="mb-2 animate-in fade-in slide-in-from-bottom-1 duration-200">
              <Attachment
                size="sm"
                state="uploading"
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl border shadow-2xs"
                style={{
                  backgroundColor: theme.colors.cardBg,
                  borderColor: theme.colors.primary,
                  color: theme.colors.cardText,
                }}
              >
                <AttachmentMedia
                  variant="icon"
                  className="size-7 rounded-lg shrink-0"
                  style={{
                    backgroundColor: `color-mix(in oklch, ${theme.colors.primary} 15%, transparent)`,
                    color: theme.colors.primary,
                  }}
                >
                  <Loader2 className="size-3.5 animate-spin" />
                </AttachmentMedia>
                <AttachmentContent className="min-w-0 flex-1">
                  <AttachmentTitle className="text-xs font-semibold truncate">
                    {uploadProgressText || "Uploading file..."}
                  </AttachmentTitle>
                  <AttachmentDescription
                    className="text-[11px] truncate"
                    style={{ color: theme.colors.cardMuted }}
                  >
                    Please wait while your file is attached...
                  </AttachmentDescription>
                </AttachmentContent>
              </Attachment>
            </div>
          )}

          {/* Input Box Card */}
          <div
            className="relative flex items-end gap-1.5 rounded-2xl border p-1.5 sm:p-2 shadow-sm transition-all duration-200 focus-within:ring-2"
            style={{
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.cardInputBorder,
              boxShadow: `0 4px 20px -2px color-mix(in oklch, ${theme.colors.cardText} 6%, transparent)`,
            }}
          >
            {/* Attachment Button — ONLY shown when the active question is of type "file" */}
            {activeFileQuestion && (
              <Button
                type="button"
                size="icon"
                variant="ghost"
                disabled={isStreaming || isUploadingFile}
                onClick={() => bottomFileInputRef.current?.click()}
                className="size-8 sm:size-8.5 shrink-0 rounded-full transition-all duration-150 active:scale-95 cursor-pointer animate-in fade-in zoom-in-95 duration-150"
                style={{
                  color: theme.colors.primary,
                  backgroundColor: `color-mix(in oklch, ${theme.colors.primary} 12%, transparent)`,
                }}
                title={`Upload file for "${activeFileQuestion.label}"`}
              >
                {isUploadingFile ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Paperclip className="size-4 stroke-[2]" />
                )}
              </Button>
            )}

            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder={
                isComplete
                  ? "Ask Grizzy to adjust any answer, or click Submit Response..."
                  : activeFileQuestion
                    ? `Message Grizzy or upload "${activeFileQuestion.label}" above...`
                    : "Message Grizzy or share your details..."
              }
              disabled={isStreaming}
              className="max-h-32 min-h-[38px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm leading-relaxed outline-none placeholder:text-muted-foreground transition-all disabled:opacity-50"
              style={{
                color: theme.colors.cardText,
              }}
            />

            {/* Send Button */}
            <Button
              type="button"
              size="icon"
              disabled={!input.trim() || isStreaming}
              onClick={() => handleSend()}
              className="size-8 sm:size-8.5 shrink-0 rounded-full transition-all duration-150 disabled:opacity-40 hover:scale-105 active:scale-95 shadow-xs cursor-pointer"
              style={{
                backgroundColor: input.trim() && !isStreaming ? theme.colors.primary : theme.colors.cardInputBg,
                color: input.trim() && !isStreaming ? theme.colors.primaryForeground : theme.colors.cardMuted,
              }}
              title="Send message"
            >
              <ArrowUp className="size-4 stroke-[2.5]" />
            </Button>
          </div>

          {/* Subtext info hint */}
          <div
            className="mt-1.5 text-center text-[11px] select-none tracking-normal"
            style={{ color: theme.colors.cardMuted }}
          >
            Press Enter to send · Shift + Enter for new line · Press D to toggle theme
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Interactive File Dropzone rendered directly inside Grizzy's question bubble
 */
interface InlineFileDropzoneProps {
  question: Question;
  theme: FormThemeResolved;
  isUploading: boolean;
  uploadProgressText: string | null;
  uploadError: string | null;
  onClearError: () => void;
  onFileSelect: (file: File) => void;
  onSkip?: () => void;
  disabled?: boolean;
  uploadedUrl?: string;
  onRemoveFile?: () => void;
}

function InlineFileDropzone({
  question,
  theme,
  isUploading,
  uploadProgressText,
  uploadError,
  onClearError,
  onFileSelect,
  onSkip,
  disabled,
  uploadedUrl,
  onRemoveFile,
}: InlineFileDropzoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const maxMb = question?.validation?.maxFileSizeMB ?? 10;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (disabled || isUploading) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
    e.target.value = "";
  };

  // If a file has already been uploaded for this question, render using the Attachment component
  if (uploadedUrl) {
    const fileName = uploadedUrl.split("/").pop() || "Uploaded File";
    const isImage = /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(fileName || uploadedUrl);

    return (
      <div className="mt-3.5 w-full select-none animate-in fade-in duration-200">
        <Attachment
          size="default"
          state="done"
          className="w-full flex items-center justify-between p-3 rounded-2xl border shadow-2xs"
          style={{
            backgroundColor: theme.colors.cardBg,
            borderColor: `color-mix(in oklch, ${theme.colors.primary} 45%, ${theme.colors.cardInputBorder})`,
          }}
        >
          <AttachmentMedia
            variant={isImage ? "image" : "icon"}
            className="size-10 rounded-xl shrink-0 overflow-hidden"
            style={{
              backgroundColor: `color-mix(in oklch, ${theme.colors.primary} 15%, transparent)`,
              color: theme.colors.primary,
            }}
          >
            {isImage ? (
              <img src={uploadedUrl} alt={fileName} className="size-full object-cover" />
            ) : (
              <FileText className="size-5" />
            )}
          </AttachmentMedia>
          <AttachmentContent className="ml-1 min-w-0 flex-1">
            <AttachmentTitle
              className="text-xs sm:text-sm font-semibold truncate"
              style={{ color: theme.colors.cardText }}
            >
              {fileName}
            </AttachmentTitle>
            <AttachmentDescription
              className="text-[11px] truncate flex items-center gap-1.5"
              style={{ color: theme.colors.cardMuted }}
            >
              <CheckCircle2 className="size-3 text-emerald-500 inline shrink-0" />
              <span>Uploaded successfully</span>
            </AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions className="gap-1">
            <AttachmentAction
              asChild
              size="icon-xs"
              variant="ghost"
              className="size-7 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              style={{ color: theme.colors.cardMuted }}
            >
              <a
                href={uploadedUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="View file"
              >
                <ExternalLink className="size-3.5" />
              </a>
            </AttachmentAction>
            {onRemoveFile && (
              <AttachmentAction
                size="icon-xs"
                variant="ghost"
                onClick={onRemoveFile}
                className="size-7 rounded-lg hover:bg-destructive/10 hover:text-destructive cursor-pointer"
                style={{ color: theme.colors.cardMuted }}
                title="Remove and replace file"
              >
                <X className="size-3.5" />
              </AttachmentAction>
            )}
          </AttachmentActions>
        </Attachment>
      </div>
    );
  }

  return (
    <div className="mt-3.5 w-full select-none animate-in fade-in duration-200">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept={question.validation?.allowedExtensions}
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!disabled && !isUploading) {
            fileInputRef.current?.click();
          }
        }}
        className={cn(
          "relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-4 sm:p-5 text-center transition-all cursor-pointer shadow-2xs",
          isDragging ? "scale-[1.01]" : "hover:scale-[1.005]",
        )}
        style={{
          backgroundColor: isDragging
            ? `color-mix(in oklch, ${theme.colors.primary} 15%, ${theme.colors.cardBg})`
            : `color-mix(in oklch, ${theme.colors.primary} 6%, ${theme.colors.cardBg})`,
          borderColor: isDragging
            ? theme.colors.primary
            : `color-mix(in oklch, ${theme.colors.primary} 40%, ${theme.colors.cardInputBorder})`,
        }}
      >
        {/* Upload Icon */}
        <div
          className="size-10 sm:size-11 rounded-full flex items-center justify-center mb-2.5 transition-transform shadow-2xs"
          style={{
            backgroundColor: `color-mix(in oklch, ${theme.colors.primary} 18%, transparent)`,
            color: theme.colors.primary,
          }}
        >
          {isUploading ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <Upload className="size-5 stroke-[2.2]" />
          )}
        </div>

        {/* Question Title & Prompt */}
        <div className="mb-2 max-w-sm">
          <h5 className="font-heading text-sm sm:text-base font-semibold" style={{ color: theme.colors.cardText }}>
            {question.label}
            {question.required ? (
              <span className="text-[11px] text-amber-500 ml-1.5 font-normal">*required</span>
            ) : (
              <span className="text-[11px] opacity-60 ml-1.5 font-normal">(optional)</span>
            )}
          </h5>
          <p className="text-xs mt-0.5 leading-relaxed" style={{ color: theme.colors.cardMuted }}>
            {isUploading
              ? (uploadProgressText || "Uploading file...")
              : "Drag & drop your file here, or click to browse"}
          </p>
          <div className="mt-1 flex items-center justify-center gap-2 text-[11px] opacity-60">
            <span>Max {maxMb}MB</span>
            {question.validation?.allowedExtensions && (
              <span>• {question.validation.allowedExtensions}</span>
            )}
          </div>
        </div>

        {/* Error message */}
        {uploadError && (
          <div
            className="mb-2.5 flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-red-500 border border-red-500/20"
            style={{ backgroundColor: "rgba(239, 68, 68, 0.08)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <AlertCircle className="size-3.5 shrink-0" />
            <span className="truncate">{uploadError}</span>
            <button
              type="button"
              onClick={onClearError}
              className="ml-1 opacity-70 hover:opacity-100 p-0.5 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div
          className="flex items-center gap-2 mt-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            type="button"
            size="sm"
            disabled={disabled || isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="h-8 px-4 text-xs font-semibold rounded-xl shadow-2xs hover:opacity-90 active:scale-95 cursor-pointer"
            style={{
              backgroundColor: theme.colors.primary,
              color: theme.colors.primaryForeground,
            }}
          >
            {isUploading ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                Uploading...
              </>
            ) : (
              <>
                <Paperclip className="size-3.5 mr-1.5" />
                Choose File
              </>
            )}
          </Button>

          {!question.required && onSkip && !isUploading && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              disabled={disabled || isUploading}
              onClick={onSkip}
              className="h-8 px-3 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/5 opacity-70 hover:opacity-100 cursor-pointer"
              style={{ color: theme.colors.cardMuted }}
            >
              Skip
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Format user message bubbles: renders uploaded file badges cleanly with the Attachment component
 */
function UserMessageBubble({ content }: { content: string }) {
  // Check if message is a file upload confirmation:
  // "I have uploaded filename: url" or "I have uploaded filename for "label": url"
  const fileMatch = content.match(/I have uploaded (.+?)(?: for ".*?")?: (https?:\/\/\S+)/i);

  if (fileMatch) {
    const [, fileName, fileUrl] = fileMatch;
    const isImage = /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(fileName || fileUrl);

    return (
      <div className="py-0.5 select-none">
        <Attachment
          size="sm"
          state="done"
          className="bg-white/15 dark:bg-black/30 border-white/20 text-white shadow-xs max-w-xs"
        >
          <AttachmentMedia
            variant={isImage ? "image" : "icon"}
            className="size-8 rounded-lg bg-white/20 text-white shrink-0 overflow-hidden"
          >
            {isImage ? (
              <img src={fileUrl} alt={fileName} className="size-full object-cover" />
            ) : (
              <FileText className="size-4 text-white" />
            )}
          </AttachmentMedia>
          <AttachmentContent className="min-w-0 pr-1 text-left">
            <AttachmentTitle className="text-white text-xs font-semibold truncate max-w-[180px]">
              {fileName}
            </AttachmentTitle>
            <AttachmentDescription className="text-white/80 text-[11px] truncate">
              Uploaded file
            </AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction
              asChild
              size="icon-xs"
              variant="ghost"
              className="text-white hover:bg-white/20 size-6"
            >
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="View uploaded file"
              >
                <ExternalLink className="size-3" />
              </a>
            </AttachmentAction>
          </AttachmentActions>
        </Attachment>
      </div>
    );
  }

  return (
    <p className="whitespace-pre-wrap break-words leading-relaxed text-left">
      {content}
    </p>
  );
}
