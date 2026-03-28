import { describe, expect, it, vi, afterEach } from "vitest";
import {
  LIFEBOOK_APP_ENTRY_PATH,
  LIFEBOOK_DIST_ENTRY_PATH,
  resolveLifebookEntryPath,
} from "../src/lifebook-viewer/routing/buildQuantumUrls";

describe("resolveLifebookEntryPath", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("無 browser（node）回退 LIFEBOOK_APP_ENTRY_PATH", () => {
    expect(resolveLifebookEntryPath()).toBe(LIFEBOOK_APP_ENTRY_PATH);
  });

  it("pathname 為 /dist/lifebook-viewer.html 時保留", () => {
    vi.stubGlobal("window", { location: { pathname: "/dist/lifebook-viewer.html", port: "" } });
    expect(resolveLifebookEntryPath()).toBe("/dist/lifebook-viewer.html");
  });

  it("pathname 為 /timeline 且非 Vite dev → dist 入口", () => {
    vi.stubGlobal("window", { location: { pathname: "/timeline", port: "" } });
    expect(resolveLifebookEntryPath()).toBe(LIFEBOOK_DIST_ENTRY_PATH);
  });

  it("pathname 為 /viewer 且 Vite port → 根 lifebook-viewer.html", () => {
    vi.stubGlobal("window", { location: { pathname: "/viewer", port: "5173" } });
    expect(resolveLifebookEntryPath()).toBe("/lifebook-viewer.html");
  });
});
