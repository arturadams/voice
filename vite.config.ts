import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

const REPO = "voice";
const BASE = `/`; //`/${REPO}/`;

export default defineConfig({
  base: BASE, // important for assets & SW scope on GH Pages
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "dark-favicon.ico",
        "apple-touch-icon.png",
        "apple-touch-icon-dark.png",
      ],
      manifest: {
        name: "Velvet Notes",
        short_name: "VelvetNotes",
        description: "Premium voice notes — record, tag, and sync",
        // Use relative scope when deploying under a subpath:
        start_url: ".",
        scope: ".",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#0f172a",
        // Use relative icon paths; the plugin will prefix with base
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable any",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
        navigateFallback: "index.html", // within the sub-scope
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          // App shell/assets
          {
            urlPattern: ({ url }) => url.origin === self.location.origin,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "app-shell" },
          },
          // Never cache uploads
          { urlPattern: ({ request }) => request.destination === "audio", handler: "NetworkOnly" },
          // Your API lives elsewhere (ngrok, etc.) -> manual sync only
          { urlPattern: ({ url }) => /\/notes(\/|$)/.test(url.pathname), handler: "NetworkOnly" },
        ],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
    }),
  ],
});
