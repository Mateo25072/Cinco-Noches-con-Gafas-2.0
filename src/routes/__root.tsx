import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import appCss from "../styles.css?url";

const APP_NAME = "Cinco Noches con Gafas";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "theme-color", content: "#070605" },
      {
        name: "description",
        content:
          "Parodia de Five Nights at Freddy's 2: máscara, linterna, conductos y caja de música. Gafas y Mueca no duermen.",
      },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg" },
      ...(import.meta.env.MODE === "desktop"
        ? []
        : [
            {
              rel: "stylesheet",
              href: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Special+Elite&display=swap",
            },
          ]),
      { rel: "stylesheet", href: appCss },
      ...(import.meta.env.MODE === "desktop"
        ? []
        : [
            { rel: "manifest", href: "/__grok/manifest.webmanifest" },
            { rel: "apple-touch-icon", href: "/__grok/icon-180.png" },
          ]),
    ],
  }),
  component: () => (
    <html lang="es" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <PreviewHostBridge />
        <AuthProvider>
          <Outlet />
        </AuthProvider>
        <Scripts />
      </body>
    </html>
  ),
});
