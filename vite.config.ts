import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icons/apple-touch-icon.png"],
      manifest: {
        name: "Velvet Notes",
        short_name: "VelvetNotes",
        description: "Premium voice notes — record, tag, and sync",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#0f172a",
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable any",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest}"],
        navigateFallback: "/index.html",
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === self.location.origin,
            handler: "StaleWhileRevalidate",
            options: { cacheName: "app-shell" },
          },
          { urlPattern: ({ request }) => request.destination === "audio", handler: "NetworkOnly" },
          { urlPattern: ({ url }) => /\/notes(\/|$)/.test(url.pathname), handler: "NetworkOnly" },
        ],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
      },
      devOptions: { enabled: true, type: "module" },
    }),
  ],

  // 👇 Add these blocks
  server: {
    host: true,
    port: 5173,
    allowedHosts: ["enjoyed-slowly-minnow.ngrok-free.app"], // <— put your ngrok host here
  },
  preview: {
    host: true,
    port: 4173,
    allowedHosts: ["enjoyed-slowly-minnow.ngrok-free.app"], // <— and here for `npm run preview`
  },
});
