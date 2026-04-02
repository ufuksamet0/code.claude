import { ask } from "@tauri-apps/plugin-dialog";
import { check } from "@tauri-apps/plugin-updater";
import { useEffect, useRef } from "react";
import { installUpdate } from "../lib/updater";

/**
 * Üretim derlemesinde açılışta güncelleme kontrolü; kullanıcı onaylarsa indirip yeniden başlatır.
 * Geliştirme modunda çalışmaz (imzalı paket yok).
 */
export function UpdateChecker() {
  const ran = useRef(false);

  useEffect(() => {
    if (import.meta.env.DEV) return;
    if (ran.current) return;
    ran.current = true;

    void (async () => {
      try {
        const update = await check();
        if (!update) return;

        const ok = await ask(
          `Yeni sürüm ${update.version} yayında.${update.body ? `\n\n${update.body}` : ""}\n\nİndirip kurmak ister misiniz?`,
          {
            title: "Güncelleme",
            kind: "info",
          },
        );
        if (!ok) return;

        await installUpdate(update);
      } catch {
        /* Ağ / endpoint yok / imza uyumsuz: sessizce geç */
      }
    })();
  }, []);

  return null;
}
