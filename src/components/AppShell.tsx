import { Outlet, useLocation } from "react-router-dom";
import type { AppMode } from "../lib/types";
import { BottomNav } from "./BottomNav";
import { ChatPanel } from "./ChatPanel";

const valid: AppMode[] = ["code", "video", "photo", "agents", "pc", "test"];

const meta: Record<
  AppMode,
  { title: string; subtitle: string }
> = {
  code: {
    title: "Kod",
    subtitle: "Proje dosyaları ve terminal",
  },
  video: {
    title: "Video",
    subtitle: "Düzenleme ve üretim",
  },
  photo: {
    title: "Fotoğraf",
    subtitle: "Düzenleme ve üretim",
  },
  agents: {
    title: "Ajanlar",
    subtitle: "Günlük işler ve GUI",
  },
  pc: {
    title: "PC",
    subtitle: "Terminal odaklı görevler",
  },
  test: {
    title: "Test",
    subtitle: "Terminal ve GUI testleri",
  },
};

export function AppShell() {
  const loc = useLocation();
  const seg = loc.pathname.replace(/^\//, "") as AppMode;
  const mode: AppMode = valid.includes(seg) ? seg : "code";
  const m = meta[mode];

  return (
    <div className="flex h-screen min-h-0 flex-col bg-[var(--mm-bg)]">
      <div className="flex min-h-0 flex-1">
        <ChatPanel mode={mode} title={m.title} subtitle={m.subtitle} />
        <main className="min-h-0 min-w-0 flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
