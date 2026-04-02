import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { buildSystemPrompt } from "../lib/prompts";
import { buildMemoryContext } from "../lib/memory";
import type { AppMode, ProviderId } from "../lib/types";
import { useWorkspace } from "../lib/store";
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
    <aside
      className="mm-glass flex min-h-0 w-[min(100%,380px)] shrink-0 flex-col border-r md:w-[380px]"
      style={{ borderColor: "var(--mm-border)" }}
    >
      <header className="border-b px-4 py-3" style={{ borderColor: "var(--mm-border)" }}>
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--mm-muted)]">
          AI sohbet
        </p>
        <h2 className="text-[17px] font-semibold leading-snug text-[var(--mm-text)]">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-0.5 text-[13px] text-[var(--mm-muted)]">{subtitle}</p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <select
            className="mm-focus rounded-[var(--mm-radius-sm)] border border-[var(--mm-border)] bg-[var(--mm-surface-solid)] px-2 py-1.5 text-[13px] text-[var(--mm-text)]"
            value={provider}
            onChange={(e) => setProvider(mode, e.target.value as ProviderId)}
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="ollama">Ollama</option>
          </select>
          <input
            className="mm-focus min-w-[120px] flex-1 rounded-[var(--mm-radius-sm)] border border-[var(--mm-border)] bg-[var(--mm-surface-solid)] px-2 py-1.5 text-[13px] text-[var(--mm-text)]"
            placeholder="Model adı"
            value={model}
            onChange={(e) => setModel(mode, e.target.value)}
          />
        </div>
        <button
          type="button"
          className="mm-focus mt-2 text-[12px] text-[var(--mm-accent)] underline-offset-2 hover:underline"
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
          <pre className="mt-2 max-h-24 overflow-auto rounded-[var(--mm-radius-sm)] bg-[var(--mm-chat)] p-2 text-[11px] text-[var(--mm-muted)]">
            {memoryHint}
          </pre>
        ) : null}
        <Link
          to="/settings"
          className="mt-2 inline-block text-[12px] text-[var(--mm-muted)] hover:text-[var(--mm-accent)]"
        >
          API anahtarları →
        </Link>
      </header>

      <div
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-3 py-3"
        style={{ background: "var(--mm-chat)" }}
      >
        {chats.map((m, i) => (
          <div
            key={`${i}-${m.role}`}
            className={
              m.role === "user"
                ? "ml-4 rounded-[var(--mm-radius-sm)] bg-[var(--mm-accent-soft)] px-3 py-2 text-[13px] leading-relaxed text-[var(--mm-text)]"
                : "mr-2 rounded-[var(--mm-radius-sm)] border border-[var(--mm-border)] bg-[var(--mm-surface-solid)] px-3 py-2 text-[13px] leading-relaxed text-[var(--mm-text)]"
            }
          >
            {m.content || (m.role === "assistant" && busy ? "…" : "\u00a0")}
          </div>
        ))}
      </div>

      <div className="border-t p-3" style={{ borderColor: "var(--mm-border)" }}>
        <textarea
          className="mm-focus mb-2 min-h-[72px] w-full resize-none rounded-[var(--mm-radius-sm)] border border-[var(--mm-border)] bg-[var(--mm-surface-solid)] px-3 py-2 text-[13px] text-[var(--mm-text)] placeholder:text-[var(--mm-muted)]"
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
          className="mm-focus mm-pill w-full bg-[var(--mm-accent)] py-2.5 text-[14px] font-semibold text-white disabled:opacity-50"
          disabled={busy || !input.trim()}
          onClick={() => void send()}
        >
          {busy ? "Yanıt bekleniyor…" : "Gönder"}
        </button>
      </div>
    </aside>
  );
}
