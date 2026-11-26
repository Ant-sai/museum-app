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
        name: "The Moment of Exhibition",
        short_name: "Exhibitions",
        description: "Discover current and upcoming exhibitions in Seoul galleries",
        lang: "en",
        // Same value as --color-bg in src/style.css (the manifest cannot read CSS variables).
        theme_color: "#f6f3ee",
        background_color: "#f6f3ee",
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
          {
            // Pretendard ships ~90 unicode-range subsets: cache only the ones a page actually uses.
            urlPattern: /Pretendard.*\.woff2$/,
            handler: "CacheFirst",
            options: { cacheName: "pretendard", expiration: { maxEntries: 100 } },
          },
        ],
        // Latin fonts are small: precache them with the app so it renders offline.
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        globIgnores: ["**/exhibitions.json", "**/Pretendard*", "**/*-{cyrillic,cyrillic-ext,greek,vietnamese}-*"],
      },
    }),
  ],
});
