import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { enrichTelemetryPayload, readTelemetryInviteCode, readTelemetryUserId } from "../src/lifebook-viewer/utils/telemetryContext";

describe("telemetryContext", () => {
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
    } as unknown as Window & typeof globalThis);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("reads user id from bazi_user JSON", () => {
    store.bazi_user = JSON.stringify({ id: "42", email: "a@b.c" });
    expect(readTelemetryUserId()).toBe("42");
  });

  it("falls back to bazi_user_id", () => {
    store.bazi_user_id = "anon_1";
    expect(readTelemetryUserId()).toBe("anon_1");
  });

  it("reads invite code", () => {
    store.lifebook_v2_beta_invite_code = "  CODE  ";
    expect(readTelemetryInviteCode()).toBe("CODE");
  });

  it("enrichTelemetryPayload merges identity last", () => {
    store.bazi_user = JSON.stringify({ id: "u1" });
    store.lifebook_v2_beta_invite_code = "INV";
    const out = enrichTelemetryPayload({
      palace_id: "ming",
      user_id: "should_not_win",
    });
    expect(out.palace_id).toBe("ming");
    expect(out.user_id).toBe("u1");
    expect(out.invite_code).toBe("INV");
  });
});
