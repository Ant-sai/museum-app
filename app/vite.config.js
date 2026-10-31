import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  // Relative base so the build works at any path (e.g. GitHub Pages /museum-app/).
  base: "./",
  plugins: [
    vue(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon.svg"],
      manifest: {
        name: "Seoul Exhibitions",
        short_name: "Exhibitions",
        description: "Current and upcoming exhibitions in Seoul galleries",
        lang: "en",
        theme_color: "#1f1d1a",
        background_color: "#f6f4ef",
        display: "standalone",
        start_url: ".",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // The data file changes daily: try the network first, fall back to cache offline.
        runtimeCaching: [
          {
            urlPattern: /exhibitions\.json$/,
            handler: "NetworkFirst",
            options: { cacheName: "exhibitions-data", networkTimeoutSeconds: 5 },
          },
        ],
        globIgnores: ["**/exhibitions.json"],
      },
    }),
  ],
});
