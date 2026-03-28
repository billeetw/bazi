import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";

/**
 * 命書 Viewer 專用打包（React）
 * 產出：dist/lifebook-viewer.html + dist/lifebook-viewer-*.js
 * 執行：npm run build:lifebook-viewer
 *
 * base 必須為絕對 `/dist/`：`_redirects` 將 `/viewer`、`/timeline` 改寫為本 HTML 時，
 * 網址列可能是 `/viewer`；若用相對 `./lifebook-viewer.js` 會解析成 `/lifebook-viewer.js`（404 或 octet-stream）而非 `/dist/lifebook-viewer.js`。
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  base: "/dist/",
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
