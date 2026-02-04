import { serve } from "bun";
import index from "./index.html";
import manifest from "./manifest.webmanifest";
import sw from "./sw.js";

const server = serve({
  routes: {
    "/manifest.webmanifest": new Response(manifest, {
      headers: { "Content-Type": "application/manifest+json" },
    }),
    "/sw.js": new Response(sw, {
      headers: { "Content-Type": "application/javascript" },
    }),
    "/assets/icon-32.png": new Response(Bun.file("assets/icon-32.png"), {
      headers: { "Content-Type": "image/png" },
    }),
    "/assets/icon-180.png": new Response(Bun.file("assets/icon-180.png"), {
      headers: { "Content-Type": "image/png" },
    }),
    "/assets/icon-192.png": new Response(Bun.file("assets/icon-192.png"), {
      headers: { "Content-Type": "image/png" },
    }),
    "/assets/icon-512.png": new Response(Bun.file("assets/icon-512.png"), {
      headers: { "Content-Type": "image/png" },
    }),
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
