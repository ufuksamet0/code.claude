# MultiMod AI

Tauri 2 + React + TypeScript ile çok modlu AI masaüstü uygulaması (kod, video, fotoğraf, ajanlar, PC terminal, test).

**Sürüm (tümü aynı olmalı):** `0.2.0` — `package.json`, `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`

## Geliştirme

```bash
npm install
npm run tauri dev
```

## Üretim derlemesi

```bash
export TAURI_SIGNING_PRIVATE_KEY_PATH="./src-tauri/updater.key"
env -u CI npm run tauri build
```

## Git

Uzak repo:

```bash
git remote add origin https://github.com/ufuksamet0/code.claude.git
git push -u origin main
```

## Güncelleme sunucusu

`src-tauri/tauri.conf.json` içinde `plugins.updater.endpoints` şu an GitHub Releases üzerinden `latest.json` bekler:

`https://github.com/ufuksamet0/code.claude/releases/latest/download/latest.json`

Release oluştururken bu dosyayı ve imzalı paketleri asset olarak ekleyin. Örnek yapı: `updater/latest.json.example`.
