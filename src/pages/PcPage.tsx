import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useCallback, useEffect, useState } from "react";

export function PcPage() {
  const [cwd, setCwd] = useState<string | null>(null);
  const [cmd, setCmd] = useState("pwd");
  const [out, setOut] = useState("");

  const refresh = useCallback(async () => {
    const c = await invoke<string | null>("get_pc_cwd");
    setCwd(c);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function pickCwd() {
    const selected = await open({ directory: true, multiple: false });
    if (selected === null) return;
    const path = Array.isArray(selected) ? selected[0] : selected;
    await invoke("set_pc_cwd", { path });
    await refresh();
  }

  async function clearCwd() {
    await invoke("set_pc_cwd", { path: null });
    await refresh();
  }

  async function run() {
    const text = await invoke<string>("run_shell_pc", { command: cmd });
    setOut(text);
  }

  return (
    <div className="p-6 md:p-8">
      <header className="mb-6">
        <h1 className="text-[28px] font-semibold tracking-tight text-[var(--mm-text)]">PC</h1>
        <p className="mt-1 max-w-2xl text-[15px] leading-relaxed text-[var(--mm-muted)]">
          Terminal komutları; çalışma dizini seçilmezse kullanıcı ana dizini kullanılır.
        </p>
      </header>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          className="mm-focus mm-pill bg-[var(--mm-accent)] px-4 py-2 text-[13px] font-medium text-white"
          onClick={() => void pickCwd()}
        >
          Çalışma klasörü
        </button>
        <button
          type="button"
          className="mm-focus mm-pill border border-[var(--mm-border)] px-4 py-2 text-[13px]"
          onClick={() => void clearCwd()}
        >
          Sıfırla (home)
        </button>
        {cwd ? (
          <span className="text-[13px] text-[var(--mm-muted)]">{cwd}</span>
        ) : (
          <span className="text-[13px] text-[var(--mm-muted)]">Varsayılan: kullanıcı ana dizini</span>
        )}
      </div>

      <div className="mm-glass rounded-[var(--mm-radius)] p-4">
        <div className="flex gap-2">
          <input
            className="mm-focus flex-1 rounded-[var(--mm-radius-sm)] border border-[var(--mm-border)] bg-[var(--mm-surface-solid)] px-3 py-2 font-mono text-[13px]"
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
          />
          <button
            type="button"
            className="mm-focus mm-pill bg-[var(--mm-accent)] px-4 py-2 text-[13px] font-semibold text-white"
            onClick={() => void run()}
          >
            Çalıştır
          </button>
        </div>
        <pre className="mt-4 max-h-[min(50vh,400px)] overflow-auto rounded-[var(--mm-radius-sm)] bg-[var(--mm-chat)] p-3 font-mono text-[11px] text-[var(--mm-text)]">
          {out || "Çıktı burada."}
        </pre>
      </div>
    </div>
  );
}
