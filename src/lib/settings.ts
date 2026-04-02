import { invoke } from "@tauri-apps/api/core";

export type AppSettings = {
  openaiApiKey?: string;
  anthropicApiKey?: string;
  ollamaBaseUrl?: string;
  defaultProvider?: string;
  defaultModelOpenai?: string;
  defaultModelAnthropic?: string;
  defaultModelOllama?: string;
};

export async function loadSettings(): Promise<AppSettings> {
  return invoke<AppSettings>("load_settings");
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  return invoke("save_settings", { settings });
}
