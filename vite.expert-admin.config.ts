import { defineConfig } from "vite";
import path from "path";

/**
 * 專家後台專用打包：計算模組 + API + 經緯度
 * 產出：dist/expert-admin.js
 * 執行：npm run build:expert-admin
 */
export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: false,
    rollupOptions: {
      input: path.resolve(__dirname, "js/entry-expert-admin.js"),
      output: {
        entryFileNames: "expert-admin.js",
        format: "iife",
        inlineDynamicImports: true,
      },
    },
    sourcemap: true,
    minify: "esbuild",
    target: "es2020",
  },
});
