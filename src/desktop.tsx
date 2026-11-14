import { createRoot } from "react-dom/client";
import { createHashHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { AppErrorComponent } from "@/lib/error-component";
import { getRouter } from "./router";
import { routeTree } from "./routeTree.gen";

const rootElement = document.getElementById("root");
if (!rootElement) throw new Error("Desktop app root element is missing");

// La versión web (GitHub Pages) vive en una subcarpeta, así que usa rutas con "#".
const router =
  import.meta.env.VITE_HASH_ROUTER === "1"
    ? createRouter({ routeTree, defaultErrorComponent: AppErrorComponent, history: createHashHistory() })
    : getRouter();

createRoot(rootElement).render(<RouterProvider router={router} />);
