import { create } from "zustand";
import type { BuilderSnapshot } from "@/types/builder";

export interface FormChangeItem {
  type: "add" | "update" | "validation" | "delete";
  label: string;
  detail?: string;
  tag?: string;
}

export interface GrizzyBuilderMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
  timestamp: Date;
  appliedChanges?: string[];
  changeItems?: FormChangeItem[];
  snapshotBefore?: BuilderSnapshot;
  snapshotAfter?: BuilderSnapshot;
  changeStatus?: "pending" | "accepted" | "rejected";
  isError?: boolean;
  errorMessage?: string;
}

export const INITIAL_WELCOME: GrizzyBuilderMessage = {
  id: "welcome-1",
  role: "assistant",
  content:
    "👋 **Hey there! I'm Grizzy**, your AI form co-pilot.\n\nTell me what you'd like to change — I can create new questions, reword labels, configure validation rules (character limits, file formats, required status), or organize sections.",
  timestamp: new Date(),
  appliedChanges: [],
};

export interface GrizzyChatStoreState {
  currentFormId: string | null;
  messages: GrizzyBuilderMessage[];
  isStreaming: boolean;
  error: string | null;
  setFormId: (formId: string) => void;
  setMessages: (
    updater:
      | GrizzyBuilderMessage[]
      | ((prev: GrizzyBuilderMessage[]) => GrizzyBuilderMessage[]),
  ) => void;
  updateMessageChangeStatus: (
    messageId: string,
    status: "pending" | "accepted" | "rejected",
  ) => void;
  setIsStreaming: (isStreaming: boolean) => void;
  setError: (error: string | null) => void;
  clearChat: () => void;
}

export const useGrizzyChatStore = create<GrizzyChatStoreState>((set, get) => ({
  currentFormId: null,
  messages: [INITIAL_WELCOME],
  isStreaming: false,
  error: null,
  setFormId: (formId: string) => {
    const prev = get().currentFormId;
    if (prev && prev !== formId) {
      // Switched to a different form in the builder
      set({
        currentFormId: formId,
        messages: [{ ...INITIAL_WELCOME, timestamp: new Date() }],
        isStreaming: false,
        error: null,
      });
    } else {
      set({ currentFormId: formId });
    }
  },
  setMessages: (updater) =>
    set((state) => ({
      messages:
        typeof updater === "function" ? updater(state.messages) : updater,
    })),
  updateMessageChangeStatus: (messageId: string, status: "pending" | "accepted" | "rejected") =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, changeStatus: status } : m,
      ),
    })),
  setIsStreaming: (isStreaming: boolean) => set({ isStreaming }),
  setError: (error: string | null) => set({ error }),
  clearChat: () =>
    set({
      messages: [{ ...INITIAL_WELCOME, timestamp: new Date() }],
      isStreaming: false,
      error: null,
    }),
}));
