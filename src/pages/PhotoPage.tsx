import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";

export function PhotoPage() {
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastPath, setLastPath] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    try {
      const path = await invoke<string>("openai_image_generate", {
        prompt: prompt.trim(),
        size: "1024x1024",
      });
      setLastPath(path);
    } catch (e) {
      setError(String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="p-6 md:p-8">
      <header className="mb-6">
        <h1 className="text-[28px] font-semibold tracking-tight text-[var(--mm-text)]">
          Fotoğraf
        </h1>
        <p className="mt-1 max-w-2xl text-[15px] leading-relaxed text-[var(--mm-muted)]">
          DALL·E 3 ile görüntü üretimi (OpenAI anahtarı gerekir). Düzenleme ve varyasyonlar için
          soldaki sohbeti kullanın.
        </p>
      </header>

      <div className="mm-glass max-w-xl rounded-[var(--mm-radius)] p-4">
        <label className="text-[13px] font-medium text-[var(--mm-text)]">Üretim istemi</label>
        <textarea
          className="mm-focus mt-2 min-h-[100px] w-full rounded-[var(--mm-radius-sm)] border border-[var(--mm-border)] bg-[var(--mm-surface-solid)] p-3 text-[13px]"
          placeholder="Sahneyi tarif edin…"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <button
          type="button"
          className="mm-focus mm-pill mt-3 bg-[var(--mm-accent)] px-4 py-2.5 text-[14px] font-semibold text-white disabled:opacity-50"
          disabled={busy || !prompt.trim()}
          onClick={() => void generate()}
        >
          {busy ? "Üretiliyor…" : "Görüntü üret"}
        </button>
        {error ? (
          <p className="mt-3 text-[13px] text-red-500">{error}</p>
        ) : null}
        {lastPath ? (
          <p className="mt-3 text-[13px] text-[var(--mm-muted)]">
            Kaydedildi: <code className="text-[var(--mm-text)]">{lastPath}</code>
          </p>
        ) : null}
      </div>
    </div>
  );
}
