import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useCallback, useEffect, useState } from "react";
import { saveMemoryIndex } from "../lib/memory";
import type { AppMode } from "../lib/types";

type Entry = { name: string; path: string; isDir: boolean };

const mode: AppMode = "code";

export function CodePage() {
  const [root, setRoot] = useState<string | null>(null);
  const [relDir, setRelDir] = useState("");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [openFile, setOpenFile] = useState<string | null>(null);
  const [editor, setEditor] = useState("");
  const [shellCmd, setShellCmd] = useState("ls -la");
  const [shellOut, setShellOut] = useState("");
  const [memorySummary, setMemorySummary] = useState("");

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
    <div className="p-6 md:p-8">
      <header className="mb-6">
        <h1 className="text-[28px] font-semibold tracking-tight text-[var(--mm-text)]">
          Kod
        </h1>
        <p className="mt-1 max-w-2xl text-[15px] leading-relaxed text-[var(--mm-muted)]">
          Proje kökünü seçin; dosyaları listeleyin, düzenleyin ve terminal komutları çalıştırın.
        </p>
      </header>

      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          className="mm-focus mm-pill bg-[var(--mm-accent)] px-4 py-2 text-[14px] font-medium text-white"
          onClick={() => void pickProject()}
        >
          Proje klasörü seç
        </button>
        {root ? (
          <span className="rounded-[var(--mm-radius-sm)] border border-[var(--mm-border)] px-3 py-2 text-[13px] text-[var(--mm-muted)]">
            {root}
          </span>
        ) : (
          <span className="text-[13px] text-[var(--mm-muted)]">Kök seçilmedi.</span>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="mm-glass rounded-[var(--mm-radius)] p-4">
          <h2 className="text-[15px] font-semibold text-[var(--mm-text)]">Dosyalar</h2>
          <p className="mb-3 text-[12px] text-[var(--mm-muted)]">
            Alt klasör:{" "}
            <input
              className="mm-focus rounded border border-[var(--mm-border)] bg-[var(--mm-surface-solid)] px-2 py-1 text-[13px]"
              value={relDir}
              onChange={(e) => setRelDir(e.target.value)}
              placeholder="boş = kök"
            />
            <button
              type="button"
              className="mm-focus ml-2 text-[12px] text-[var(--mm-accent)]"
              onClick={() => void list()}
            >
              Yenile
            </button>
          </p>
          <ul className="max-h-56 space-y-1 overflow-auto text-[13px]">
            {relDir ? (
              <li>
                <button
                  type="button"
                  className="text-[var(--mm-accent)]"
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
                    className="text-[var(--mm-accent)]"
                    onClick={() => setRelDir(e.path)}
                  >
                    📁 {e.name}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="text-[var(--mm-text)] hover:underline"
                    onClick={() => void loadFile(e.path)}
                  >
                    📄 {e.name}
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="mm-glass flex flex-col rounded-[var(--mm-radius)] p-4">
          <h2 className="text-[15px] font-semibold text-[var(--mm-text)]">Editör</h2>
          <p className="mb-2 text-[12px] text-[var(--mm-muted)]">
            {openFile ?? "Dosya seçilmedi"}
          </p>
          <textarea
            className="mm-focus mb-2 min-h-[200px] flex-1 rounded-[var(--mm-radius-sm)] border border-[var(--mm-border)] bg-[var(--mm-surface-solid)] p-2 font-mono text-[12px] text-[var(--mm-text)]"
            value={editor}
            onChange={(e) => setEditor(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              type="button"
              className="mm-focus mm-pill bg-[var(--mm-accent-soft)] px-3 py-1.5 text-[13px] font-medium text-[var(--mm-accent)]"
              onClick={() => void saveFile()}
              disabled={!openFile}
            >
              Kaydet
            </button>
            <button
              type="button"
              className="mm-focus mm-pill border border-[var(--mm-border)] px-3 py-1.5 text-[13px] text-[var(--mm-muted)]"
              onClick={() => openFile && void invoke("fs_delete_path", { relativePath: openFile })}
              disabled={!openFile}
            >
              Sil
            </button>
          </div>
        </section>
      </div>

      <section className="mm-glass mt-6 rounded-[var(--mm-radius)] p-4">
        <h2 className="text-[15px] font-semibold text-[var(--mm-text)]">Terminal (proje kökünde)</h2>
        <div className="mt-2 flex gap-2">
          <input
            className="mm-focus flex-1 rounded-[var(--mm-radius-sm)] border border-[var(--mm-border)] bg-[var(--mm-surface-solid)] px-3 py-2 font-mono text-[13px]"
            value={shellCmd}
            onChange={(e) => setShellCmd(e.target.value)}
          />
          <button
            type="button"
            className="mm-focus mm-pill bg-[var(--mm-accent)] px-4 py-2 text-[13px] font-medium text-white"
            onClick={() => void runShell()}
          >
            Çalıştır
          </button>
        </div>
        <pre className="mt-3 max-h-40 overflow-auto rounded-[var(--mm-radius-sm)] bg-[var(--mm-chat)] p-3 font-mono text-[11px] text-[var(--mm-text)]">
          {shellOut || "Çıktı burada görünür."}
        </pre>
      </section>

      <section className="mm-glass mt-6 rounded-[var(--mm-radius)] p-4">
        <h2 className="text-[15px] font-semibold text-[var(--mm-text)]">Hafıza özeti (kod modu)</h2>
        <textarea
          className="mm-focus mt-2 min-h-[80px] w-full rounded-[var(--mm-radius-sm)] border border-[var(--mm-border)] bg-[var(--mm-surface-solid)] p-2 text-[13px]"
          placeholder="Projeyle ilgili kalıcı notlar…"
          value={memorySummary}
          onChange={(e) => setMemorySummary(e.target.value)}
        />
        <button
          type="button"
          className="mm-focus mt-2 mm-pill bg-[var(--mm-surface-solid)] px-3 py-1.5 text-[13px]"
          style={{ border: "1px solid var(--mm-border)" }}
          onClick={() => void persistMemory()}
        >
          Özeti kaydet (index.json)
        </button>
      </section>
    </div>
  );
}
