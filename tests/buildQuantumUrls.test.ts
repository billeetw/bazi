import { describe, expect, it } from "vitest";
import {
  buildHomePalaceReadUrl,
  buildRootUrl,
  buildTimelineUrl,
  buildViewerUrl,
  LIFEBOOK_APP_ENTRY_PATH,
  ROOT_VIEW_DOMAINS_CONTRACT,
} from "../src/lifebook-viewer/routing/buildQuantumUrls";

describe("buildHomePalaceReadUrl", () => {
  it("僅相對 hash，不切 view=viewer、不切 pathname", () => {
    expect(buildHomePalaceReadUrl("ming")).toBe("#palace-ming");
  });
});

describe("buildViewerUrl", () => {
  it("only palaceId", () => {
    expect(buildViewerUrl({ palaceId: "ming" })).toBe(`${LIFEBOOK_APP_ENTRY_PATH}?view=viewer#palace-ming`);
  });

  it("palaceId + source", () => {
    expect(buildViewerUrl({ palaceId: "fuqi", source: "domains" })).toBe(
      `${LIFEBOOK_APP_ENTRY_PATH}?view=viewer&source=domains#palace-fuqi`
    );
  });

  it("palaceId + year + timelineNodeId + source", () => {
    expect(
      buildViewerUrl({
        palaceId: "jie",
        year: 2026,
        timelineNodeId: "y2026",
        source: "timeline",
      })
    ).toBe(
      `${LIFEBOOK_APP_ENTRY_PATH}?view=viewer&source=timeline&year=2026&timeline_node=y2026#palace-jie`
    );
  });

  it("panel + mode", () => {
    expect(
      buildViewerUrl({
        palaceId: "ming",
        panel: "structure",
        mode: "full",
      })
    ).toBe(`${LIFEBOOK_APP_ENTRY_PATH}?view=viewer&panel=structure&mode=full#palace-ming`);
  });

  it("compatViewQuery = false 仍附 view=viewer（改以 HTML 路徑承載，不再依賴 /viewer pathname）", () => {
    expect(buildViewerUrl({ palaceId: "caibo", compatViewQuery: false })).toBe(
      `${LIFEBOOK_APP_ENTRY_PATH}?view=viewer#palace-caibo`
    );
  });
});

describe("buildRootUrl", () => {
  it("default root（降生藍圖主畫）附 view=home", () => {
    expect(buildRootUrl()).toBe(`${LIFEBOOK_APP_ENTRY_PATH}?view=home`);
  });

  it("view=domains", () => {
    expect(buildRootUrl({ view: "domains" })).toBe(`${LIFEBOOK_APP_ENTRY_PATH}?view=domains`);
  });
});

describe("buildTimelineUrl", () => {
  it("default", () => {
    expect(buildTimelineUrl()).toBe(`${LIFEBOOK_APP_ENTRY_PATH}?view=timeline`);
  });

  it("focus + source", () => {
    expect(buildTimelineUrl({ focus: "n1", source: "viewer" })).toBe(
      `${LIFEBOOK_APP_ENTRY_PATH}?view=timeline&focus=n1&source=viewer`
    );
  });
});

describe("ROOT_VIEW_DOMAINS_CONTRACT", () => {
  it("documents canonical product string for rewrite phase", () => {
    expect(ROOT_VIEW_DOMAINS_CONTRACT).toBe("/?view=domains");
  });
});
