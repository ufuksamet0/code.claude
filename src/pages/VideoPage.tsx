export function VideoPage() {
  return (
    <div className="p-6 md:p-8">
      <header className="mb-6">
        <h1 className="text-[28px] font-semibold tracking-tight text-[var(--mm-text)]">
          Video
        </h1>
        <p className="mt-1 max-w-2xl text-[15px] leading-relaxed text-[var(--mm-muted)]">
          Video düzenleme ve üretim için soldaki sohbetten talimat verin. Sağlayıcıların video API
          erişimi hesap ve bölgeye göre değişir; üretim akışlarını aşamalı olarak bağlayabilirsiniz.
        </p>
      </header>
      <div className="mm-glass rounded-[var(--mm-radius)] p-6">
        <p className="text-[14px] leading-relaxed text-[var(--mm-text)]">
          Bu sürümde video dosyası önizlemesi ve yerel dışa aktarma, sohbet üzerinden planlama ve
          betik/otomasyon önerileri ile sınırlıdır. OpenAI veya diğer video API anahtarlarını{" "}
          <strong>Ayarlar</strong> üzerinden ekleyerek ileride HTTP üzerinden üretim komutları
          bağlanabilir.
        </p>
      </div>
    </div>
  );
}
