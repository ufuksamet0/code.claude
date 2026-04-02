# MultiMod AI

Tauri 2 + React + TypeScript ile çok modlu AI masaüstü uygulaması (kod, video, fotoğraf, ajanlar, PC terminal, test).

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

## GitHub’a ilk push

Boş repoda (GitHub’da oluşturduğunuz adresi kullanın):

```bash
git remote add origin https://github.com/KULLANICI/REPO.git
git push -u origin main
```

SSH kullanıyorsanız `git@github.com:KULLANICI/REPO.git` kullanın. Kimlik doğrulama için PAT veya SSH anahtarı gerekir.

## Güncelleme sunucusu

`src-tauri/tauri.conf.json` içinde `plugins.updater.endpoints` adresini kendi `latest.json` URL’nize göre düzenleyin. Örnek yapı: `updater/latest.json.example`.
