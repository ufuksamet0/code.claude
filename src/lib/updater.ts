import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";

export type UpdateProgress = {
  downloaded: number;
  total: number | null;
  phase: "idle" | "downloading" | "installing" | "done";
};

export async function fetchAvailableUpdate() {
  return check();
}

/** Kullanıcıya gösterilecek Türkçe güncelleme hata metni (Tauri / ağ mesajları). */
export function formatUpdateError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  const technical = raw.trim();

  if (
    technical.includes("Could not fetch a valid release JSON") ||
    technical.includes("valid release JSON")
  ) {
    return [
      "Sunucudan geçerli bir güncelleme bildirimi (latest.json) alınamadı.",
      "GitHub: En son release’e tam adı «latest.json» olan bir varlık ekleyin. Örnek URL:",
      "https://github.com/KULLANICI/REPO/releases/latest/download/latest.json",
      "Release yoksa, varlık eksikse veya JSON şeması/ imzalar hatalıysa bu mesaj çıkar.",
      `Teknik: ${technical}`,
    ].join("\n");
  }

  if (technical.toLowerCase().includes("signature") || technical.includes("imza")) {
    return `İmza doğrulaması başarısız. tauri.conf.json içindeki pubkey ile güncelleme paketini imzalayan anahtar eşleşmeli. Teknik: ${technical}`;
  }

  if (technical.includes("404") || technical.includes("Not Found")) {
    return `Güncelleme adresi bulunamadı (404). Endpoint URL’sini ve release varlıklarını kontrol edin. Teknik: ${technical}`;
  }

  return `Güncelleme hatası: ${technical}. Endpoint ve imza anahtarını kontrol edin (tauri.conf.json).`;
}

export async function installUpdate(
  update: Update,
  onProgress?: (p: UpdateProgress) => void,
): Promise<void> {
  let downloaded = 0;
  let total: number | null = null;

  onProgress?.({ downloaded: 0, total: null, phase: "downloading" });

  await update.downloadAndInstall((event) => {
    switch (event.event) {
      case "Started":
        total = event.data.contentLength ?? null;
        onProgress?.({ downloaded: 0, total, phase: "downloading" });
        break;
      case "Progress":
        downloaded += event.data.chunkLength;
        onProgress?.({ downloaded, total, phase: "downloading" });
        break;
      case "Finished":
        onProgress?.({ downloaded, total, phase: "installing" });
        break;
    }
  });

  onProgress?.({ downloaded, total, phase: "done" });
  await relaunch();
}

export async function checkInstallAndRelaunch(
  onProgress?: (p: UpdateProgress) => void,
): Promise<void> {
  const update = await check();
  if (!update) {
    throw new Error("Güncelleme bulunamadı.");
  }
  await installUpdate(update, onProgress);
}
