import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const projectRoot = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  root: resolve(projectRoot, "capacitor-web"),
  base: "./",
  publicDir: resolve(projectRoot, "public"),
  resolve: { tsconfigPaths: true },
  plugins: [
    TanStackRouterVite({
      target: "react",
      routesDirectory: resolve(projectRoot, "src/routes"),
      generatedRouteTree: resolve(projectRoot, "src/routeTree.gen.ts"),
    }),
    tailwindcss(),
    viteReact(),
  ],
  build: {
    outDir: resolve(projectRoot, "dist-android"),
    emptyOutDir: true,
    rollupOptions: {
      input: { index: resolve(projectRoot, "capacitor-web/index.html") },
    },
  },
});
