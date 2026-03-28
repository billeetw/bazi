import { describe, expect, it } from "vitest";
import { buildSiHuaLayers } from "../src/lifeBookPrompts.js";
import {
  compareClientSihuaLayersToWorker,
  hasClientSihuaLayers,
  isClientSihuaLayersDiffLogEnabled,
  isDeprecatedClientSihuaWireOmittedForCompute,
} from "../src/lifebook/sihuaLayersClientDiff.js";
import { LIFEBOOK_CANONICAL_TEST_CHART_JSON } from "./fixtures/lifebookCanonicalTestChart.js";

describe("sihuaLayersClientDiff (Phase 1+2)", () => {
  it("hasClientSihuaLayers is false when wire absent", () => {
    expect(hasClientSihuaLayers(undefined)).toBe(false);
    expect(hasClientSihuaLayers({})).toBe(false);
    expect(hasClientSihuaLayers({ ...LIFEBOOK_CANONICAL_TEST_CHART_JSON })).toBe(false);
  });

  it("hasClientSihuaLayers is true when any transforms non-empty", () => {
    expect(
      hasClientSihuaLayers({
        sihuaLayers: {
          benMing: { transforms: [{ starId: "tianLiang", type: "lu", fromPalace: "ming", toPalace: "qianyi" }] },
        },
      })
    ).toBe(true);
  });

  it("compare skips layers without client transforms (no false mismatch)", () => {
    const worker = buildSiHuaLayers(LIFEBOOK_CANONICAL_TEST_CHART_JSON);
    const diff = compareClientSihuaLayersToWorker(LIFEBOOK_CANONICAL_TEST_CHART_JSON, worker);
    expect(diff.hasClientSihuaLayers).toBe(false);
    expect(diff.mismatchCount).toBe(0);
    expect(diff.layers.every((L) => L.matches)).toBe(true);
  });

  it("isClientSihuaLayersDiffLogEnabled is false unless LIFEBOOK_CLIENT_SIHUA_DIFF_LOG=1", () => {
    const prev = process.env.LIFEBOOK_CLIENT_SIHUA_DIFF_LOG;
    try {
      delete process.env.LIFEBOOK_CLIENT_SIHUA_DIFF_LOG;
      expect(isClientSihuaLayersDiffLogEnabled()).toBe(false);
      process.env.LIFEBOOK_CLIENT_SIHUA_DIFF_LOG = "1";
      expect(isClientSihuaLayersDiffLogEnabled()).toBe(true);
    } finally {
      if (prev === undefined) delete process.env.LIFEBOOK_CLIENT_SIHUA_DIFF_LOG;
      else process.env.LIFEBOOK_CLIENT_SIHUA_DIFF_LOG = prev;
    }
  });

  it("compare reports mismatch when client benMing transforms disagree with worker", () => {
    const worker = buildSiHuaLayers(LIFEBOOK_CANONICAL_TEST_CHART_JSON);
    const chart = {
      ...LIFEBOOK_CANONICAL_TEST_CHART_JSON,
      sihuaLayers: {
        benMing: {
          transforms: [
            { starId: "ziWei", type: "lu", fromPalace: "ming", toPalace: "xiongdi" },
            { starId: "ziWei", type: "quan", fromPalace: "ming", toPalace: "xiongdi" },
            { starId: "ziWei", type: "ke", fromPalace: "ming", toPalace: "xiongdi" },
            { starId: "ziWei", type: "ji", fromPalace: "ming", toPalace: "xiongdi" },
          ],
        },
      },
    };
    const diff = compareClientSihuaLayersToWorker(chart, worker);
    expect(diff.hasClientSihuaLayers).toBe(true);
    expect(diff.mismatchCount).toBeGreaterThan(0);
    const ben = diff.layers.find((L) => L.layerKey === "benming");
    expect(ben?.clientPresent).toBe(true);
    expect(ben?.matches).toBe(false);
  });

  it("buildSiHuaLayers ignores deprecated client wire when diff log off (strip for compute)", () => {
    const prevDiff = process.env.LIFEBOOK_CLIENT_SIHUA_DIFF_LOG;
    const prevKeep = process.env.LIFEBOOK_KEEP_CLIENT_SIHUA_WIRE;
    try {
      delete process.env.LIFEBOOK_CLIENT_SIHUA_DIFF_LOG;
      delete process.env.LIFEBOOK_KEEP_CLIENT_SIHUA_WIRE;
      expect(isDeprecatedClientSihuaWireOmittedForCompute()).toBe(true);
      const base = buildSiHuaLayers(LIFEBOOK_CANONICAL_TEST_CHART_JSON);
      const withWire = buildSiHuaLayers({
        ...LIFEBOOK_CANONICAL_TEST_CHART_JSON,
        sihuaLayers: {
          benMing: {
            transforms: [{ starId: "ziWei", type: "lu", fromPalace: "ming", toPalace: "xiongdi" }],
          },
        },
      });
      expect(withWire).toEqual(base);
    } finally {
      if (prevDiff === undefined) delete process.env.LIFEBOOK_CLIENT_SIHUA_DIFF_LOG;
      else process.env.LIFEBOOK_CLIENT_SIHUA_DIFF_LOG = prevDiff;
      if (prevKeep === undefined) delete process.env.LIFEBOOK_KEEP_CLIENT_SIHUA_WIRE;
      else process.env.LIFEBOOK_KEEP_CLIENT_SIHUA_WIRE = prevKeep;
    }
  });
});
