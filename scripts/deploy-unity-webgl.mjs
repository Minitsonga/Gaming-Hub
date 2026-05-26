/**
 * Copie un export Unity WebGL vers public/games/<slug>/,
 * conserve index.html du hub (pont Gaming Hub), décompresse les .br pour localhost.
 *
 * Usage :
 *   node scripts/deploy-unity-webgl.mjs <slug> <sourceDir>
 *
 * Exemple :
 *   node scripts/deploy-unity-webgl.mjs roguesurvival "C:/Exports/RogueSurvival-WebGL"
 *
 * sourceDir doit contenir Build/ et TemplateData/ (export Unity classique).
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const hubRoot = path.resolve(scriptDir, "..");

const slug = process.argv[2];
const sourceArg = process.argv[3];

if (!slug || !sourceArg) {
  console.error(
    "[deploy] Usage: node scripts/deploy-unity-webgl.mjs <slug> <sourceDir>\n" +
      "  ex. node scripts/deploy-unity-webgl.mjs roguesurvival ../path/to/unity-export"
  );
  process.exit(1);
}

const sourceDir = path.resolve(sourceArg);
const targetDir = path.resolve(hubRoot, "frontend/public/games", slug);

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.error(`[deploy] Source introuvable : ${src}`);
    process.exit(1);
  }
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }
}

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const indexPath = path.join(targetDir, "index.html");
if (!fs.existsSync(indexPath)) {
  console.error(
    `[deploy] index.html hub manquant dans ${targetDir} — créer le shell avec le pont avant deploy.`
  );
  process.exit(1);
}

console.log(`[deploy] ${sourceDir} → ${targetDir}`);
copyDir(path.join(sourceDir, "Build"), path.join(targetDir, "Build"));
copyDir(path.join(sourceDir, "TemplateData"), path.join(targetDir, "TemplateData"));

const decompress = spawnSync(
  process.execPath,
  [path.join(scriptDir, "decompress-unity-webgl.mjs"), slug],
  { stdio: "inherit", cwd: hubRoot }
);
if (decompress.status !== 0) process.exit(decompress.status ?? 1);

console.log(`[deploy] OK — jeu servi sur /games/${slug}/index.html`);
