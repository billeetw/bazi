import { describe, expect, it, vi, afterEach } from "vitest";
import { buildSiHuaLayers } from "../src/lifeBookPrompts.js";
import {
  applySiHuaDisplayOverride,
  isSiHuaDisplayOverrideDisabledByEnv,
  LIFEBOOK_SIHUA_DISPLAY_OVERRIDE_KEY,
} from "../src/lifebook/sihuaDisplayOverride.js";
import { LIFEBOOK_CANONICAL_TEST_CHART_JSON } from "./fixtures/lifebookCanonicalTestChart.js";

describe("sihuaDisplayOverride (Phase 3)", () => {
  afterEach(() => {
    delete process.env.LIFEBOOK_SIHUA_DISPLAY_OVERRIDE_DISABLE;
  });

  it("applySiHuaDisplayOverride leaves worker layers when no override", () => {
    const worker = buildSiHuaLayers(LIFEBOOK_CANONICAL_TEST_CHART_JSON);
    const r = applySiHuaDisplayOverride(LIFEBOOK_CANONICAL_TEST_CHART_JSON, worker);
    expect(r.applied).toBe(false);
    expect(r.layers).toEqual(worker);
  });

  it("merges partial layer when valid override with audit", () => {
    const worker = buildSiHuaLayers(LIFEBOOK_CANONICAL_TEST_CHART_JSON);
    const fakeBenming = {
      lu: {
        starName: "測試星",
        palaceKey: "命宮",
        palaceName: "命宮",
        transformType: "lu" as const,
      },
      quan: null,
      ke: null,
      ji: null,
    };
    const chart = {
      ...LIFEBOOK_CANONICAL_TEST_CHART_JSON,
      [LIFEBOOK_SIHUA_DISPLAY_OVERRIDE_KEY]: {
        enabled: true as const,
        audit: { reason: "unit-test", source: "sihuaDisplayOverride.test" },
        layers: { benming: fakeBenming },
      },
    };
    const r = applySiHuaDisplayOverride(chart, worker);
    expect(r.applied).toBe(true);
    expect(r.layers.benming).toEqual(fakeBenming);
    expect(r.layers.decadal).toEqual(worker.decadal);
    expect(r.layers.yearly).toEqual(worker.yearly);
  });

  it("ignores override without audit.reason", () => {
    const worker = buildSiHuaLayers(LIFEBOOK_CANONICAL_TEST_CHART_JSON);
    const chart = {
      ...LIFEBOOK_CANONICAL_TEST_CHART_JSON,
      [LIFEBOOK_SIHUA_DISPLAY_OVERRIDE_KEY]: {
        enabled: true,
        audit: { reason: "   " },
        layers: {
          benming: worker.benming,
        },
      },
    };
    const r = applySiHuaDisplayOverride(chart, worker);
    expect(r.applied).toBe(false);
  });

  it("LIFEBOOK_SIHUA_DISPLAY_OVERRIDE_DISABLE=1 blocks apply", () => {
    process.env.LIFEBOOK_SIHUA_DISPLAY_OVERRIDE_DISABLE = "1";
    const worker = buildSiHuaLayers(LIFEBOOK_CANONICAL_TEST_CHART_JSON);
    const chart = {
      ...LIFEBOOK_CANONICAL_TEST_CHART_JSON,
      [LIFEBOOK_SIHUA_DISPLAY_OVERRIDE_KEY]: {
        enabled: true as const,
        audit: { reason: "should-not-apply" },
        layers: { benming: worker.benming },
      },
    };
    expect(isSiHuaDisplayOverrideDisabledByEnv()).toBe(true);
    const r = applySiHuaDisplayOverride(chart, worker);
    expect(r.applied).toBe(false);
    expect(r.layers).toEqual(worker);
  });

  it("buildSiHuaLayers applies override and logs audit", () => {
    const worker = buildSiHuaLayers(LIFEBOOK_CANONICAL_TEST_CHART_JSON);
    const fakeBenming = {
      lu: {
        starName: "覆寫測試",
        palaceKey: "福德宮",
        palaceName: "福德宮",
        transformType: "lu" as const,
      },
      quan: null,
      ke: null,
      ji: null,
    };
    const chart = {
      ...LIFEBOOK_CANONICAL_TEST_CHART_JSON,
      [LIFEBOOK_SIHUA_DISPLAY_OVERRIDE_KEY]: {
        enabled: true as const,
        audit: { reason: "e2e-override", correlationId: "t-1" },
        layers: { benming: fakeBenming },
      },
    };
    const logSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const layers = buildSiHuaLayers(chart);
    expect(layers.benming).toEqual(fakeBenming);
    expect(logSpy).toHaveBeenCalled();
    const payload = logSpy.mock.calls.find((c) => typeof c[0] === "string" && (c[0] as string).includes("lifebook/sihua-display-override"));
    expect(payload?.[0]).toContain("e2e-override");
    logSpy.mockRestore();
  });
});
