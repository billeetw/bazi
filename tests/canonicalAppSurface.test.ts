import { describe, expect, it } from "vitest";
import { getAppSurfaceFromLocation, getRootSubViewFromLocation } from "../src/lifebook-viewer/routing/canonicalAppSurface";

describe("getAppSurfaceFromLocation", () => {
  it("無 view 時預設為時間軸", () => {
    expect(getAppSurfaceFromLocation("https://x.test/lifebook-viewer.html")).toBe("timeline");
    expect(getAppSurfaceFromLocation("https://x.test/dist/lifebook-viewer.html")).toBe("timeline");
  });

  it("view=home 為降生藍圖（root）", () => {
    expect(getAppSurfaceFromLocation("https://x.test/lifebook-viewer.html?view=home")).toBe("root");
  });

  it("view=domains 為 root（十二宮矩陣子視圖）", () => {
    expect(getAppSurfaceFromLocation("https://x.test/lifebook-viewer.html?view=domains")).toBe("root");
  });

  it("view=timeline 與 pathname /timeline", () => {
    expect(getAppSurfaceFromLocation("https://x.test/lifebook-viewer.html?view=timeline")).toBe("timeline");
    expect(getAppSurfaceFromLocation("https://x.test/timeline")).toBe("timeline");
  });

  it("pathname /viewer 仍為 viewer", () => {
    expect(getAppSurfaceFromLocation("https://x.test/viewer")).toBe("viewer");
  });
});

describe("getRootSubViewFromLocation", () => {
  it("view=home 時 subview 為 default", () => {
    expect(getRootSubViewFromLocation("https://x.test/lifebook-viewer.html?view=home")).toBe("default");
  });

  it("view=domains 時為 domains", () => {
    expect(getRootSubViewFromLocation("https://x.test/lifebook-viewer.html?view=domains")).toBe("domains");
  });
});
