import { create } from "zustand";
import { DEFAULT_MODEL_BY_PROVIDER } from "./providerModels";
import type { AppMode, ChatMessage, ProviderId } from "./types";

function emptyChat(): ChatMessage[] {
  return [];
}

type WorkspaceState = {
  chats: Record<AppMode, ChatMessage[]>;
  provider: Record<AppMode, ProviderId>;
  model: Record<AppMode, string>;
  appendMessage: (mode: AppMode, message: ChatMessage) => void;
  setMessages: (mode: AppMode, messages: ChatMessage[]) => void;
  patchLastAssistant: (mode: AppMode, patch: (prev: string) => string) => void;
  setProvider: (mode: AppMode, p: ProviderId) => void;
  setModel: (mode: AppMode, m: string) => void;
};

const modes: AppMode[] = [
  "code",
  "video",
  "photo",
  "agents",
  "pc",
  "test",
];

const initialChats = Object.fromEntries(
  modes.map((m) => [m, emptyChat()]),
) as Record<AppMode, ChatMessage[]>;

const initialProvider = Object.fromEntries(
  modes.map((m) => [m, "openai" as ProviderId]),
) as Record<AppMode, ProviderId>;

const initialModel = Object.fromEntries(
  modes.map((m) => [m, DEFAULT_MODEL_BY_PROVIDER.openai]),
) as Record<AppMode, string>;

export const useWorkspace = create<WorkspaceState>((set) => ({
  chats: initialChats,
  provider: initialProvider,
  model: initialModel,
  appendMessage: (mode, message) =>
    set((s) => ({
      chats: {
        ...s.chats,
        [mode]: [...s.chats[mode], message],
      },
    })),
  setMessages: (mode, messages) =>
    set((s) => ({
      chats: { ...s.chats, [mode]: messages },
    })),
  patchLastAssistant: (mode, patch) =>
    set((s) => {
      const list = s.chats[mode];
      const last = list[list.length - 1];
      if (!last || last.role !== "assistant") return s;
      const next = [...list];
      next[next.length - 1] = {
        ...last,
        content: patch(last.content),
      };
      return { chats: { ...s.chats, [mode]: next } };
    }),
  setProvider: (mode, p) =>
    set((s) => ({
      provider: { ...s.provider, [mode]: p },
      model: { ...s.model, [mode]: DEFAULT_MODEL_BY_PROVIDER[p] },
    })),
  setModel: (mode, m) =>
    set((s) => ({
      model: { ...s.model, [mode]: m },
    })),
}));
