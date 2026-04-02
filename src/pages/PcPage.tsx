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
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--mm-ws-bg)] text-[var(--mm-ws-fg)]">
      <header
        className="flex h-10 shrink-0 items-center justify-between border-b px-3 text-[12px]"
        style={{ borderColor: "var(--mm-chat-border)", background: "#141414" }}
      >
        <span className="font-mono font-semibold text-[#e0e0e0]">Konsol</span>
        <div className="flex items-center gap-2 text-[11px] text-[#6e6e6e]">
          <span className="hidden sm:inline">bash — PC modu</span>
        </div>
      </header>

      <div
        className="flex shrink-0 flex-wrap items-center gap-2 border-b px-3 py-2"
        style={{ borderColor: "var(--mm-chat-border)", background: "#1a1a1a" }}
      >
        <button
          type="button"
          className="rounded border border-[#3ecf8e]/40 bg-[#1e1e1e] px-3 py-1.5 text-[12px] font-medium text-[#3ecf8e] hover:bg-[#252525]"
          onClick={() => void pickCwd()}
        >
          Çalışma klasörü
        </button>
        <button
          type="button"
          className="rounded border border-[#444] px-3 py-1.5 text-[12px] text-[#b0b0b0] hover:bg-[#252525]"
          onClick={() => void clearCwd()}
        >
          Home’a sıfırla
        </button>
        <span className="line-clamp-2 flex-1 font-mono text-[11px] text-[#6e6e6e]">
          {cwd ?? "Varsayılan: kullanıcı ana dizini"}
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col p-2">
        <div className="flex gap-2">
          <span className="pt-2 font-mono text-[12px] text-[#3ecf8e]">$</span>
          <input
            className="mm-focus flex-1 rounded border border-[#333] bg-[#0c0c0c] px-3 py-2 font-mono text-[13px] text-[#00ff9d] placeholder:text-[#3d5d52]"
            value={cmd}
            onChange={(e) => setCmd(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void run();
            }}
            placeholder="Komut"
          />
          <button
            type="button"
            className="rounded bg-[#3ecf8e] px-5 py-2 text-[13px] font-semibold text-[#0c0c0c] hover:brightness-110"
            onClick={() => void run()}
          >
            Enter
          </button>
        </div>
        <pre className="mt-3 min-h-0 flex-1 overflow-auto rounded border border-[#2d2d2d] bg-[#0a0a0a] p-4 font-mono text-[12px] leading-relaxed text-[#cccccc]">
          {out || "Çıktı burada. Görevleri ve komutları sol asistanla planlayın."}
        </pre>
      </div>
    </div>
  );
}
