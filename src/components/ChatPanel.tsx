import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { buildSystemPrompt } from "../lib/prompts";
import { buildMemoryContext } from "../lib/memory";
import type { AppMode, ProviderId } from "../lib/types";
import { useWorkspace } from "../lib/store";
import { ModelPicker } from "./ModelPicker";
import { runAiChatStream } from "../lib/useAiStream";

type Props = {
  mode: AppMode;
  title: string;
  subtitle?: string;
};

export function ChatPanel({ mode, title, subtitle }: Props) {
  const chats = useWorkspace((s) => s.chats[mode]);
  const provider = useWorkspace((s) => s.provider[mode]);
  const model = useWorkspace((s) => s.model[mode]);
  const appendMessage = useWorkspace((s) => s.appendMessage);
  const patchLastAssistant = useWorkspace((s) => s.patchLastAssistant);
  const setProvider = useWorkspace((s) => s.setProvider);
  const setModel = useWorkspace((s) => s.setModel);

  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [memoryHint, setMemoryHint] = useState<string | null>(null);

  const systemBase = useMemo(() => buildSystemPrompt(mode), [mode]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || busy) return;

    const prior = chats;
    const userMsg = { role: "user" as const, content: text };
    appendMessage(mode, userMsg);
    appendMessage(mode, { role: "assistant", content: "" });
    setInput("");
    setBusy(true);

    let memoryBlock = "";
    try {
      memoryBlock = await buildMemoryContext(mode);
    } catch {
      memoryBlock = "";
    }
    const systemPrompt =
      memoryBlock.length > 0
        ? `${systemBase}\n\n## Kalıcı bağlam\n${memoryBlock}`
        : systemBase;

    try {
      await runAiChatStream(
        provider,
        model,
        [...prior, userMsg],
        systemPrompt,
        (delta) => {
          patchLastAssistant(mode, (prev) => prev + delta);
        },
      );
    } catch (e) {
      patchLastAssistant(
        mode,
        (prev) => `${prev}\n\n[Hata: ${e instanceof Error ? e.message : String(e)}]`,
      );
    } finally {
      setBusy(false);
    }
  }, [
    input,
    busy,
    chats,
    mode,
    appendMessage,
    patchLastAssistant,
    provider,
    model,
    systemBase,
  ]);

  return (
    <aside className="mm-chat-panel flex min-h-0 w-[min(100%,380px)] shrink-0 flex-col border-r md:w-[380px]">
      <header className="mm-chat-panel-header border-b px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--mm-chat-muted)]">
          Asistan
        </p>
        <h2 className="text-[17px] font-semibold leading-snug text-[var(--mm-chat-text)]">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-0.5 text-[13px] text-[var(--mm-chat-muted)]">{subtitle}</p>
        ) : null}
        <p className="mt-2 text-[11px] leading-snug text-[var(--mm-chat-muted)]">
          Bu modda ana etkileşim burada — Cursor’daki gibi komut ve planları yazın.
        </p>
        <div className="mt-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap">
          <select
            className="mm-focus w-full shrink-0 rounded-[var(--mm-radius-sm)] border px-2 py-1.5 text-[12px] text-[var(--mm-chat-text)] sm:min-w-[140px] sm:max-w-[46%]"
            style={{
              borderColor: "var(--mm-chat-border)",
              background: "var(--mm-chat-input-bg)",
            }}
            value={provider}
            onChange={(e) => setProvider(mode, e.target.value as ProviderId)}
          >
            <optgroup label="Önerilen">
              <option value="openai">OpenAI</option>
              <option value="anthropic">Claude</option>
              <option value="google">Gemini</option>
              <option value="xai">Grok</option>
              <option value="llama">Llama</option>
              <option value="qwen">Qwen</option>
              <option value="mistral">Mistral</option>
              <option value="openrouter">OpenRouter</option>
              <option value="ollama">Ollama (yerel)</option>
            </optgroup>
            <optgroup label="Diğer">
              <option value="groq">Groq</option>
              <option value="together">Together</option>
              <option value="deepseek">DeepSeek</option>
              <option value="perplexity">Perplexity</option>
            </optgroup>
          </select>
          <ModelPicker
            provider={provider}
            value={model}
            onChange={(m) => setModel(mode, m)}
            disabled={busy}
          />
        </div>
        <button
          type="button"
          className="mm-focus mt-2 text-[12px] text-[var(--mm-chat-accent)] underline-offset-2 hover:underline"
          onClick={async () => {
            try {
              const ctx = await buildMemoryContext(mode, 2000);
              setMemoryHint(ctx || "(Boş)");
            } catch {
              setMemoryHint("Hafıza yüklenemedi.");
            }
          }}
        >
          Hafıza önizlemesi
        </button>
        {memoryHint ? (
          <pre className="mt-2 max-h-24 overflow-auto rounded-[var(--mm-radius-sm)] p-2 text-[11px] text-[var(--mm-chat-muted)] mm-chat-memory-preview">
            {memoryHint}
          </pre>
        ) : null}
        <Link
          to="/settings"
          className="mt-2 inline-block text-[12px] text-[var(--mm-chat-muted)] hover:text-[var(--mm-chat-accent)]"
        >
          API anahtarları →
        </Link>
      </header>

      <div className="mm-chat-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 py-3">
        {chats.map((m, i) => (
          <div
            key={`${i}-${m.role}`}
            className={
              m.role === "user"
                ? "mm-chat-bubble-user ml-4 rounded-[var(--mm-radius-sm)] px-3 py-2 text-[13px] leading-relaxed"
                : "mm-chat-bubble-assistant mr-2 rounded-[var(--mm-radius-sm)] border px-3 py-2 text-[13px] leading-relaxed"
            }
          >
            {m.content || (m.role === "assistant" && busy ? "…" : "\u00a0")}
          </div>
        ))}
      </div>

      <div className="mm-chat-panel-footer border-t p-3">
        <textarea
          className="mm-focus mb-2 min-h-[72px] w-full resize-none rounded-[var(--mm-radius-sm)] border px-3 py-2 text-[13px] placeholder:text-[var(--mm-chat-muted)]"
          style={{
            borderColor: "var(--mm-chat-border)",
            background: "var(--mm-chat-input-bg)",
            color: "var(--mm-chat-text)",
          }}
          placeholder="Mesajınızı yazın…"
          value={input}
          disabled={busy}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <button
          type="button"
          className="mm-focus mm-pill mm-chat-send w-full py-2.5 text-[14px] font-semibold disabled:opacity-50"
          disabled={busy || !input.trim()}
          onClick={() => void send()}
        >
          {busy ? "Yanıt bekleniyor…" : "Gönder"}
        </button>
      </div>
    </aside>
  );
}
