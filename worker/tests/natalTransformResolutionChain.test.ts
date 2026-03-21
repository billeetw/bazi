/**
 * 示範：星×宮×四化 → 四化×宮 → 模板 的解析鏈，與逐宮讀者敘事之本命四化輸出對齊。
 */
import { describe, expect, it } from "vitest";
import { getTransformSemantic } from "../src/lifebook/narrativeFacade.js";
import { buildPalaceNarrativeInput } from "../src/lifebook/s17/palaceNarrative/PalaceNarrativeBuilder.js";
import { renderPalaceNarrativeSample } from "../src/lifebook/s17/palaceNarrative/palaceNarrativeSampleRenderer.js";
import type { PalaceRawInput } from "../src/lifebook/s17/palaceNarrative/palaceNarrativeTypes.js";

describe("四化語意解析鏈（示範給 product／文案）", () => {
  it("① 星×宮×四化命中 STAR_PALACE_TRANSFORM_MATRIX（武曲＋財帛＋祿）", () => {
    const block = getTransformSemantic("祿", "武曲", "財帛宮");
    expect(block.meaning).toBeTruthy();
    expect(block.meaning!).toMatch(/資源|收入|紀律|累積/);
    expect(block.meta.primary.source).toBe("STAR_PALACE_TRANSFORM_MATRIX");
  });

  it("② 無專屬矩陣列時，退階為四化×宮位（紫微＋田宅＋權）", () => {
    const block = getTransformSemantic("權", "紫微", "田宅宮");
    expect(block.meaning).toBeTruthy();
    expect(block.meaning!).toMatch(/名下|作主|房產/);
    expect(block.meta.primary.source).toBe("transformIntoPalaceMeanings");
  });

  it("③ 星×宮無矩陣列時，仍可依四化×宮（例：天同化祿入疾厄）", () => {
    const block = getTransformSemantic("祿", "天同", "疾厄宮");
    expect(block.meaning).toBeTruthy();
    expect(block.meaning!).toMatch(/修復|恢復|身心/);
    expect(block.meta.primary.source).toBe("transformIntoPalaceMeanings");
  });

  it("④ 逐宮讀者敘事輸出：本命四化區塊使用與 facade 同源敘事（財帛武曲化祿）", () => {
    const raw: PalaceRawInput = {
      palace: "財帛宮",
      mainStars: ["武曲"],
      minorStars: [],
      miscStars: [],
      brightness: { 武曲: "廟" },
      natalTransforms: { 祿: "武曲" },
    };
    const input = buildPalaceNarrativeInput(raw);
    const item = input.natalTransformItems?.find((x) => x.label.includes("武曲"));
    expect(item).toBeTruthy();
    expect(item!.narrative).toMatch(/資源|收入|紀律|累積/);

    const text = renderPalaceNarrativeSample(input, { raw });
    expect(text).toContain("武曲化祿");
    expect(text).toMatch(/資源|收入|紀律|累積/);
  });

  it("⑤ 逐宮讀者敘事輸出：田宅紫微化權用退階「權入田宅」長句（與②同源）", () => {
    const raw: PalaceRawInput = {
      palace: "田宅宮",
      mainStars: ["紫微"],
      minorStars: [],
      miscStars: [],
      brightness: { 紫微: "廟" },
      natalTransforms: { 權: "紫微" },
    };
    const input = buildPalaceNarrativeInput(raw);
    const item = input.natalTransformItems?.[0];
    expect(item?.label).toMatch(/紫微化權/);
    expect(item?.narrative).toMatch(/名下|作主|房產/);

    const text = renderPalaceNarrativeSample(input, { raw });
    expect(text).toContain("紫微化權");
    expect(text).toMatch(/名下|作主|房產/);
  });
});
