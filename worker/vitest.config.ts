import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      // 讓 tests 可 import src 時 .js 對應 .ts
      ".js": ".ts",
    },
  },
});
