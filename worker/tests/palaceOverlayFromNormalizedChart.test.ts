/**
 * Phase 1：buildPalaceOverlayFromNormalizedChart 與 buildPalaceOverlay 對照測試。
 * 同一 chartJson 經 normalizeChart → adapter 產生的 overlay 應與舊路徑一致（宮位、星曜、四化流向）。
 */

import { describe, it, expect } from "vitest";
import { normalizeChart } from "../src/lifebook/normalize/index.js";
import {
  buildPalaceOverlay,
  buildPalaceOverlayFromNormalizedChart,
  buildPalaceOverlayBlocks,
  type PalaceOverlayEntry,
} from "../src/lifebook/palaceOverlay.js";
import { buildEventSignals } from "../src/lifebook/s18/eventSignals.js";
import { LIFEBOOK_CANONICAL_TEST_CHART_JSON } from "./fixtures/lifebookCanonicalTestChart.js";

const fixtureChart = LIFEBOOK_CANONICAL_TEST_CHART_JSON;

function sortStrings(a: string[]): string[] {
  return [...a].sort();
}

function flowKey(f: { star: string; transform: string; fromPalace: string; toPalace: string; layer: string }): string {
  return `${f.layer}:${f.star}:${f.transform}:${f.fromPalace}→${f.toPalace}`;
}

describe("buildPalaceOverlayFromNormalizedChart vs buildPalaceOverlay", () => {
  const chart = normalizeChart(fixtureChart);
  const overlayFromChart = buildPalaceOverlayFromNormalizedChart(chart);
  const overlayFromJson = buildPalaceOverlay(fixtureChart, { currentAge: 54, flowYear: 2026 });

  it("both produce 12 palaces in same canonical order", () => {
    expect(overlayFromChart).toHaveLength(12);
    expect(overlayFromJson).toHaveLength(12);
    const orderChart = overlayFromChart.map((e) => e.palace);
    const orderJson = overlayFromJson.map((e) => e.palace);
    expect(orderChart).toEqual(orderJson);
  });

  it("natalStars per palace match (set equality)", () => {
    for (let i = 0; i < 12; i++) {
      const fromChart = sortStrings(overlayFromChart[i].natalStars);
      const fromJson = sortStrings(overlayFromJson[i].natalStars);
      expect(fromChart).toEqual(fromJson);
    }
  });

  it("decadal flows per palace match (same star/transform/toPalace)", () => {
    for (let i = 0; i < 12; i++) {
      const palace = overlayFromChart[i].palace;
      const decInChart = (overlayFromChart[i].decadalIncoming ?? []).map(flowKey).sort();
      const decInJson = (overlayFromJson[i].decadalIncoming ?? []).map(flowKey).sort();
      const decOutChart = (overlayFromChart[i].decadalOutgoing ?? []).map(flowKey).sort();
      const decOutJson = (overlayFromJson[i].decadalOutgoing ?? []).map(flowKey).sort();
      expect(decInChart, `decadalIncoming ${palace}`).toEqual(decInJson);
      expect(decOutChart, `decadalOutgoing ${palace}`).toEqual(decOutJson);
    }
  });

  it("yearly flows per palace match (same star/transform/toPalace)", () => {
    for (let i = 0; i < 12; i++) {
      const palace = overlayFromChart[i].palace;
      const yInChart = (overlayFromChart[i].yearlyIncoming ?? []).map(flowKey).sort();
      const yInJson = (overlayFromJson[i].yearlyIncoming ?? []).map(flowKey).sort();
      const yOutChart = (overlayFromChart[i].yearlyOutgoing ?? []).map(flowKey).sort();
      const yOutJson = (overlayFromJson[i].yearlyOutgoing ?? []).map(flowKey).sort();
      expect(yInChart, `yearlyIncoming ${palace}`).toEqual(yInJson);
      expect(yOutChart, `yearlyOutgoing ${palace}`).toEqual(yOutJson);
    }
  });

  it("adapter overlay has natalIncoming where chart has natal edges", () => {
    const withNatal = overlayFromChart.filter((e) => (e.natalIncoming?.length ?? 0) > 0);
    expect(withNatal.length).toBeGreaterThan(0);
    const brother = overlayFromChart.find((e) => e.palace === "兄弟宮") as PalaceOverlayEntry;
    expect(brother?.natalIncoming?.some((f) => f.star === "廉貞" && f.transform === "祿")).toBe(true);
  });

  it("buildPalaceOverlayBlocks works with adapter output", () => {
    const text = buildPalaceOverlayBlocks(overlayFromChart);
    expect(text).toContain("【疊宮分析】");
    expect(text).toContain("【命宮】");
    expect(text).toContain("本命星曜");
  });

  it("buildEventSignals(overlayFromChart) without chartJson uses natalIncoming and produces valid S18Signals", () => {
    const signals = buildEventSignals(overlayFromChart);
    expect(signals.palaces.length).toBeGreaterThan(0);
    expect(signals.keyPalaces).toBeDefined();
    expect(signals.mainTheme).toBeDefined();
    expect(signals.challenge).toBeDefined();
  });

  it("buildEventSignals(overlayFromChart) produces consistent S18 structure (natal from adapter may differ from chartJson benming)", () => {
    const signalsFromAdapter = buildEventSignals(overlayFromChart);
    const signalsFromJson = buildEventSignals(overlayFromJson, fixtureChart);
    expect(signalsFromAdapter.palaces.length).toBeGreaterThan(0);
    expect(signalsFromJson.palaces.length).toBeGreaterThan(0);
    expect(signalsFromAdapter.keyPalaces.strongestOpportunity).toBeDefined();
    expect(signalsFromAdapter.keyPalaces.strongestPressure).toBeDefined();
    expect(signalsFromAdapter.mainTheme.palace).toBeDefined();
  });
});
