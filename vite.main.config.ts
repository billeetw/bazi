import { defineConfig } from "vite";
import path from "path";

/**
 * 主應用程式打包：將 40+ 個 script 合併為單一 bundle
 * 產出：dist/app.js
 * 執行：npm run build:main
 */
export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      input: path.resolve(__dirname, "js/entry.js"),
      output: {
        entryFileNames: "app.js",
        format: "iife",
        inlineDynamicImports: true,
      },
    },
    sourcemap: true,
    minify: "esbuild",
    target: "es2020",
  },
});
