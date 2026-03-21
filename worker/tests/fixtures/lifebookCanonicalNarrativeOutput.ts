/**
 * 由共用測試命盤產出「窄四宮 × baseline + Behavior Stage1–3」的 Markdown（供快照測試與文件產生）。
 */
import { normalizeChart } from "../../src/lifebook/normalize/index.js";
import { buildPalaceNarrativeInputsFromChart } from "../../src/lifebook/s17/palaceNarrative/PalaceNarrativeBuilder.js";
import { palaceStructureToPalaceRawInput } from "../../src/lifebook/s17/palaceNarrative/palaceNarrativeTypes.js";
import { renderPalaceNarrativeSample } from "../../src/lifebook/s17/palaceNarrative/palaceNarrativeSampleRenderer.js";
import type { NormalizedChart } from "../../src/lifebook/normalizedChart.js";
import {
  LIFEBOOK_CANONICAL_TEST_CHART_JSON,
  LIFEBOOK_CANONICAL_BEHAVIOR_AXIS_FLAGS_OFF,
  LIFEBOOK_CANONICAL_BEHAVIOR_STAGE1,
  LIFEBOOK_CANONICAL_BEHAVIOR_STAGE2,
  LIFEBOOK_CANONICAL_BEHAVIOR_STAGE3,
  type LifeBookBehaviorAxisConfigSlice,
} from "./lifebookCanonicalTestChart.js";

const NARROW_PALACES = ["命宮", "福德宮", "財帛宮", "夫妻宮"] as const;

function renderNarrowPalacesMarkdown(
  chart: NormalizedChart,
  config: LifeBookBehaviorAxisConfigSlice,
  label: string
): string {
  const inputs = buildPalaceNarrativeInputsFromChart(chart, { config });
  const blocks: string[] = [];
  blocks.push(`### ${label}`, "");
  for (const palaceName of NARROW_PALACES) {
    const pi = chart.palaces.findIndex((p) => p.palace === palaceName);
    if (pi < 0) continue;
    const input = inputs[pi];
    const raw = palaceStructureToPalaceRawInput(chart.palaces[pi]);
    const text = renderPalaceNarrativeSample(input, { raw });
    blocks.push(`#### ${palaceName}`, "", "```");
    blocks.push(text);
    blocks.push("```", "");
  }
  return blocks.join("\n");
}

/** 由已 normalize 的 chart 產出完整 Markdown */
export function buildCanonicalNarrativeMarkdownDoc(chart: NormalizedChart): string {
  const header = [
    `# 共用測試命盤輸出（lifebook-canonical-test-v1）`,
    "",
    `- **chartId**: \`${chart.chartId ?? "?"}\``,
    `- **mingSoulBranch**: \`${chart.mingSoulBranch ?? "?"}\`（預期：子 → relational）`,
    "",
    "---",
    "",
  ].join("\n");
  return [
    header,
    renderNarrowPalacesMarkdown(
      chart,
      { ...LIFEBOOK_CANONICAL_BEHAVIOR_AXIS_FLAGS_OFF },
      "A. Behavior flags 全關（baseline）"
    ),
    "---",
    "",
    renderNarrowPalacesMarkdown(chart, LIFEBOOK_CANONICAL_BEHAVIOR_STAGE1, "B. Stage1 — behaviorAxisV1"),
    "---",
    "",
    renderNarrowPalacesMarkdown(chart, LIFEBOOK_CANONICAL_BEHAVIOR_STAGE2, "C. Stage2 — + behaviorAxisConflictV1"),
    "---",
    "",
    renderNarrowPalacesMarkdown(chart, LIFEBOOK_CANONICAL_BEHAVIOR_STAGE3, "D. Stage3 — + behaviorAxisLoopV1"),
    "",
  ].join("\n");
}

/** 使用預設共用 JSON 正規化後產出 */
export function buildCanonicalNarrativeMarkdownFromFixture(): string {
  return buildCanonicalNarrativeMarkdownDoc(normalizeChart(LIFEBOOK_CANONICAL_TEST_CHART_JSON));
}
