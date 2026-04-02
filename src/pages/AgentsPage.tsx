import { invoke } from "@tauri-apps/api/core";
import { useState } from "react";

export function AgentsPage() {
  const [script, setScript] = useState(
    'tell application "System Events" to return "Erişilebilirlik izni gerekir"',
  );
  const [out, setOut] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    setErr(null);
    try {
      const r = await invoke<string>("agents_run_applescript", { script });
      setOut(r);
    } catch (e) {
      setErr(String(e));
      setOut("");
    }
  }

  return (
    <div className="p-6 md:p-8">
      <header className="mb-6">
        <h1 className="text-[28px] font-semibold tracking-tight text-[var(--mm-text)]">
          Ajanlar
        </h1>
        <p className="mt-1 max-w-2xl text-[15px] leading-relaxed text-[var(--mm-muted)]">
          macOS’ta GUI otomasyonu için AppleScript / Erişilebilirlik izni gerekir. Bu MVP yalnızca
          onaylanmış <code>osascript</code> çağrılarını çalıştırır.
        </p>
      </header>

      <div className="mm-glass rounded-[var(--mm-radius)] p-4">
        <p className="mb-2 text-[13px] text-[var(--mm-muted)]">
          Dikkat: Klavye/fare simülasyonu ve üçüncü taraf uygulamalara erişim güvenlik uyarıları
          tetikleyebilir.
        </p>
        <textarea
          className="mm-focus min-h-[160px] w-full rounded-[var(--mm-radius-sm)] border border-[var(--mm-border)] bg-[var(--mm-surface-solid)] p-3 font-mono text-[12px] text-[var(--mm-text)]"
          value={script}
          onChange={(e) => setScript(e.target.value)}
        />
        <button
          type="button"
          className="mm-focus mm-pill mt-3 bg-[var(--mm-accent)] px-4 py-2 text-[13px] font-semibold text-white"
          onClick={() => void run()}
        >
          AppleScript çalıştır
        </button>
        {err ? <p className="mt-3 text-[13px] text-red-400">{err}</p> : null}
        {out ? (
          <pre className="mt-3 rounded-[var(--mm-radius-sm)] bg-[var(--mm-chat)] p-3 font-mono text-[12px] text-[var(--mm-text)]">
            {out}
          </pre>
        ) : null}
      </div>
    </div>
  );
}
