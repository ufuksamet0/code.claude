MultiMod AI — macOS (Apple Silicon / arm64) kurulumu

1) MultiMod-AI-0.2.0-macOS-arm64.dmg dosyasına çift tıklayın.
2) Açılan pencerede "MultiMod AI" simgesini Applications klasörüne sürükleyin.
3) Applications’tan uygulamayı başlatın.

Not: İlk çalıştırmada Gatekeeper uyarısı çıkarsa: Sistem Ayarları → Gizlilik ve Güvenlik’ten "Yine de Aç" kullanın.

Windows için: aynı projede `npm run tauri build` Windows ortamında çalıştırılmalıdır.

--- Geliştirici: otomatik güncelleme yayını (GitHub Actions) ---
Bu repoda `.github/workflows/release.yml` tanımlıdır. Sizin yapmanız gerekenler:

1) İmzalama anahtarı (bir kez):
   - Örnek: `npm run tauri -- signer generate -w src-tauri/updater.key` — çıkan public key’i `tauri.conf.json` içindeki `plugins.updater.pubkey` ile eşleştirin.
   - GitHub → Repository → Settings → Secrets and variables → Actions → New repository secret:
     Ad: TAURI_SIGNING_PRIVATE_KEY
     Değer: `src-tauri/updater.key` dosyasının TAM içeriği (satır sonları dahil).
   - Anahtar parolalıysa: TAURI_SIGNING_PRIVATE_KEY_PASSWORD secret’ı ekleyin.

2) Repo → Settings → Actions → General → Workflow permissions: “Read and write permissions” açın.

3) Sürüm numarasını `package.json`, `src-tauri/tauri.conf.json` ve `src-tauri/Cargo.toml` içinde aynı yapın (ör. 0.2.1), commit edin. Git etiketi `v` + aynı sürüm olmalı (ör. v0.2.1).

4) Tag oluşturup gönderin:
   git tag v0.2.1
   git push origin v0.2.1

   İş akışı: macOS arm64 derlemesi → `updater/latest.json` üretir → Release’e DMG, .tar.gz, .sig ve latest.json yükler.

5) Yerelde elle denemek: `bash scripts/build-release.sh` veya imzalı `npm run tauri build` sonrası `npm run updater:json`
   (RELEASE_TAG=v0.2.0 gibi ortam değişkeni ile uyumlu tag kullanın.)

“Could not fetch a valid release JSON”: İlk başarılı release ve `latest.json` varlığı oluşana kadar görülebilir; yukarıdaki adımlar tamamlanınca düzelir.

--- Hızlı düzeltme (release var ama latest.json yok) ---
1) Bu makinede imzalı derleme yapılmış olmalı (TAURI_SIGNING_PRIVATE_KEY ile `npm run tauri build`).
2) RELEASE_TAG mevcut GitHub etiketiyle aynı olmalı (ör. v0.2.0):
   RELEASE_TAG=v0.2.0 node scripts/generate-latest-json.mjs
3) GitHub CLI ile yükle:
   bash scripts/gh-upload-latest-json.sh v0.2.0
   (Önce: `gh auth login` — repo yazma izni.)

En son release’te `latest.json` varlığı göründükten sonra uygulama içi denetleme çalışır.
