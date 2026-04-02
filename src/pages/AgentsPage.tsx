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
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--mm-ws-bg)] text-[var(--mm-ws-fg)]">
      <header
        className="flex h-11 shrink-0 items-center justify-between border-b px-4"
        style={{ borderColor: "var(--mm-chat-border)", background: "#161b22" }}
      >
        <div>
          <h1 className="text-[14px] font-semibold text-[#e6edf3]">Otomasyon stüdyosu</h1>
          <p className="text-[11px] text-[#8b949e]">macOS · AppleScript · GUI</p>
        </div>
        <span className="rounded border border-[#30363d] bg-[#21262d] px-2 py-1 font-mono text-[10px] text-[#58a6ff]">
          agents_run_applescript
        </span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-px md:flex-row">
        <section
          className="flex min-h-[200px] min-w-0 flex-1 flex-col border-b md:border-b-0 md:border-r"
          style={{ borderColor: "var(--mm-chat-border)", background: "#0d1117" }}
        >
          <div className="flex items-center justify-between border-b border-[#30363d] px-3 py-2">
            <span className="text-[11px] font-medium text-[#8b949e]">Betik düzenleyici</span>
            <span className="text-[10px] text-[#6e7681]">osascript</span>
          </div>
          <textarea
            className="mm-focus min-h-0 flex-1 resize-none border-0 bg-[#0d1117] p-4 font-mono text-[12px] leading-relaxed text-[#c9d1d9] outline-none"
            spellCheck={false}
            value={script}
            onChange={(e) => setScript(e.target.value)}
          />
          <div className="flex gap-2 border-t border-[#30363d] p-3">
            <button
              type="button"
              className="rounded-md bg-[#238636] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#2ea043]"
              onClick={() => void run()}
            >
              Çalıştır
            </button>
            <p className="flex flex-1 items-center text-[11px] text-[#8b949e]">
              İzinler ve güvenlik için sol asistanla adımları netleştirin.
            </p>
          </div>
        </section>

        <aside
          className="flex w-full shrink-0 flex-col md:w-[320px]"
          style={{ background: "#131920" }}
        >
          <div className="border-b border-[#30363d] px-3 py-2 text-[11px] font-semibold text-[#8b949e]">
            Çıktı
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-3">
            {err ? (
              <p className="rounded border border-red-900/50 bg-red-950/40 p-3 font-mono text-[12px] text-red-300">
                {err}
              </p>
            ) : null}
            {out ? (
              <pre className="rounded border border-[#30363d] bg-[#0d1117] p-3 font-mono text-[12px] text-[#c9d1d9]">
                {out}
              </pre>
            ) : (
              <p className="text-[12px] text-[#6e7681]">Çalıştırma sonucu burada görünür.</p>
            )}
          </div>
          <div className="border-t border-[#30363d] p-3 text-[11px] leading-relaxed text-[#8b949e]">
            Klavye/fare simülasyonu ve üçüncü taraf uygulamalara erişim güvenlik uyarıları tetikleyebilir.
            Yalnızca güvendiğiniz betikleri çalıştırın.
          </div>
        </aside>
      </div>
    </div>
  );
}
