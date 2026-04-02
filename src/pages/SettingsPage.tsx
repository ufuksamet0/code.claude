import { getVersion } from "@tauri-apps/api/app";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { AppSettings } from "../lib/settings";
import { loadSettings, saveSettings } from "../lib/settings";
import { fetchAvailableUpdate, installUpdate } from "../lib/updater";

export function SettingsPage() {
  const [s, setS] = useState<AppSettings>({});
  const [saved, setSaved] = useState(false);
  const [appVersion, setAppVersion] = useState<string>("");
  const [updateBusy, setUpdateBusy] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);
  const [updateProgress, setUpdateProgress] = useState<string | null>(null);

  useEffect(() => {
    void loadSettings().then(setS);
    void getVersion().then(setAppVersion).catch(() => setAppVersion("—"));
  }, []);

  async function onSave() {
    await saveSettings(s);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function onCheckUpdate() {
    setUpdateMsg(null);
    setUpdateProgress(null);
    setUpdateBusy(true);
    try {
      if (import.meta.env.DEV) {
        setUpdateMsg(
          "Güncelleme denetimi yalnızca imzalı üretim derlemesinde çalışır. `tauri build` çıktısını kullanın.",
        );
        return;
      }
      const u = await fetchAvailableUpdate();
      if (!u) {
        setUpdateMsg("Yeni sürüm yok; uygulamanız güncel görünüyor.");
        return;
      }
      setUpdateMsg(`Yeni sürüm: ${u.version}. İndiriliyor…`);
      await installUpdate(u, (p) => {
        if (p.total != null && p.total > 0) {
          setUpdateProgress(
            `${p.phase}: ${Math.min(100, Math.round((p.downloaded / p.total) * 100))}%`,
          );
        } else {
          setUpdateProgress(`${p.phase}: ${p.downloaded} bayt`);
        }
      });
    } catch (e) {
      setUpdateMsg(
        `Güncelleme hatası: ${e instanceof Error ? e.message : String(e)}. Endpoint ve imza anahtarını kontrol edin (tauri.conf.json).`,
      );
    } finally {
      setUpdateBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--mm-bg)] p-6 md:p-10">
      <Link
        to="/code"
        className="mm-focus mb-6 inline-block text-[14px] text-[var(--mm-accent)]"
      >
        ← Uygulamaya dön
      </Link>
      <h1 className="text-[28px] font-semibold text-[var(--mm-text)]">Ayarlar</h1>
      <p className="mt-2 max-w-xl text-[15px] text-[var(--mm-muted)]">
        API anahtarları yalnızca bu cihazda yerel olarak saklanır. Rust arka ucu üzerinden
        sağlayıcılara istek atılır.
      </p>

      <div className="mm-glass mt-8 max-w-xl space-y-4 rounded-[var(--mm-radius)] p-6">
        <h2 className="text-[15px] font-semibold text-[var(--mm-text)]">Uygulama</h2>
        <p className="text-[13px] text-[var(--mm-muted)]">
          Sürüm: <strong className="text-[var(--mm-text)]">{appVersion || "…"}</strong>
        </p>
        <p className="text-[13px] leading-relaxed text-[var(--mm-muted)]">
          Otomatik güncelleme: uygulama açılışında (üretim derlemesi) yeni sürüm varsa sorulur.
          Güncelleme sunucusu <code className="text-[12px] text-[var(--mm-text)]">src-tauri/tauri.conf.json</code>{" "}
          içindeki <code className="text-[12px] text-[var(--mm-text)]">plugins.updater.endpoints</code> adresinden{" "}
          <code className="text-[12px] text-[var(--mm-text)]">latest.json</code> dosyasını okur. GitHub Releases
          kullanıyorsanız URL’yi kendi kullanıcı ve repo adınıza göre değiştirin; her sürümde{" "}
          <code className="text-[12px] text-[var(--mm-text)]">latest.json</code> ve imzalı arşivleri yükleyin.
        </p>
        <button
          type="button"
          className="mm-focus mm-pill bg-[var(--mm-accent-soft)] px-4 py-2 text-[13px] font-semibold text-[var(--mm-accent)] disabled:opacity-50"
          disabled={updateBusy}
          onClick={() => void onCheckUpdate()}
        >
          {updateBusy ? "Kontrol ediliyor…" : "Güncellemeyi şimdi denetle"}
        </button>
        {updateMsg ? (
          <p className="text-[13px] text-[var(--mm-muted)]">{updateMsg}</p>
        ) : null}
        {updateProgress ? (
          <p className="text-[12px] font-mono text-[var(--mm-muted)]">{updateProgress}</p>
        ) : null}
      </div>

      <div className="mm-glass mt-6 max-w-xl space-y-4 rounded-[var(--mm-radius)] p-6">
        <h2 className="text-[15px] font-semibold text-[var(--mm-text)]">API</h2>
        <label className="block text-[13px] font-medium text-[var(--mm-text)]">
          OpenAI API anahtarı
          <input
            type="password"
            className="mm-focus mt-1 w-full rounded-[var(--mm-radius-sm)] border border-[var(--mm-border)] bg-[var(--mm-surface-solid)] px-3 py-2 text-[14px]"
            value={s.openaiApiKey ?? ""}
            onChange={(e) => setS({ ...s, openaiApiKey: e.target.value || undefined })}
            autoComplete="off"
          />
        </label>
        <label className="block text-[13px] font-medium text-[var(--mm-text)]">
          Anthropic API anahtarı
          <input
            type="password"
            className="mm-focus mt-1 w-full rounded-[var(--mm-radius-sm)] border border-[var(--mm-border)] bg-[var(--mm-surface-solid)] px-3 py-2 text-[14px]"
            value={s.anthropicApiKey ?? ""}
            onChange={(e) => setS({ ...s, anthropicApiKey: e.target.value || undefined })}
            autoComplete="off"
          />
        </label>
        <label className="block text-[13px] font-medium text-[var(--mm-text)]">
          Ollama taban URL
          <input
            className="mm-focus mt-1 w-full rounded-[var(--mm-radius-sm)] border border-[var(--mm-border)] bg-[var(--mm-surface-solid)] px-3 py-2 font-mono text-[14px]"
            value={s.ollamaBaseUrl ?? "http://127.0.0.1:11434"}
            onChange={(e) => setS({ ...s, ollamaBaseUrl: e.target.value })}
          />
        </label>
        <button
          type="button"
          className="mm-focus mm-pill bg-[var(--mm-accent)] px-6 py-2.5 text-[14px] font-semibold text-white"
          onClick={() => void onSave()}
        >
          Kaydet
        </button>
        {saved ? (
          <p className="text-[13px] text-[var(--mm-muted)]">Kaydedildi.</p>
        ) : null}
      </div>
    </div>
  );
}
