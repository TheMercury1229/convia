"use client";

import * as React from "react";
import Image from "next/image";
import { ArrowUp, RotateCcw, Copy, Check, AlertCircle } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GrizzyMarkdown } from "./grizzy-markdown";
import { useGrizzyAnalyticsChat } from "@/hooks/use-grizzy-analytics-chat";
import type { FormAnalyticsData } from "@/lib/api/analytics";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface GrizzyAnalyticsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formId: string;
  formTitle: string;
  analyticsData?: FormAnalyticsData;
}

export function GrizzyAnalyticsSheet({
  open,
  onOpenChange,
  formId,
  formTitle,
  analyticsData,
}: GrizzyAnalyticsSheetProps) {
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
    messages,
    isStreaming,
    error,
    suggestions,
    sendMessage,
    retryLastMessage,
    clearChat,
  } = useGrizzyAnalyticsChat({
    formId,
    formTitle,
    analyticsData,
  });

  const [input, setInput] = React.useState("");
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = React.useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      messagesEndRef.current?.scrollIntoView({ behavior });
    },
    [],
  );

  React.useEffect(() => {
    if (open) {
      scrollToBottom("auto");
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [open, scrollToBottom]);

  // Clear input when active form changes
  React.useEffect(() => {
    setInput("");
  }, [formId]);

  React.useEffect(() => {
    if (isStreaming) {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    } else if (messages.length > 1) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const handleSend = (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || isStreaming) return;

    sendMessage(text);
    setInput("");

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.focus();
    }
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
      toast.error("Failed to copy text");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-2xl md:max-w-3xl lg:max-w-4xl data-[side=right]:sm:max-w-2xl data-[side=right]:md:max-w-3xl data-[side=right]:lg:max-w-4xl p-0 flex flex-col gap-0 border-l border-border/70 bg-background shadow-2xl"
      >
        <TooltipProvider delayDuration={200}>
          {/* ────────────────────────────────────────────────────────── */}
          {/* SIMPLIFIED HEADER                                          */}
          {/* ────────────────────────────────────────────────────────── */}
          <SheetHeader className="px-5 py-3.5 border-b border-border/60 shrink-0">
            <div className="flex items-center justify-between gap-3 pr-8">
              <div className="flex items-center gap-2 min-w-0">
                <SheetTitle className="text-sm font-semibold tracking-tight text-foreground">
                  Ask Grizzy
                </SheetTitle>
                {formTitle && (
                  <span className="text-xs text-muted-foreground truncate max-w-[280px]">
                    • {formTitle}
                  </span>
                )}
              </div>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={clearChat}
                    disabled={isStreaming || messages.length <= 1}
                    className="size-7 rounded-md text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-40"
                  >
                    <RotateCcw className="size-3.5" />
                    <span className="sr-only">Reset conversation</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  Reset conversation
                </TooltipContent>
              </Tooltip>
            </div>
          </SheetHeader>

          {/* ────────────────────────────────────────────────────────── */}
          {/* CHAT MESSAGES BODY                                         */}
          {/* ────────────────────────────────────────────────────────── */}
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 space-y-5"
          >
            {messages.map((message) => {
              const isAi = message.role === "assistant";
              const isWelcome = message.id.startsWith("welcome");

              return (
                <div
                  key={message.id}
                  className={cn(
                    "flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-200",
                    isAi ? "items-start" : "items-end",
                  )}
                >
                  <div
                    className={cn(
                      "flex items-start gap-2.5 max-w-[92%] sm:max-w-[85%]",
                      isAi ? "flex-row" : "flex-row-reverse",
                    )}
                  >
                    {/* Avatar */}
                    {isAi ? (
                      <div className="size-7 sm:size-8 shrink-0 rounded-full bg-primary/10 ring-1 ring-border/80 overflow-hidden flex items-center justify-center mt-0.5">
                        <Image
                          src="/grizzy/avatar.png"
                          alt="Grizzy"
                          width={32}
                          height={32}
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <Avatar className="size-7 sm:size-8 shrink-0 ring-1 ring-border/80 mt-0.5">
                        <AvatarImage src={user?.image ?? undefined} />
                        <AvatarFallback className="text-[10px] font-semibold bg-muted text-foreground">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                    )}

                    {/* Bubble */}
                    <div
                      className={cn(
                        "relative group rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed shadow-2xs",
                        isAi
                          ? "bg-card border border-border/70 text-card-foreground rounded-tl-sm"
                          : "bg-primary text-primary-foreground rounded-tr-sm",
                      )}
                    >
                      {isAi ? (
                        <div>
                          {message.content ? (
                            <GrizzyMarkdown content={message.content} />
                          ) : (
                            /* Typing dots while awaiting first token */
                            <div className="flex items-center gap-1.5 py-1 text-muted-foreground">
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
                                Analyzing responses…
                              </span>
                            </div>
                          )}

                          {/* Quick Copy Button on Hover */}
                          {message.content && !isStreaming && (
                            <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                              <span className="font-mono text-[10px]">
                                {new Date(message.timestamp).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
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

                  {/* Clean Badge List Suggestions below welcome message */}
                  {isWelcome && messages.length === 1 && !isStreaming && (
                    <div className="pl-9 sm:pl-10.5 pt-1.5 flex flex-wrap items-center gap-1.5 animate-in fade-in duration-200">
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

            {/* Error Banner */}
            {error && (
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
          {/* SIMPLIFIED INPUT                                           */}
          {/* ────────────────────────────────────────────────────────── */}
          <div className="p-3 sm:p-4 bg-background shrink-0 border-t border-border/60">
            <div className="relative flex items-end gap-2 rounded-xl border border-border/80 bg-background p-2 shadow-xs focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask Grizzy about drop-offs, themes, or metrics…"
                disabled={isStreaming}
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
                  >
                    <ArrowUp className="size-4 stroke-[2.5]" />
                    <span className="sr-only">Send</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  Send question
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </TooltipProvider>
      </SheetContent>
    </Sheet>
  );
}
