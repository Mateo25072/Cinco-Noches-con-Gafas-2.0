import { app, BrowserWindow, net, protocol } from "electron";
import { existsSync } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const APP_SCHEME = "cncg";

protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_SCHEME,
    privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
  },
]);

function createWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 620,
    backgroundColor: "#070605",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  void window.loadURL(`${APP_SCHEME}://game/`);
}

app.whenReady().then(() => {
  const assetRoot = app.isPackaged
    ? path.join(process.resourcesPath, "dist")
    : path.resolve(app.getAppPath(), "dist");

  protocol.handle(APP_SCHEME, async (request) => {
    let targetPath;
    try {
      const url = new URL(request.url);
      if (url.hostname !== "game") return new Response("Not found", { status: 404 });
      const relativePath = decodeURIComponent(url.pathname).replace(/^\/+/, "") || "desktop/index.html";
      targetPath = path.resolve(assetRoot, relativePath);
    } catch {
      return new Response("Bad request", { status: 400 });
    }

    if (targetPath !== assetRoot && !targetPath.startsWith(`${assetRoot}${path.sep}`)) {
      return new Response("Forbidden", { status: 403 });
    }
    if (!existsSync(targetPath)) return new Response("Not found", { status: 404 });

    const response = await net.fetch(pathToFileURL(targetPath).toString());
    const contentType = targetPath.endsWith(".mp4") ? "video/mp4" : response.headers.get("content-type");
    if (!contentType || response.headers.get("content-type") === contentType) return response;

    const headers = new Headers(response.headers);
    headers.set("content-type", contentType);
    return new Response(response.body, { status: response.status, headers });
  });

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
