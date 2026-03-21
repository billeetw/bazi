/**
 * 共用測試命盤：normalize → 12 宮敘事；窄四宮 baseline + Behavior Axis Stage1–3。
 * 輸出快照：tests/__snapshots__/lifebookCanonicalChart.test.ts.snap
 * 人讀版：docs/lifebook-canonical-test-chart-sample-output.md
 *   產生方式：`cd worker && WRITE_CANONICAL_DOC=1 npx vitest run tests/lifebookCanonicalChart.test.ts`
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { normalizeChart } from "../src/lifebook/normalize/index.js";
import {
  buildCanonicalNarrativeMarkdownDoc,
} from "./fixtures/lifebookCanonicalNarrativeOutput.js";
import { LIFEBOOK_CANONICAL_TEST_CHART_JSON } from "./fixtures/lifebookCanonicalTestChart.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("lifebook canonical test chart", () => {
  it("normalizes 子命宮並保留 chartId", () => {
    const chart = normalizeChart(LIFEBOOK_CANONICAL_TEST_CHART_JSON);
    expect(chart.mingSoulBranch).toBe("子");
    expect(chart.chartId).toBe("lifebook-canonical-test-v1");
    expect(chart.palaces).toHaveLength(12);
  });

  it("四宮敘事（baseline + Stage1–3）與快照一致", () => {
    const chart = normalizeChart(LIFEBOOK_CANONICAL_TEST_CHART_JSON);
    const doc = buildCanonicalNarrativeMarkdownDoc(chart);
    if (process.env.WRITE_CANONICAL_DOC === "1") {
      const outPath = join(__dirname, "../../docs/lifebook-canonical-test-chart-sample-output.md");
      writeFileSync(outPath, doc, "utf8");
    }
    expect(doc).toMatchSnapshot();
  });
});
