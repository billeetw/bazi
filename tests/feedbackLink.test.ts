import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { buildLifebookFeedbackUrl } from "../src/lifebook-viewer/utils/feedbackLink";

describe("feedbackLink", () => {
  let store: Record<string, string>;

  beforeEach(() => {
    store = {};
    const ls = {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => {
        store[k] = v;
      },
      removeItem: (k: string) => {
        delete store[k];
      },
    };
    vi.stubGlobal("window", {
      localStorage: ls,
      location: { origin: "https://example.com" },
      Config: { LIFEBOOK_FEEDBACK_URL: "https://forms.gle/abc123" },
    } as unknown as Window & typeof globalThis);
    store.bazi_user = JSON.stringify({ id: "uid9" });
    store.lifebook_v2_beta_invite_code = "BETA";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns empty string when base URL missing", () => {
    vi.stubGlobal("window", {
      localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      location: { origin: "https://example.com" },
      Config: { LIFEBOOK_FEEDBACK_URL: "" },
    } as unknown as Window & typeof globalThis);
    expect(buildLifebookFeedbackUrl({ current_surface: "root" })).toBe("");
  });

  it("appends query params", () => {
    const url = buildLifebookFeedbackUrl({
      current_surface: "timeline",
      palace_id: "ming",
    });
    const u = new URL(url);
    expect(u.origin + u.pathname).toBe("https://forms.gle/abc123");
    expect(u.searchParams.get("user_id")).toBe("uid9");
    expect(u.searchParams.get("invite_code")).toBe("BETA");
    expect(u.searchParams.get("current_surface")).toBe("timeline");
    expect(u.searchParams.get("palace_id")).toBe("ming");
  });
});
