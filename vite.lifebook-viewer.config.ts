import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";

/**
 * 命書 Viewer 專用打包（React）
 * 產出：dist/lifebook-viewer.html + dist/lifebook-viewer-*.js
 * 執行：npm run build:lifebook-viewer
 */
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      input: path.resolve(__dirname, "lifebook-viewer.html"),
      output: {
        entryFileNames: "lifebook-viewer.js",
        chunkFileNames: "lifebook-viewer-[name]-[hash].js",
        assetFileNames: "lifebook-viewer-[name]-[hash][extname]",
      },
    },
    sourcemap: true,
    minify: "esbuild",
    target: "es2020",
  },
});
