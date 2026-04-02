import { convertFileSrc, invoke } from "@tauri-apps/api/core";
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

  const previewUrl = lastPath ? convertFileSrc(lastPath) : null;

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--mm-ws-bg)] text-[var(--mm-ws-fg)]">
      <header
        className="flex h-10 shrink-0 items-center justify-between border-b px-4 text-[12px]"
        style={{ borderColor: "var(--mm-chat-border)", background: "#2b2b2b" }}
      >
        <span className="font-semibold tracking-tight">MultiMod — Fotoğraf</span>
        <span className="text-[11px] text-[#a3a3a3]">Photoshop tarzı düzen</span>
      </header>

      <div className="flex min-h-0 flex-1">
        {/* Sol araç çubuğu */}
        <aside
          className="flex w-14 shrink-0 flex-col items-center gap-2 border-r py-3"
          style={{ borderColor: "var(--mm-chat-border)", background: "#2b2b2b" }}
        >
          {["Seçim", "Kırp", "Fırça", "Metin"].map((t, i) => (
            <button
              key={t}
              type="button"
              title={t}
              className={`flex h-10 w-10 items-center justify-center rounded text-[10px] font-medium leading-tight ${
                i === 0 ? "bg-[#31a8ff]/20 text-[#31a8ff]" : "text-[#a3a3a3] hover:bg-white/10"
              }`}
            >
              {t.slice(0, 2)}
            </button>
          ))}
        </aside>

        {/* Tuval */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div
            className="mm-ps-canvas relative flex min-h-0 flex-1 items-center justify-center"
            style={{
              backgroundColor: "#2e2e2e",
              backgroundImage: `
                linear-gradient(45deg, #3c3c3c 25%, transparent 25%),
                linear-gradient(-45deg, #3c3c3c 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #3c3c3c 75%),
                linear-gradient(-45deg, transparent 75%, #3c3c3c 75%)`,
              backgroundSize: "16px 16px",
              backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0",
            }}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Üretilen görüntü"
                className="max-h-[min(70vh,560px)] max-w-[min(90%,920px)] object-contain shadow-2xl"
              />
            ) : (
              <div className="rounded border-2 border-dashed border-[#555] px-16 py-20 text-center text-[13px] text-[#858585]">
                Görüntü burada görünür.
                <br />
                <span className="text-[11px]">İstem ve düzenleme için sol asistanı kullanın.</span>
              </div>
            )}
          </div>

          {/* Alt: üretim */}
          <div
            className="shrink-0 border-t p-4"
            style={{ borderColor: "var(--mm-chat-border)", background: "#323232" }}
          >
            <label className="text-[11px] font-semibold uppercase tracking-wide text-[#b8b8b8]">
              DALL·E 3 üretim istemi
            </label>
            <textarea
              className="mm-focus mt-2 min-h-[72px] w-full resize-none rounded border-0 bg-[#434343] px-3 py-2 text-[13px] text-[#ececec] placeholder:text-[#858585]"
              placeholder="Sahneyi tarif edin veya asistandan varyasyon isteyin…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                type="button"
                className="rounded bg-[#31a8ff] px-5 py-2 text-[13px] font-semibold text-[#0a0a0a] disabled:opacity-50"
                disabled={busy || !prompt.trim()}
                onClick={() => void generate()}
              >
                {busy ? "Üretiliyor…" : "Görüntü üret"}
              </button>
              {error ? <p className="text-[13px] text-red-400">{error}</p> : null}
              {lastPath ? (
                <p className="text-[12px] text-[#a3a3a3]">
                  Kayıt: <code className="font-mono text-[#ececec]">{lastPath}</code>
                </p>
              ) : null}
            </div>
          </div>
        </div>

        {/* Sağ paneller */}
        <aside
          className="hidden w-56 shrink-0 flex-col border-l md:flex"
          style={{ borderColor: "var(--mm-chat-border)", background: "#383838" }}
        >
          <div className="border-b px-3 py-2 text-[11px] font-semibold text-[#b8b8b8]" style={{ borderColor: "var(--mm-chat-border)" }}>
            Katmanlar
          </div>
          <div className="p-2 text-[11px] text-[#858585]">Arka plan</div>
          <div className="mx-2 rounded bg-[#31a8ff]/15 px-2 py-1.5 text-[11px] text-[#ececec]">
            Üretilen görüntü
          </div>
          <div className="mt-auto border-t p-3 text-[10px] leading-relaxed text-[#858585]" style={{ borderColor: "var(--mm-chat-border)" }}>
            OpenAI anahtarı Ayarlar’da. Katman ve maskeleme için asistanla adım adım ilerleyin.
          </div>
        </aside>
      </div>
    </div>
  );
}
