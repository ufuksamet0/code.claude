import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useCallback, useEffect, useState } from "react";

export function TestPage() {
  const [root, setRoot] = useState<string | null>(null);
  const [cmd, setCmd] = useState("npm test");
  const [out, setOut] = useState("");

  const refresh = useCallback(async () => {
    const r = await invoke<string | null>("get_project_root");
    setRoot(r);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function pickProject() {
    const selected = await open({ directory: true, multiple: false });
    if (selected === null) return;
    const path = Array.isArray(selected) ? selected[0] : selected;
    await invoke("set_project_root", { path });
    await refresh();
  }

  async function runTests() {
    const text = await invoke<string>("run_shell_in_project", { command: cmd });
    setOut(text);
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--mm-ws-bg)] text-[var(--mm-ws-fg)]">
      <header
        className="flex h-12 shrink-0 items-center justify-between border-b px-4"
        style={{ borderColor: "var(--mm-chat-border)", background: "#1e293b" }}
      >
        <div>
          <h1 className="text-[15px] font-semibold text-[#f1f5f9]">Test koşusu</h1>
          <p className="text-[11px] text-[#94a3b8]">Kod modu ile aynı proje kökü</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden rounded-full bg-[#34d399]/20 px-2 py-0.5 text-[10px] font-medium text-[#34d399] sm:inline">
            CI hazır
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4 md:flex-row md:gap-6">
        <section
          className="flex min-w-0 flex-1 flex-col rounded-lg border"
          style={{ borderColor: "var(--mm-chat-border)", background: "#0f172a" }}
        >
          <div className="border-b border-[#334155] px-4 py-3">
            <h2 className="text-[12px] font-semibold uppercase tracking-wide text-[#94a3b8]">
              Proje
            </h2>
            <button
              type="button"
              className="mt-2 rounded-md bg-[#34d399] px-4 py-2 text-[13px] font-semibold text-[#0f172a] hover:brightness-110"
              onClick={() => void pickProject()}
            >
              Test edilecek proje seç
            </button>
            <p className="mt-3 line-clamp-3 break-all font-mono text-[11px] text-[#64748b]">
              {root ?? "Henüz kök seçilmedi."}
            </p>
          </div>
          <div className="flex flex-1 flex-col p-4">
            <label className="text-[12px] font-medium text-[#cbd5e1]">Komut (proje kökünde)</label>
            <div className="mt-2 flex gap-2">
              <input
                className="mm-focus flex-1 rounded-md border border-[#334155] bg-[#1e293b] px-3 py-2.5 font-mono text-[13px] text-[#e2e8f0]"
                value={cmd}
                onChange={(e) => setCmd(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void runTests();
                }}
              />
              <button
                type="button"
                className="rounded-md bg-[#34d399] px-5 py-2 text-[13px] font-semibold text-[#0f172a] hover:brightness-110"
                onClick={() => void runTests()}
              >
                Çalıştır
              </button>
            </div>
          </div>
        </section>

        <section
          className="flex min-h-[200px] min-w-0 flex-[1.2] flex-col rounded-lg border"
          style={{ borderColor: "var(--mm-chat-border)", background: "#0f172a" }}
        >
          <div className="border-b border-[#334155] px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
            Çıktı
          </div>
          <pre className="min-h-0 flex-1 overflow-auto p-4 font-mono text-[11px] leading-relaxed text-[#cbd5e1]">
            {out || "Test çıktısı burada. Playwright veya özel komutlar için asistandan yardım alın."}
          </pre>
        </section>
      </div>
    </div>
  );
}
