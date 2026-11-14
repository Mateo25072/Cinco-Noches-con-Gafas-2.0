import { app, BrowserWindow, dialog, net, protocol } from "electron";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const APP_SCHEME = "cncg";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".ico": "image/x-icon",
  ".map": "application/json",
};

protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
      bypassCSP: true,
    },
  },
]);

function mimeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME[ext] || null;
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 620,
    backgroundColor: "#070605",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      webSecurity: true,
    },
  });

  window.once("ready-to-show", () => window.show());
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("did-fail-load", (_e, code, desc, url) => {
    console.error("[CNCG] did-fail-load", code, desc, url);
  });

  void window.loadURL(`${APP_SCHEME}://game/`);
  return window;
}

app.whenReady().then(() => {
  const assetRoot = app.isPackaged
    ? path.join(process.resourcesPath, "dist")
    : path.resolve(app.getAppPath(), "dist");

  const indexHtml = path.join(assetRoot, "desktop", "index.html");
  if (!existsSync(indexHtml)) {
    dialog.showErrorBox(
      "Cinco Noches con Gafas",
      [
        "No se encontraron los archivos del juego.",
        "",
        "Ruta buscada:",
        indexHtml,
        "",
        "Si compilas en este PC, ejecuta:",
        "  npm run desktop:dist",
        "",
        "Si descargaste el .exe, asegúrate de no haber borrado la carpeta resources.",
      ].join("\n"),
    );
  }

  protocol.handle(APP_SCHEME, async (request) => {
    let targetPath;
    try {
      const url = new URL(request.url);
      if (url.hostname !== "game") {
        return new Response("Not found", { status: 404 });
      }
      let relativePath = decodeURIComponent(url.pathname).replace(/^\/+/, "");
      if (!relativePath || relativePath === "/") {
        relativePath = "desktop/index.html";
      }
      targetPath = path.resolve(assetRoot, relativePath);
    } catch {
      return new Response("Bad request", { status: 400 });
    }

    const rootWithSep = `${assetRoot}${path.sep}`;
    if (targetPath !== assetRoot && !targetPath.startsWith(rootWithSep)) {
      return new Response("Forbidden", { status: 403 });
    }
    if (!existsSync(targetPath)) {
      console.error("[CNCG] missing", targetPath);
      return new Response("Not found", { status: 404 });
    }

    try {
      const body = readFileSync(targetPath);
      const type = mimeFor(targetPath) || "application/octet-stream";
      return new Response(body, {
        status: 200,
        headers: {
          "content-type": type,
          "cache-control": "public, max-age=3600",
        },
      });
    } catch (err) {
      console.error("[CNCG] read failed", targetPath, err);
      return new Response("Error", { status: 500 });
    }
  });

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
