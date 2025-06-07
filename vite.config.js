import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
// import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    // VitePWA({
    //   workbox: {
    //     maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // ✅ Increase to 5MB (default is 2MB)
    //   },
    //   registerType: "autoUpdate",
    //   includeAssets: ["favicon.ico", "logo.png", "logo.png"],
    //   manifest: {
    //     name: "iRembo Finance Management System",
    //     short_name: "iRembo Finance",
    //     theme_color: "#000",
    //     icons: [
    //       {
    //         src: "pwa-64x64.png",
    //         sizes: "64x64",
    //         type: "image/png",
    //       },
    //       {
    //         src: "pwa-192x192.png",
    //         sizes: "192x192",
    //         type: "image/png",
    //       },
    //       {
    //         src: "pwa-512x512.png",
    //         sizes: "512x512",
    //         type: "image/png",
    //         purpose: "any",
    //       },
    //       {
    //         src: "maskable-icon-512x512.png",
    //         sizes: "512x512",
    //         type: "image/png",
    //         purpose: "maskable",
    //       },
    //     ],
    //   },
    // }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
