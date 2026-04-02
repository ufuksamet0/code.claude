export function VideoPage() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[var(--mm-ws-bg)] text-[var(--mm-ws-fg)]">
      <header
        className="flex h-10 shrink-0 items-center justify-between border-b px-4 text-[12px]"
        style={{ borderColor: "var(--mm-chat-border)", background: "#0d0d0d" }}
      >
        <div className="flex items-center gap-3">
          <span className="font-semibold tracking-tight">MultiMod — Video</span>
          <span className="hidden text-[11px] text-[#8a8a8a] sm:inline">
            Premiere tarzı zaman çizelgesi
          </span>
        </div>
        <span className="text-[11px] text-[#63e6be]">Kaynak · Program</span>
      </header>

      <div className="grid min-h-0 flex-1 grid-rows-[1fr_auto] gap-0">
        {/* Monitörler */}
        <div className="grid min-h-0 grid-cols-2 gap-px bg-[#2a2a2a] p-px">
          <section
            className="flex min-h-[160px] flex-col border border-[#333]"
            style={{ background: "linear-gradient(180deg, #1a1a1a 0%, #121212 100%)" }}
          >
            <div className="flex h-8 shrink-0 items-center border-b border-[#333] px-3 text-[10px] font-semibold uppercase tracking-wider text-[#8a8a8a]">
              Kaynak
            </div>
            <div className="flex flex-1 items-center justify-center p-4">
              <div className="aspect-video w-full max-w-md rounded border border-[#404040] bg-black/80 shadow-inner">
                <div className="flex h-full items-center justify-center text-[11px] text-[#666]">
                  Önizleme / medya
                </div>
              </div>
            </div>
          </section>
          <section
            className="flex min-h-[160px] flex-col border border-[#333]"
            style={{ background: "linear-gradient(180deg, #1a1a1a 0%, #121212 100%)" }}
          >
            <div className="flex h-8 shrink-0 items-center border-b border-[#333] px-3 text-[10px] font-semibold uppercase tracking-wider text-[#8a8a8a]">
              Program
            </div>
            <div className="flex flex-1 items-center justify-center p-4">
              <div className="aspect-video w-full max-w-md rounded border border-[#63e6be]/30 bg-black/80 shadow-[0_0_40px_rgba(99,230,190,0.08)]">
                <div className="flex h-full items-center justify-center text-[11px] text-[#63e6be]/70">
                  Düzenlenmiş çıktı
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Zaman çizelgesi */}
        <div
          className="shrink-0 border-t"
          style={{ borderColor: "var(--mm-chat-border)", background: "#161616" }}
        >
          <div className="flex h-7 items-center border-b border-[#2a2a2a] px-2 text-[10px] text-[#8a8a8a]">
            <span className="w-14 shrink-0">Zaman</span>
            <div className="flex flex-1 gap-px">
              {Array.from({ length: 12 }).map((_, i) => (
                <span key={i} className="flex-1 border-l border-[#2a2a2a] pl-1 text-[9px]">
                  {i * 5}s
                </span>
              ))}
            </div>
          </div>
          <div className="space-y-1 p-2">
            <div className="flex h-8 items-center gap-1">
              <span className="w-14 shrink-0 text-[10px] text-[#6b6b6b]">V1</span>
              <div className="h-6 flex-1 rounded-sm bg-[#4a7c59]/80" title="Video" />
            </div>
            <div className="flex h-8 items-center gap-1">
              <span className="w-14 shrink-0 text-[10px] text-[#6b6b6b]">A1</span>
              <div className="h-6 flex-1 rounded-sm bg-[#5b7c9a]/80" title="Ses" />
            </div>
            <div className="flex h-8 items-center gap-1">
              <span className="w-14 shrink-0 text-[10px] text-[#6b6b6b]">Müzik</span>
              <div className="h-6 flex-1 rounded-sm bg-[#8a6b9a]/60" />
            </div>
          </div>
          <p className="border-t border-[#2a2a2a] px-4 py-3 text-[12px] leading-relaxed text-[#8a8a8a]">
            Kurgu planı, sahne listesi ve dışa aktarma adımlarını <strong className="text-[#c8c8c8]">sol asistan</strong>{" "}
            ile konuşarak yönetin. API erişimi hesaba göre değişir; üretim komutları aşamalı
            bağlanabilir.
          </p>
        </div>
      </div>
    </div>
  );
}
