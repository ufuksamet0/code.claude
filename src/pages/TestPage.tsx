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
    <div className="p-6 md:p-8">
      <header className="mb-6">
        <h1 className="text-[28px] font-semibold tracking-tight text-[var(--mm-text)]">Test</h1>
        <p className="mt-1 max-w-2xl text-[15px] leading-relaxed text-[var(--mm-muted)]">
          Kod modu ile aynı proje kökünü kullanır. Önce projeyi seçin, ardından test komutunu
          çalıştırın. GUI testleri (Playwright vb.) için komutu özelleştirin.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="mm-focus mm-pill bg-[var(--mm-accent)] px-4 py-2 text-[13px] font-medium text-white"
          onClick={() => void pickProject()}
        >
          Test edilecek proje
        </button>
        {root ? (
          <span className="text-[13px] text-[var(--mm-muted)]">{root}</span>
        ) : (
          <span className="text-[13px] text-[var(--mm-muted)]">Proje seçilmedi</span>
        )}
      </div>

      <div className="mm-glass rounded-[var(--mm-radius)] p-4">
        <label className="text-[13px] text-[var(--mm-muted)]">Komut (proje kökünde)</label>
        <div className="mt-2 flex gap-2">
          <input
            className="mm-focus flex-1 rounded-[var(--mm-radius-sm)] border border-[var(--mm-border)] bg-[var(--mm-surface-solid)] px-3 py-2 font-mono text-[13px]"
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
          />
          <button
            type="button"
            className="mm-focus mm-pill bg-[var(--mm-accent)] px-4 py-2 text-[13px] font-semibold text-white"
            onClick={() => void runTests()}
          >
            Çalıştır
          </button>
        </div>
        <pre className="mt-4 max-h-[min(50vh,480px)] overflow-auto rounded-[var(--mm-radius-sm)] bg-[var(--mm-chat)] p-3 font-mono text-[11px] text-[var(--mm-text)]">
          {out || "Test çıktısı burada görünür."}
        </pre>
      </div>
    </div>
  );
}
