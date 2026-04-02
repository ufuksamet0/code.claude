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
