import path from "path";
import { defineConfig } from "vitest/config";

/**
 * 單元測試（命書組裝器等）
 * 執行：npm run test
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
