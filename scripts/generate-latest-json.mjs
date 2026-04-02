#!/usr/bin/env node
/**
 * tauri build sonrası bundle içindeki .sig dosyalarından Tauri updater latest.json üretir.
 * Ortam:
 *   GITHUB_REPOSITORY=owner/repo (Actions’ta otomatik)
 *   RELEASE_TAG=v0.2.0 (tag push’ta ref_name; yerelde elle)
 *   RELEASE_NOTES=... (isteğe bağlı)
 */
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from "fs";
import { dirname, join, relative } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

function walkFiles(dir) {
  const out = [];
  if (!existsSync(dir) || !statSync(dir).isDirectory()) return out;
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walkFiles(p));
    else out.push(p);
  }
  return out;
}

function platformKeyFromPath(filePath) {
  const n = filePath.replace(/\\/g, "/");
  if (n.includes("aarch64-apple-darwin")) return "darwin-aarch64";
  if (n.includes("x86_64-apple-darwin")) return "darwin-x86_64";
  if (n.includes("x86_64-pc-windows-msvc")) return "windows-x86_64";
  if (n.includes("x86_64-unknown-linux-gnu")) return "linux-x86_64";
  if (n.includes("aarch64-unknown-linux-gnu")) return "linux-aarch64";
  return null;
}

function findBundleRoots() {
  const tauri = join(root, "src-tauri", "target");
  const candidates = [
    join(tauri, "release", "bundle"),
    join(tauri, "aarch64-apple-darwin", "release", "bundle"),
    join(tauri, "x86_64-apple-darwin", "release", "bundle"),
    join(tauri, "x86_64-pc-windows-msvc", "release", "bundle"),
    join(tauri, "x86_64-unknown-linux-gnu", "release", "bundle"),
  ];
  return candidates.filter((d) => existsSync(d) && statSync(d).isDirectory());
}

const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const version = pkg.version;

const repo = process.env.GITHUB_REPOSITORY || "ufuksamet0/code.claude";
const releaseTag =
  process.env.RELEASE_TAG ||
  process.env.GITHUB_REF_NAME ||
  `v${version}`;

if (!releaseTag.startsWith("v")) {
  console.warn(
    "generate-latest-json: RELEASE_TAG 'v' ile başlamıyor; GitHub release URL’leri genelde v0.2.0 biçimindedir.",
  );
}

const notes =
  process.env.RELEASE_NOTES ||
  `MultiMod AI ${version} — tauri updater`;

const bundleRoots = findBundleRoots();
const allSig = bundleRoots.flatMap((d) =>
  walkFiles(d).filter((p) => p.endsWith(".sig")),
);

/** .sig yanındaki asıl arşiv (updater paketi) */
function artifactForSig(sigPath) {
  const base = sigPath.replace(/\.sig$/i, "");
  if (existsSync(base) && statSync(base).isFile()) return base;
  return null;
}

const platforms = {};

for (const sigPath of allSig) {
  const artifact = artifactForSig(sigPath);
  if (!artifact) {
    console.warn("Eşleşen arşiv yok, atlanıyor:", sigPath);
    continue;
  }
  const plat = platformKeyFromPath(sigPath) || platformKeyFromPath(artifact);
  if (!plat) {
    console.warn("Platform çıkarılamadı:", sigPath);
    continue;
  }
  const sigContent = readFileSync(sigPath, "utf8").trim();
  const baseName = artifact.split(/[/\\]/).pop();
  const url = `https://github.com/${repo}/releases/download/${releaseTag}/${encodeURIComponent(baseName)}`;
  platforms[plat] = { signature: sigContent, url };
}

if (Object.keys(platforms).length === 0) {
  console.error(
    [
      "generate-latest-json: Hiç .sig bulunamadı veya eşleşen arşiv yok.",
      "Önce imzalı derleme yapın: TAURI_SIGNING_PRIVATE_KEY ile `npm run tauri build`",
      "Aranan dizinler: src-tauri/target/*/release/bundle",
      "Bulunan bundle kökleri:",
      ...bundleRoots.map((d) => "  - " + relative(root, d)),
    ].join("\n"),
  );
  process.exit(1);
}

const out = {
  version,
  notes,
  pub_date: new Date().toISOString(),
  platforms,
};

const outPath = join(root, "updater", "latest.json");
writeFileSync(outPath, JSON.stringify(out, null, 2) + "\n", "utf8");
console.log("Yazıldı:", outPath);
console.log("Platformlar:", Object.keys(platforms).join(", "));
console.log("Release tag:", releaseTag);
