import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

beforeEach(() => {
  vi.stubGlobal(
    "HashChangeEvent",
    class extends Event {
      constructor(type: string) {
        super(type);
      }
    }
  );
});
import {
  LIFEBOOK_PALACE_HISTORY_KEY,
  pushHomePalaceHash,
  tryCloseHomePalaceOverlay,
  tryOpenPalaceOverlayFromHashHref,
} from "../src/lifebook-viewer/routing/palaceHashNavigation";

function installMockWindow(pathname: string, search: string): {
  pushState: ReturnType<typeof vi.fn>;
  dispatchEvent: ReturnType<typeof vi.fn>;
  back: ReturnType<typeof vi.fn>;
  replaceState: ReturnType<typeof vi.fn>;
} {
  const pushState = vi.fn();
  const dispatchEvent = vi.fn();
  const back = vi.fn();
  const replaceState = vi.fn();
  vi.stubGlobal(
    "window",
    {
      location: { pathname, search },
      history: { pushState, back, replaceState },
      dispatchEvent,
    } as unknown as Window & typeof globalThis
  );
  return { pushState, dispatchEvent, back, replaceState };
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("pushHomePalaceHash", () => {
  it("pushState 帶 lifebookPalace 標記並觸發 hashchange", () => {
    const { pushState, dispatchEvent } = installMockWindow("/dist/lifebook-viewer.html", "?view=timeline");
    pushHomePalaceHash("caibo");
    expect(pushState).toHaveBeenCalledTimes(1);
    const [state, , url] = pushState.mock.calls[0] as [Record<string, unknown>, string, string];
    expect(state[LIFEBOOK_PALACE_HISTORY_KEY]).toBe(true);
    expect(url).toContain("#palace-caibo");
    expect(dispatchEvent).toHaveBeenCalled();
  });
});

describe("tryOpenPalaceOverlayFromHashHref", () => {
  it("合法 #palace-* 時等同 pushHomePalaceHash", () => {
    const { pushState } = installMockWindow("/timeline", "?view=timeline");
    const ok = tryOpenPalaceOverlayFromHashHref("#palace-guanlu");
    expect(ok).toBe(true);
    expect(pushState).toHaveBeenCalled();
  });

  it("非 palace hash 回傳 false", () => {
    installMockWindow("/", "");
    expect(tryOpenPalaceOverlayFromHashHref("#foo")).toBe(false);
    expect(tryOpenPalaceOverlayFromHashHref("/lifebook-viewer.html?view=viewer")).toBe(false);
  });
});

describe("tryCloseHomePalaceOverlay", () => {
  it("state 有標記時 history.back", () => {
    const { back, replaceState } = installMockWindow("/x", "");
    vi.stubGlobal(
      "window",
      {
        location: { pathname: "/x", search: "" },
        history: {
          state: { [LIFEBOOK_PALACE_HISTORY_KEY]: true },
          back,
          replaceState,
        },
        dispatchEvent: vi.fn(),
      } as unknown as Window & typeof globalThis
    );
    tryCloseHomePalaceOverlay();
    expect(back).toHaveBeenCalled();
    expect(replaceState).not.toHaveBeenCalled();
  });
});
