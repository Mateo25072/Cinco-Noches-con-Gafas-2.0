import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = resolve(root, "dist");
const html = readFileSync(join(dist, "desktop/index.html"), "utf8");
const gameConfig = readFileSync(join(root, "src/lib/game/config.ts"), "utf8");
const assetPaths = [...gameConfig.matchAll(/"\/game\/[^"]+"/g)].map(([assetPath]) =>
  assetPath.slice(1, -1),
);
const missingAssets = [...new Set(assetPaths)].filter((assetPath) => !statExists(join(dist, assetPath)));
const animations = [
  "game/chars/gafas-jump.mp4",
  "game/chars/mueca-jump.mp4",
  "game/chars/chaparro-jump-v2.mp4",
  "game/chars/fachero-jump.mp4",
  "game/chars/tortolo-jump.mp4",
];

assert.match(html, /<div id="root"><\/div>/, "desktop HTML must include the React root");
assert.match(html, /\.\.\/assets\/[^"]+\.js/, "desktop HTML must load its bundled app");
assert.doesNotMatch(html, /https?:\/\//, "desktop HTML must not request remote resources");
assert.deepEqual(missingAssets, [], "all configured game assets must be present in the offline bundle");
for (const animation of animations) {
  assert(statExists(join(dist, animation)), `game animation must be included: ${animation}`);
}

const bundleText = walk(dist)
  .filter((path) => /\.(?:html|js|css)$/.test(path))
  .map((path) => readFileSync(path, "utf8"))
  .join("\n");
assert.doesNotMatch(bundleText, /fonts\.googleapis\.com|manifest\.webmanifest/);

console.log(
  `Desktop bundle verified: ${new Set(assetPaths).size} game assets and ${animations.length} animations included; no remote fonts or PWA manifest.`,
);

function statExists(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}
