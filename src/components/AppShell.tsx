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
    subtitle: "IDE: proje, editör ve terminal — komutlar sohbetten",
  },
  video: {
    title: "Video",
    subtitle: "Kurgu zaman çizelgesi — plan ve komutlar sohbetten",
  },
  photo: {
    title: "Fotoğraf",
    subtitle: "Kompozisyon ve üretim — yönlendirme sohbetten",
  },
  agents: {
    title: "Ajanlar",
    subtitle: "Otomasyon ve GUI — betik ve adımlar sohbetten",
  },
  pc: {
    title: "PC",
    subtitle: "Sistem kabuğu — görevler sohbetten",
  },
  test: {
    title: "Test",
    subtitle: "Kalite ve CI — komutlar sohbetten",
  },
};

export function AppShell() {
  const loc = useLocation();
  const seg = loc.pathname.replace(/^\//, "") as AppMode;
  const mode: AppMode = valid.includes(seg) ? seg : "code";
  const m = meta[mode];

  return (
    <div
      className="mm-app-shell flex h-screen min-h-0 flex-col"
      data-mm-mode={mode}
    >
      <div className="flex min-h-0 flex-1">
        <ChatPanel mode={mode} title={m.title} subtitle={m.subtitle} />
        <main className="mm-workspace-main min-h-0 min-w-0 flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
