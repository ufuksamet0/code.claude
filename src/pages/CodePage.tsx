import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useCallback, useEffect, useState } from "react";
import { saveMemoryIndex } from "../lib/memory";
import type { AppMode } from "../lib/types";

type Entry = { name: string; path: string; isDir: boolean };

const mode: AppMode = "code";

function IconExplorer() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M10 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2h-8l-2-2z" />
    </svg>
  );
}

function IconRun() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

export function CodePage() {
  const [root, setRoot] = useState<string | null>(null);
  const [relDir, setRelDir] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [openFile, setOpenFile] = useState<string | null>(null);
  const [editor, setEditor] = useState("");
  const [shellCmd, setShellCmd] = useState("ls -la");
  const [shellOut, setShellOut] = useState("");
  const [memorySummary, setMemorySummary] = useState("");
  const [bottomTab, setBottomTab] = useState<"terminal" | "memory">("terminal");

  const refreshRoot = useCallback(async () => {
    const r = await invoke<string | null>("get_project_root");
    setRoot(r);
  }, []);

  const list = useCallback(async () => {
    const listPath = relDir;
    const res = await invoke<Entry[]>("fs_list_dir", { relativePath: listPath });
    setEntries(res);
  }, [relDir]);

  useEffect(() => {
    void refreshRoot();
  }, [refreshRoot]);

  useEffect(() => {
    if (root) void list();
  }, [root, relDir, list]);

  async function pickProject() {
    const selected = await open({ directory: true, multiple: false });
    if (selected === null) return;
    const path = Array.isArray(selected) ? selected[0] : selected;
    await invoke("set_project_root", { path });
    setRelDir("");
    await refreshRoot();
  }

  async function loadFile(rel: string) {
    setOpenFile(rel);
    const text = await invoke<string>("fs_read_file", { relativePath: rel });
    setEditor(text);
  }

  async function saveFile() {
    if (!openFile) return;
    await invoke("fs_write_file", {
      relativePath: openFile,
      content: editor,
    });
  }

  async function runShell() {
    const out = await invoke<string>("run_shell_in_project", { command: shellCmd });
    setShellOut(out);
  }

  async function persistMemory() {
    await saveMemoryIndex(mode, {
      summary: memorySummary,
      tags: ["code"],
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--mm-ws-bg)] text-[var(--mm-ws-fg)]">
      {/* Başlık çubuğu */}
      <div
        className="flex h-9 shrink-0 items-center justify-between border-b px-3 text-[12px]"
        style={{ borderColor: "var(--mm-chat-border)", background: "#1e1e1e" }}
      >
        <span className="font-medium tracking-tight">MultiMod — Kod</span>
        <span className="text-[11px] opacity-70">VS Code tarzı</span>
      </div>

      <div className="flex min-h-0 flex-1">
        {/* Aktivite çubuğu */}
        <div
          className="flex w-12 shrink-0 flex-col items-center gap-1 border-r py-2"
          style={{ borderColor: "var(--mm-chat-border)", background: "#333333" }}
        >
          <button
            type="button"
            title="Gezgin"
            className="flex h-10 w-10 items-center justify-center rounded text-[#cccccc] hover:bg-white/10"
          >
            <IconExplorer />
          </button>
        </div>

        {/* Gezgin + editör */}
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex min-h-0 flex-1">
            {/* Dosya gezgini */}
            <aside
              className="flex w-[min(100%,260px)] shrink-0 flex-col border-r"
              style={{ borderColor: "var(--mm-chat-border)", background: "#252526" }}
            >
              <div
                className="flex items-center justify-between border-b px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-[#bbbbbb]"
                style={{ borderColor: "var(--mm-chat-border)" }}
              >
                <span>Gezgin</span>
                <button
                  type="button"
                  className="rounded px-2 py-0.5 text-[10px] font-medium text-[#3794ff] hover:bg-white/10"
                  onClick={() => void pickProject()}
                >
                  Kök
                </button>
              </div>
              <div className="border-b px-2 py-2 text-[11px]" style={{ borderColor: "var(--mm-chat-border)" }}>
                {root ? (
                  <span className="line-clamp-2 break-all font-mono text-[#858585]">{root}</span>
                ) : (
                  <span className="text-[#858585]">Proje seçilmedi</span>
                )}
              </div>
              <div className="flex items-center gap-1 border-b px-2 py-1.5" style={{ borderColor: "var(--mm-chat-border)" }}>
                <input
                  className="mm-focus min-w-0 flex-1 rounded border-0 bg-[#3c3c3c] px-2 py-1 font-mono text-[11px] text-[#cccccc]"
                  value={relDir}
                  onChange={(e) => setRelDir(e.target.value)}
                  placeholder="alt klasör"
                />
                <button
                  type="button"
                  className="shrink-0 rounded px-1.5 py-1 text-[10px] text-[#3794ff] hover:bg-white/10"
                  onClick={() => void list()}
                >
                  ↻
                </button>
              </div>
              <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-1 py-2 text-[12px]">
                {relDir ? (
                  <li>
                    <button
                      type="button"
                      className="w-full rounded px-2 py-1 text-left text-[#3794ff] hover:bg-white/5"
                      onClick={() => {
                        const parts = relDir.split("/").filter(Boolean);
                        parts.pop();
                        setRelDir(parts.join("/"));
                      }}
                    >
                      ..
                    </button>
                  </li>
                ) : null}
                {entries.map((e) => (
                  <li key={e.path}>
                    {e.isDir ? (
                      <button
                        type="button"
                        className="w-full rounded px-2 py-1 text-left text-[#3794ff] hover:bg-white/5"
                        onClick={() => setRelDir(e.path)}
                      >
                        <span className="mr-1 opacity-70">▸</span>
                        {e.name}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className={`w-full rounded px-2 py-1 text-left hover:bg-white/5 ${
                          openFile === e.path ? "bg-white/10 text-[#ffffff]" : "text-[#cccccc]"
                        }`}
                        onClick={() => void loadFile(e.path)}
                      >
                        {e.name}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
              <div
                className="border-t p-2 text-[10px] text-[#858585]"
                style={{ borderColor: "var(--mm-chat-border)" }}
              >
                <p className="mb-1 font-semibold text-[#bbbbbb]">Hafıza özeti</p>
                <textarea
                  className="mm-focus mb-2 max-h-24 w-full resize-none rounded border-0 bg-[#3c3c3c] px-2 py-1.5 font-sans text-[11px] text-[#cccccc]"
                  placeholder="Kalıcı notlar…"
                  value={memorySummary}
                  onChange={(e) => setMemorySummary(e.target.value)}
                />
                <button
                  type="button"
                  className="w-full rounded bg-[#0e639c] px-2 py-1 text-[11px] font-medium text-white hover:bg-[#1177bb]"
                  onClick={() => void persistMemory()}
                >
                  Kaydet
                </button>
              </div>
            </aside>

            {/* Editör */}
            <div className="flex min-w-0 flex-1 flex-col" style={{ background: "#1e1e1e" }}>
              <div
                className="flex h-9 shrink-0 items-center gap-1 border-b px-2 text-[12px]"
                style={{ borderColor: "var(--mm-chat-border)", background: "#252526" }}
              >
                {openFile ? (
                  <span className="rounded-t border border-b-0 border-[#3c3c3c] bg-[#1e1e1e] px-3 py-1 font-mono text-[11px] text-[#cccccc]">
                    {openFile}
                  </span>
                ) : (
                  <span className="px-2 text-[#858585]">Dosya seçilmedi</span>
                )}
              </div>
              <textarea
                className="mm-focus min-h-0 flex-1 resize-none border-0 bg-[#1e1e1e] p-4 font-mono text-[13px] leading-relaxed text-[#d4d4d4] outline-none"
                spellCheck={false}
                value={editor}
                onChange={(e) => setEditor(e.target.value)}
                placeholder="Dosya seçin veya soldaki sohbetten yönlendirme alın…"
              />
              <div
                className="flex shrink-0 gap-2 border-t px-3 py-2"
                style={{ borderColor: "var(--mm-chat-border)", background: "#252526" }}
              >
                <button
                  type="button"
                  className="rounded bg-[#0e639c] px-3 py-1 text-[12px] font-medium text-white disabled:opacity-40"
                  disabled={!openFile}
                  onClick={() => void saveFile()}
                >
                  Kaydet
                </button>
                <button
                  type="button"
                  className="rounded border border-[#555] px-3 py-1 text-[12px] text-[#cccccc] disabled:opacity-40"
                  disabled={!openFile}
                  onClick={() => openFile && void invoke("fs_delete_path", { relativePath: openFile })}
                >
                  Sil
                </button>
              </div>
            </div>
          </div>

          {/* Alt panel: Terminal / Hafıza */}
          <div
            className="flex h-[min(40vh,320px)] shrink-0 flex-col border-t"
            style={{ borderColor: "var(--mm-chat-border)", background: "#1e1e1e" }}
          >
            <div className="flex h-8 shrink-0 items-end gap-0 border-b border-[#3c3c3c] px-2 text-[11px]">
              <button
                type="button"
                className={`border-b-2 px-3 py-1.5 font-medium ${
                  bottomTab === "terminal"
                    ? "border-[#3794ff] text-[#cccccc]"
                    : "border-transparent text-[#858585] hover:text-[#cccccc]"
                }`}
                onClick={() => setBottomTab("terminal")}
              >
                Terminal
              </button>
              <button
                type="button"
                className={`border-b-2 px-3 py-1.5 font-medium ${
                  bottomTab === "memory"
                    ? "border-[#3794ff] text-[#cccccc]"
                    : "border-transparent text-[#858585] hover:text-[#cccccc]"
                }`}
                onClick={() => setBottomTab("memory")}
              >
                Hafıza notu
              </button>
            </div>
            {bottomTab === "terminal" ? (
              <div className="flex min-h-0 flex-1 flex-col p-2">
                <div className="flex gap-2">
                  <input
                    className="mm-focus flex-1 rounded border-0 bg-[#3c3c3c] px-3 py-2 font-mono text-[12px] text-[#cccccc]"
                    value={shellCmd}
                    onChange={(e) => setShellCmd(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void runShell();
                    }}
                  />
                  <button
                    type="button"
                    className="flex items-center gap-1 rounded bg-[#0e639c] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#1177bb]"
                    onClick={() => void runShell()}
                  >
                    <IconRun />
                    Çalıştır
                  </button>
                </div>
                <pre className="mt-2 min-h-0 flex-1 overflow-auto rounded bg-[#0c0c0c] p-3 font-mono text-[11px] leading-relaxed text-[#d4d4d4]">
                  {shellOut || "Çıktı burada görünür. Proje kökünde çalışır."}
                </pre>
              </div>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col p-3 text-[12px] text-[#858585]">
                <p className="mb-2">
                  Proje hafızası soldaki gezgin altında da düzenlenebilir. Asistanla konuşarak
                  görevleri paylaşın.
                </p>
                <textarea
                  className="mm-focus min-h-[120px] w-full resize-none rounded border-0 bg-[#3c3c3c] p-3 font-sans text-[13px] text-[#cccccc]"
                  value={memorySummary}
                  onChange={(e) => setMemorySummary(e.target.value)}
                />
                <button
                  type="button"
                  className="mt-2 max-w-xs rounded bg-[#0e639c] px-3 py-2 text-[12px] font-medium text-white"
                  onClick={() => void persistMemory()}
                >
                  Özeti kaydet
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
