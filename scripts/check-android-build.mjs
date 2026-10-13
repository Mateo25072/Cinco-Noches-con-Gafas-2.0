import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = resolve(root, "dist-android");
const html = readFileSync(join(dist, "index.html"), "utf8");
const config = readFileSync(join(root, "src/lib/game/config.ts"), "utf8");
const manifest = readFileSync(join(root, "android/app/src/main/AndroidManifest.xml"), "utf8");
const gameAssets = [...config.matchAll(/"\/game\/[^"]+"/g)].map(([assetPath]) =>
  assetPath.slice(1, -1),
);

assert.match(html, /<div id="root"><\/div>/, "Android entry HTML must include the React root");
assert.match(html, /\.\/assets\/[^"]+\.js/, "Android entry HTML must load the bundled app locally");
assert.doesNotMatch(html, /https?:\/\//, "Android entry HTML must not load remote resources");
assert.match(manifest, /android:screenOrientation="landscape"/, "Android game must launch in landscape");
assert.doesNotMatch(manifest, /uses-permission android:name="android\.permission\.INTERNET"/, "offline app must not request internet access");

for (const asset of gameAssets) {
  assert(isFile(join(dist, asset)), `Android bundle is missing game asset: ${asset}`);
}

for (const animation of [
  "game/chars/gafas-jump.mp4",
  "game/chars/mueca-jump.mp4",
  "game/chars/chaparro-jump-v2.mp4",
  "game/chars/fachero-jump.mp4",
  "game/chars/tortolo-jump.mp4",
]) {
  assert(isFile(join(dist, animation)), `Android bundle is missing animation: ${animation}`);
}

console.log(`Android bundle verified: ${gameAssets.length} local game assets and 5 animations.`);

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}
