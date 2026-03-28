import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

/** Dev：讓 `/viewer`、`/timeline` 與正式環境 rewrite 一致，皆載入 lifebook-viewer shell */
function lifebookCanonicalPathRewrite(): Plugin {
  return {
    name: "lifebook-canonical-path-rewrite",
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        const raw = req.url ?? "";
        const pathOnly = raw.split("?")[0];
        if (pathOnly === "/viewer" || pathOnly === "/timeline") {
          const q = raw.includes("?") ? raw.slice(raw.indexOf("?")) : "";
          req.url = "/lifebook-viewer.html" + q;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), lifebookCanonicalPathRewrite()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "shared"),
    },
  },
  build: {
    outDir: "dist",
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        lifebookViewer: path.resolve(__dirname, "lifebook-viewer.html"),
      },
    },
  },
});
