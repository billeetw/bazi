import { defineConfig } from "vite";
import path from "path";

/**
 * 占卦頁專用打包：auth + 占卦模組 + divination-app
 * 產出：dist/divination.js
 * 執行：npm run build:divination
 */
export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      input: path.resolve(__dirname, "js/entry-divination.js"),
      output: {
        entryFileNames: "divination.js",
        format: "iife",
        inlineDynamicImports: true,
      },
    },
    sourcemap: true,
    minify: "esbuild",
    target: "es2020",
  },
});
