"use client";

import * as React from "react";
import { useBuilderStore } from "@/store/builder-store";
import {
  streamBuilderChatTurn,
  type BuilderAction,
  type BuilderChatPayload,
  type ConversationMessage,
} from "@/lib/api/ai-builder";
import { toast } from "sonner";
import type { BuilderSnapshot, QuestionType, QuestionValidation } from "@/types/builder";
import { updateForm as apiUpdateForm, saveBuilderState } from "@/lib/api/forms";

import {
  useGrizzyChatStore,
  type GrizzyBuilderMessage,
  type FormChangeItem,
  INITIAL_WELCOME,
} from "@/store/grizzy-chat-store";

export type { GrizzyBuilderMessage };

export interface UseGrizzyBuilderChatReturn {
  messages: GrizzyBuilderMessage[];
  isStreaming: boolean;
  error: string | null;
  sendMessage: (query: string) => Promise<void>;
  retryLastMessage: () => Promise<void>;
  clearChat: () => void;
  acceptChanges: (messageId: string) => Promise<void>;
  rejectChanges: (messageId: string) => Promise<void>;
}

// Module-level abort controller so ongoing streaming survives panel toggles
let activeAbortController: AbortController | null = null;

function normalizeValidation(raw: any): Partial<QuestionValidation> {
  if (!raw || typeof raw !== "object") return {};
  const normalized: Partial<QuestionValidation> = {};

  // Numeric fields
  const numFields: Array<[keyof QuestionValidation, string[]]> = [
    ["minLength", ["min_length", "minlength", "minLen", "min_len", "minimumLength"]],
    ["maxLength", ["max_length", "maxlength", "maxLen", "max_len", "maximumLength"]],
    ["minWords", ["min_words", "minwords", "minimumWords"]],
    ["maxWords", ["max_words", "maxwords", "maximumWords"]],
    ["min", ["minimum", "minValue", "min_value"]],
    ["max", ["maximum", "maxValue", "max_value"]],
    ["step", ["stepValue", "step_value", "increment"]],
    ["stepMinutes", ["step_minutes", "stepminutes", "minuteStep"]],
    ["minSelections", ["min_selections", "min_selection", "minSelection", "minimumSelections"]],
    ["maxSelections", ["max_selections", "max_selection", "maxSelection", "maximumSelections"]],
    ["exactSelections", ["exact_selections", "exact_selection", "exactSelection"]],
    ["minRating", ["min_rating", "minimumRating"]],
    ["maxRating", ["max_rating", "maximumRating"]],
    ["minScale", ["min_scale", "minimumScale"]],
    ["maxScale", ["max_scale", "maximumScale"]],
    ["maxFileSizeMB", ["max_file_size_mb", "max_file_size", "maxFileSize", "maxSizeMB", "max_size"]],
    ["maxFiles", ["max_files", "maxfiles", "maximumFiles"]],
  ];

  // Boolean fields
  const boolFields: Array<[keyof QuestionValidation, string[]]> = [
    ["integerOnly", ["integer_only", "integers_only", "integer", "integers"]],
    ["disallowFreeEmails", ["disallow_free_emails", "block_free_emails", "blockFreeEmails", "disallowFreeEmail", "blockPersonalEmails"]],
    ["disablePastDates", ["disable_past_dates", "disable_past", "disablePast"]],
    ["disableFutureDates", ["disable_future_dates", "disable_future", "disableFuture"]],
    ["allowOther", ["allow_other", "allow_other_option", "enableOther"]],
    ["mustBeYes", ["must_be_yes", "mustBeTrue"]],
    ["requireHttps", ["require_https", "require_ssl", "httpsOnly"]],
  ];

  // String fields
  const strFields: Array<[keyof QuestionValidation, string[]]> = [
    ["pattern", ["regex", "regexp", "validation_pattern"]],
    ["customError", ["custom_error", "error_message", "errorMessage", "customErrorMessage"]],
    ["allowedDomains", ["allowed_domains", "valid_domains", "domains"]],
    ["phoneFormat", ["phone_format", "format"]],
    ["minDate", ["min_date", "minimumDate"]],
    ["maxDate", ["max_date", "maximumDate"]],
    ["minTime", ["min_time", "minimumTime"]],
    ["maxTime", ["max_time", "maximumTime"]],
    ["minDateTime", ["min_datetime", "min_date_time"]],
    ["maxDateTime", ["max_datetime", "max_date_time"]],
    ["defaultValue", ["default_value", "default"]],
    ["minLabel", ["min_label", "minimumLabel"]],
    ["maxLabel", ["max_label", "maximumLabel"]],
    ["allowedExtensions", ["allowed_extensions", "file_extensions", "extensions", "allowed_file_types"]],
    ["allowedUrlDomains", ["allowed_url_domains", "url_domains"]],
  ];

  for (const [key, aliases] of numFields) {
    for (const k of [key, ...aliases]) {
      if (raw[k] !== undefined && raw[k] !== null && raw[k] !== "") {
        const val = Number(raw[k]);
        if (!isNaN(val)) {
          (normalized as any)[key] = val;
          break;
        }
      }
    }
  }

  for (const [key, aliases] of boolFields) {
    for (const k of [key, ...aliases]) {
      if (raw[k] !== undefined && raw[k] !== null) {
        (normalized as any)[key] = Boolean(raw[k]);
        break;
      }
    }
  }

  for (const [key, aliases] of strFields) {
    for (const k of [key, ...aliases]) {
      if (typeof raw[k] === "string" && raw[k].trim() !== "") {
        (normalized as any)[key] = raw[k].trim();
        break;
      }
    }
  }

  return normalized;
}

export function useGrizzyBuilderChat(): UseGrizzyBuilderChatReturn {
  const {
    form,
    sections,
    questions,
    selectedElement,
    updateForm,
    updateSection,
    addSection,
    deleteSection,
    updateQuestion,
    addQuestion,
    deleteQuestion,
    updateValidation,
  } = useBuilderStore();

  const {
    messages,
    isStreaming,
    error,
    setMessages,
    setIsStreaming,
    setError,
    clearChat: storeClearChat,
    setFormId,
  } = useGrizzyChatStore();

  // Scope chat session to the current active form
  React.useEffect(() => {
    if (form.id) {
      setFormId(form.id);
    }
  }, [form.id, setFormId]);

  /**
   * Dispatches structured actions to the builder store
   * and returns human-friendly descriptions for the UI.
   */
  const applyActions = React.useCallback(
    (actions: BuilderAction[]): { appliedNotes: string[]; changeItems: FormChangeItem[] } => {
      if (!actions || actions.length === 0) return { appliedNotes: [], changeItems: [] };
      const appliedNotes: string[] = [];
      const changeItems: FormChangeItem[] = [];

      for (const action of actions) {
        try {
          switch (action.type) {
            case "updateQuestion": {
              const currentQuestions = useBuilderStore.getState().questions;
              let targetId = action.id;
              let q = currentQuestions.find((item) => item.id === targetId);
              if (!q) {
                const sel = useBuilderStore.getState().selectedElement;
                if (sel?.type === "question") {
                  targetId = sel.id;
                  q = currentQuestions.find((item) => item.id === targetId);
                } else if (currentQuestions.length === 1) {
                  targetId = currentQuestions[0].id;
                  q = currentQuestions[0];
                }
              }

              if (targetId && q) {
                const label = q.label ? `"${q.label}"` : "question";
                const patch = action.patch ? { ...action.patch } : {};

                // Handle validation if included in question update
                const rawVal = action.validation || (action.patch as any)?.validation;
                if (rawVal) {
                  delete patch.validation;
                  const normVal = normalizeValidation(rawVal);
                  if (Object.keys(normVal).length > 0) {
                    updateValidation(targetId, normVal);
                    const rules = Object.entries(normVal)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(", ");
                    appliedNotes.push(`Set constraints (${rules}) on ${label}`);
                    changeItems.push({
                      type: "validation",
                      label: q.label || "Question Validation",
                      detail: rules,
                      tag: "constraint",
                    });
                  }
                }

                if (Object.keys(patch).length > 0) {
                  updateQuestion(targetId, patch);
                  const keys = Object.keys(patch);
                  appliedNotes.push(`Updated ${keys.join(", ")} on ${label}`);
                  const patchDetails = Object.entries(patch)
                    .map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : String(v)}`)
                    .join(", ");
                  changeItems.push({
                    type: "update",
                    label: q.label || "Question",
                    detail: patchDetails,
                    tag: q.type || "property",
                  });
                }
              }
              break;
            }

            case "updateValidation": {
              const currentQuestions = useBuilderStore.getState().questions;
              let targetId = action.id;
              let q = currentQuestions.find((item) => item.id === targetId);
              if (!q) {
                const sel = useBuilderStore.getState().selectedElement;
                if (sel?.type === "question") {
                  targetId = sel.id;
                  q = currentQuestions.find((item) => item.id === targetId);
                } else if (currentQuestions.length === 1) {
                  targetId = currentQuestions[0].id;
                  q = currentQuestions[0];
                }
              }

              const rawPatch =
                action.patch ||
                action.validation ||
                (action.patch as any)?.validation ||
                {};
              const normalized = normalizeValidation(rawPatch);

              if (targetId && q && Object.keys(normalized).length > 0) {
                const label = q.label ? `"${q.label}"` : "question";
                updateValidation(targetId, normalized);

                const rules = Object.entries(normalized)
                  .map(([k, v]) => `${k}: ${v}`)
                  .join(", ");
                appliedNotes.push(`Set constraints (${rules}) on ${label}`);
                changeItems.push({
                  type: "validation",
                  label: q.label || "Validation rules",
                  detail: rules,
                  tag: "constraint",
                });
              }
              break;
            }

            case "updateSection": {
              const currentSections = useBuilderStore.getState().sections;
              let targetSecId = action.id;
              let sec = currentSections.find((s) => s.id === targetSecId);
              if (!sec) {
                const sel = useBuilderStore.getState().selectedElement;
                if (sel?.type === "section") {
                  targetSecId = sel.id;
                  sec = currentSections.find((s) => s.id === targetSecId);
                } else if (currentSections.length === 1) {
                  targetSecId = currentSections[0].id;
                  sec = currentSections[0];
                }
              }

              if (targetSecId && sec) {
                const title = sec.title ? `"${sec.title}"` : "section";
                updateSection(targetSecId, action.patch || {});
                appliedNotes.push(`Updated ${title}`);
                changeItems.push({
                  type: "update",
                  label: sec.title || "Section",
                  detail: action.patch?.title ? `Renamed to "${action.patch.title}"` : "Updated section properties",
                  tag: "section",
                });
              }
              break;
            }

            case "updateForm": {
              updateForm(action.patch || {});
              appliedNotes.push(`Updated form settings`);
              changeItems.push({
                type: "update",
                label: "Form Settings",
                detail: Object.keys(action.patch || {}).join(", "),
                tag: "settings",
              });
              break;
            }

            case "addQuestion": {
              const stateBefore = useBuilderStore.getState();
              const targetSecId =
                action.sectionId ||
                (stateBefore.selectedElement?.type === "section"
                  ? stateBefore.selectedElement.id
                  : stateBefore.sections[0]?.id);

              if (targetSecId) {
                addQuestion(targetSecId, action.questionType as QuestionType);

                // Apply initial question props if provided
                const stateAfter = useBuilderStore.getState();
                const newQId = stateAfter.selectedElement?.id;
                if (newQId) {
                  const patch: any = {};
                  if (action.label) patch.label = action.label;
                  if (action.description) patch.description = action.description;
                  if (action.placeholder) patch.placeholder = action.placeholder;
                  if (action.required !== undefined) patch.required = action.required;
                  if (action.options && action.options.length > 0) patch.options = action.options;

                  if (Object.keys(patch).length > 0) {
                    updateQuestion(newQId, patch);
                  }

                  const rawVal =
                    action.validation ||
                    (action.patch as any)?.validation ||
                    action.patch;
                  const normVal = normalizeValidation(rawVal);
                  if (Object.keys(normVal).length > 0) {
                    updateValidation(newQId, normVal);
                  }

                  const ruleNotes =
                    Object.keys(normVal).length > 0
                      ? ` with constraints (${Object.entries(normVal)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(", ")})`
                      : "";

                  appliedNotes.push(
                    `Added ${action.questionType} question${action.label ? `: "${action.label}"` : ""}${ruleNotes}`,
                  );

                  const detailsList: string[] = [];
                  if (action.required) detailsList.push("Required");
                  if (action.options?.length) detailsList.push(`${action.options.length} options`);
                  if (Object.keys(normVal).length > 0) {
                    detailsList.push(`Constraints: ${Object.entries(normVal).map(([k, v]) => `${k}=${v}`).join(", ")}`);
                  }

                  changeItems.push({
                    type: "add",
                    label: action.label || "New Question",
                    detail: detailsList.length > 0 ? detailsList.join(" • ") : `${action.questionType} question`,
                    tag: action.questionType || "question",
                  });
                }
              }
              break;
            }

            case "deleteQuestion": {
              const currentQuestions = useBuilderStore.getState().questions;
              let targetId = action.id;
              let q = currentQuestions.find((item) => item.id === targetId);
              if (!q) {
                const sel = useBuilderStore.getState().selectedElement;
                if (sel?.type === "question") {
                  targetId = sel.id;
                  q = currentQuestions.find((item) => item.id === targetId);
                }
              }
              if (targetId) {
                const label = q?.label ? `"${q.label}"` : "question";
                deleteQuestion(targetId);
                appliedNotes.push(`Deleted ${label}`);
                changeItems.push({
                  type: "delete",
                  label: q?.label || "Question",
                  detail: "Removed from form",
                  tag: q?.type || "removed",
                });
              }
              break;
            }

            case "addSection": {
              addSection();
              const stateAfter = useBuilderStore.getState();
              const newSecId = stateAfter.selectedElement?.id;
              if (newSecId && (action.title || action.description)) {
                updateSection(newSecId, {
                  title: action.title || "New Section",
                  description: action.description || "",
                });
              }
              appliedNotes.push(
                `Added section${action.title ? `: "${action.title}"` : ""}`,
              );
              changeItems.push({
                type: "add",
                label: action.title || "New Section",
                detail: action.description || "Section created",
                tag: "section",
              });
              break;
            }

            case "deleteSection": {
              const currentSections = useBuilderStore.getState().sections;
              let targetId = action.id;
              let sec = currentSections.find((s) => s.id === targetId);
              if (!sec) {
                const sel = useBuilderStore.getState().selectedElement;
                if (sel?.type === "section") {
                  targetId = sel.id;
                  sec = currentSections.find((s) => s.id === targetId);
                }
              }
              if (targetId) {
                const title = sec?.title ? `"${sec.title}"` : "section";
                deleteSection(targetId);
                appliedNotes.push(`Deleted section ${title}`);
                changeItems.push({
                  type: "delete",
                  label: sec?.title || "Section",
                  detail: "Deleted section",
                  tag: "section",
                });
              }
              break;
            }
          }
        } catch (err) {
          console.error("[useGrizzyBuilderChat] Error executing action:", action, err);
        }
      }

      if (appliedNotes.length > 0) {
        toast.success(`Applied ${appliedNotes.length} change${appliedNotes.length > 1 ? "s" : ""} to form`);
      }

      return { appliedNotes, changeItems };
    },
    [
      updateQuestion,
      updateValidation,
      updateSection,
      updateForm,
      addQuestion,
      deleteQuestion,
      addSection,
      deleteSection,
    ],
  );

  const sendMessage = React.useCallback(
    async (query: string) => {
      const text = query.trim();
      if (!text || isStreaming) return;

      setError(null);
      setIsStreaming(true);

      const userMessageId = `user-${Date.now()}`;
      const assistantMessageId = `assistant-${Date.now()}`;

      // Snapshot conversation history (excluding initial greeting)
      const currentHistory: ConversationMessage[] = messages
        .filter((m) => !m.id.startsWith("welcome") && !m.isError)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      // Append user message + empty assistant placeholder
      setMessages((prev) => [
        ...prev,
        {
          id: userMessageId,
          role: "user",
          content: text,
          timestamp: new Date(),
        },
        {
          id: assistantMessageId,
          role: "assistant",
          content: "",
          timestamp: new Date(),
          appliedChanges: [],
        },
      ]);

      if (activeAbortController) {
        activeAbortController.abort();
      }
      const abortController = new AbortController();
      activeAbortController = abortController;

      // Prepare live form context
      const storeState = useBuilderStore.getState();
      const payload: BuilderChatPayload = {
        formId: storeState.form.id || "draft",
        messages: currentHistory,
        userMessage: text,
        formContext: {
          form: {
            title: storeState.form.title,
            description: storeState.form.description,
          },
          sections: storeState.sections.map((s) => ({
            id: s.id,
            title: s.title,
            description: s.description,
            position: s.position,
          })),
          questions: storeState.questions.map((q) => ({
            id: q.id,
            sectionId: q.sectionId,
            type: q.type,
            label: q.label,
            description: q.description,
            placeholder: q.placeholder,
            required: q.required,
            position: q.position,
            options: q.options,
            validation: q.validation as Record<string, unknown>,
          })),
          selectedElement: storeState.selectedElement,
        },
      };

      try {
        const stream = streamBuilderChatTurn(payload, abortController.signal);
        let accumulatedReply = "";
        let finalActions: BuilderAction[] | undefined;

        for await (const event of stream) {
          if (event.error) {
            throw new Error(event.error);
          }

          if (event.delta) {
            accumulatedReply += event.delta;
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMessageId
                  ? { ...m, content: accumulatedReply }
                  : m,
              ),
            );
          }

          if (event.done) {
            finalActions = event.actions;
            break;
          }
        }

        // Apply structured actions to the store
        let appliedNotes: string[] = [];
        let changeItems: FormChangeItem[] = [];
        let snapshotBefore: BuilderSnapshot | undefined;
        let snapshotAfter: BuilderSnapshot | undefined;

        if (finalActions && finalActions.length > 0) {
          snapshotBefore = useBuilderStore.getState().getSnapshot();
          useBuilderStore.getState().pushHistory();
          const res = applyActions(finalActions);
          appliedNotes = res.appliedNotes;
          changeItems = res.changeItems;
          snapshotAfter = useBuilderStore.getState().getSnapshot();
        }

        // Update assistant message with final content & applied change notes (only if actions were applied)
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? {
                ...m,
                content: accumulatedReply || (appliedNotes.length > 0 ? "Changes applied to form." : "Done."),
                appliedChanges: appliedNotes.length > 0 ? appliedNotes : undefined,
                changeItems: changeItems.length > 0 ? changeItems : undefined,
                snapshotBefore,
                snapshotAfter,
                changeStatus: appliedNotes.length > 0 ? "pending" : undefined,
              }
              : m,
          ),
        );
      } catch (err: any) {
        if (abortController.signal.aborted) {
          return;
        }

        const errMsg = err?.message || "Failed to communicate with Grizzy";
        setError(errMsg);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId
              ? {
                ...m,
                isError: true,
                errorMessage: errMsg,
                content:
                  m.content ||
                  "I encountered an issue processing that request. Please try again.",
              }
              : m,
          ),
        );
      } finally {
        setIsStreaming(false);
        if (activeAbortController === abortController) {
          activeAbortController = null;
        }
      }
    },
    [isStreaming, messages, applyActions, setMessages, setIsStreaming, setError],
  );

  const retryLastMessage = React.useCallback(async () => {
    // Find last user message
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (!lastUserMsg) return;

    // Remove the failed turn
    setMessages((prev) => {
      const idx = prev.findIndex((m) => m.id === lastUserMsg.id);
      if (idx !== -1) {
        return prev.slice(0, idx);
      }
      return prev;
    });

    await sendMessage(lastUserMsg.content);
  }, [messages, sendMessage, setMessages]);

  const clearChat = React.useCallback(() => {
    if (activeAbortController) {
      activeAbortController.abort();
      activeAbortController = null;
    }
    storeClearChat();
  }, [storeClearChat]);

  const acceptChanges = React.useCallback(
    async (messageId: string) => {
      const msg = useGrizzyChatStore
        .getState()
        .messages.find((m) => m.id === messageId);
      if (!msg) return;

      // If it was previously rejected and user wants to re-apply:
      if (msg.changeStatus === "rejected" && msg.snapshotAfter) {
        useBuilderStore.getState().restoreSnapshot(msg.snapshotAfter);
      }

      // Mark as accepted
      useGrizzyChatStore
        .getState()
        .updateMessageChangeStatus(messageId, "accepted");

      // Save to backend immediately
      const { form, sections, questions } = useBuilderStore.getState();
      if (form.id) {
        try {
          let normalizedDeadline: string | null = null;
          if (form.deadline) {
            const d = new Date(form.deadline);
            if (!isNaN(d.getTime())) normalizedDeadline = d.toISOString();
          }

          await Promise.all([
            apiUpdateForm(form.id, {
              title: form.title,
              description: form.description,
              slug: form.slug ?? undefined,
              themeId: form.themeId,
              deadline: normalizedDeadline,
            }),
            saveBuilderState(form.id, {
              sections: sections.map((s) => ({
                id: s.id,
                title: s.title || null,
                description: s.description || null,
                position: s.position,
              })),
              questions: questions.map((q) => ({
                id: q.id,
                sectionId: q.sectionId,
                fieldName: q.fieldName,
                label: q.label,
                description: q.description || null,
                placeholder: q.placeholder || null,
                type: q.type,
                isRequired: q.required,
                position: q.position,
                options: q.options.map((opt, i) => ({
                  id: opt.id,
                  label: opt.label,
                  position: i,
                })),
                validation: q.validation,
              })),
            }),
          ]);
          toast.success("Changes accepted and saved to form ");
        } catch (err) {
          console.error("[useGrizzyBuilderChat] Failed to save accepted changes:", err);
          toast.error("Failed to save changes to server");
        }
      }
    },
    [],
  );

  const rejectChanges = React.useCallback(
    async (messageId: string) => {
      const msg = useGrizzyChatStore
        .getState()
        .messages.find((m) => m.id === messageId);
      if (!msg || !msg.snapshotBefore) return;

      const wasAccepted = msg.changeStatus === "accepted";

      // Restore form state to before the changes were applied
      useBuilderStore.getState().restoreSnapshot(msg.snapshotBefore);

      // Mark as rejected
      useGrizzyChatStore
        .getState()
        .updateMessageChangeStatus(messageId, "rejected");

      // If it was previously saved to the server, persist the revert
      const { form, sections, questions } = useBuilderStore.getState();
      if (wasAccepted && form.id) {
        try {
          let normalizedDeadline: string | null = null;
          if (form.deadline) {
            const d = new Date(form.deadline);
            if (!isNaN(d.getTime())) normalizedDeadline = d.toISOString();
          }

          await Promise.all([
            apiUpdateForm(form.id, {
              title: form.title,
              description: form.description,
              slug: form.slug ?? undefined,
              themeId: form.themeId,
              deadline: normalizedDeadline,
            }),
            saveBuilderState(form.id, {
              sections: sections.map((s) => ({
                id: s.id,
                title: s.title || null,
                description: s.description || null,
                position: s.position,
              })),
              questions: questions.map((q) => ({
                id: q.id,
                sectionId: q.sectionId,
                fieldName: q.fieldName,
                label: q.label,
                description: q.description || null,
                placeholder: q.placeholder || null,
                type: q.type,
                isRequired: q.required,
                position: q.position,
                options: q.options.map((opt, i) => ({
                  id: opt.id,
                  label: opt.label,
                  position: i,
                })),
                validation: q.validation,
              })),
            }),
          ]);
        } catch (err) {
          console.error("[useGrizzyBuilderChat] Failed to persist reverted state:", err);
        }
      }

      toast.info("Changes rejected. Form restored to previous state.");
    },
    [],
  );

  return {
    messages,
    isStreaming,
    error,
    sendMessage,
    retryLastMessage,
    clearChat,
    acceptChanges,
    rejectChanges,
  };
}
