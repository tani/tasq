import { serve } from "bun";
import index from "./index.html";

const getContentType = (path: string) => {
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".webmanifest")) return "application/manifest+json";
  if (path.endsWith(".js")) return "application/javascript";
  return "application/octet-stream";
};

const serveStaticFile = (path: string) =>
  new Response(Bun.file(path), {
    headers: { "Content-Type": getContentType(path) },
  });

const server = serve({
  routes: {
    "/manifest.webmanifest": serveStaticFile("src/manifest.webmanifest"),
    "/sw.js": serveStaticFile("src/sw.js"),
    "/assets/:icon": (req) => serveStaticFile(`assets/${req.params.icon}`),
    // Serve index.html for all unmatched routes.
    "/*": index,
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },
});

console.log(`🚀 Server running at ${server.url}`);
