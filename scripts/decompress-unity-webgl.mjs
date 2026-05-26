/**
 * Décompresse les .br Unity WebGL pour servir en dev HTTP (localhost).
 * Usage : node scripts/decompress-unity-webgl.mjs [slug]
 * Défaut slug : roguesurvival
 */
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";

const slug = process.argv[2] ?? "roguesurvival";
const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../frontend/public/games",
  slug,
  "Build"
);

if (!fs.existsSync(root)) {
  console.error(`[decompress] Dossier introuvable : ${root}`);
  process.exit(1);
}

for (const name of fs.readdirSync(root)) {
  if (!name.endsWith(".br")) continue;
  const brPath = path.join(root, name);
  const outPath = path.join(root, name.replace(/\.br$/, ""));
  const raw = zlib.brotliDecompressSync(fs.readFileSync(brPath));
  fs.writeFileSync(outPath, raw);
  console.log(`[decompress] ${name} -> ${path.basename(outPath)} (${raw.length} bytes)`);
}

console.log("[decompress] Mettre à jour index.html si besoin (URLs sans .br).");
