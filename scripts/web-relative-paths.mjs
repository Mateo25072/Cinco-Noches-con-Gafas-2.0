// Convierte las rutas absolutas ("/game/...", "/favicon.svg") del bundle en rutas relativas,
// para que la versión web funcione desde una subcarpeta (GitHub Pages).
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2] ?? "dist-android";
const assets = join(dir, "assets");
let changed = 0;
for (const file of readdirSync(assets)) {
  if (!file.endsWith(".js") && !file.endsWith(".css")) continue;
  const path = join(assets, file);
  const before = readFileSync(path, "utf8");
  const after = before.replace(/(["'`(])\/(game\/|favicon\.svg)/g, "$1./$2");
  if (after !== before) {
    writeFileSync(path, after);
    changed += 1;
  }
}
console.log(`Rutas relativas aplicadas en ${changed} archivo(s).`);
