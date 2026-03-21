/**
 * 手動預覽：npx vitest run tests/readerNarrativeSimPreview.test.ts
 * 模擬命宮天梁化忌 + 輔星煞星，輸出完整 renderPalaceNarrativeSample。
 */
import { describe, expect, it } from "vitest";
import { buildPalaceNarrativeInput } from "../src/lifebook/s17/palaceNarrative/PalaceNarrativeBuilder.js";
import { renderPalaceNarrativeSample } from "../src/lifebook/s17/palaceNarrative/palaceNarrativeSampleRenderer.js";
import type { PalaceRawInput } from "../src/lifebook/s17/palaceNarrative/palaceNarrativeTypes.js";

const SIM_MING: PalaceRawInput = {
  palace: "命宮",
  mainStars: ["天梁"],
  minorStars: ["文昌", "左輔"],
  miscStars: ["陀羅", "火星"],
  brightness: {
    天梁: "廟",
    文昌: "陷",
    左輔: "利",
    陀羅: "陷",
    火星: "利",
  },
  natalTransforms: { 祿: "天機", 權: "太陽", 科: "文曲", 忌: "天梁" },
  readerNarrativeIntensity: "standard",
  relatedPalacesNote: "命宮與財帛宮、官祿宮、遷移宮三方四正互相拉動，外面怎麼動，你這裡就怎麼有感。",
};

/** 兄弟宮：示範非命宮加長星曜說明 */
const SIM_XIONGDI: PalaceRawInput = {
  palace: "兄弟宮",
  mainStars: ["廉貞", "天府"],
  minorStars: [],
  miscStars: ["火星", "陀羅"],
  brightness: {},
  relatedPalaces: ["命宮", "僕役宮"],
};

describe("reader narrative sim preview (console)", () => {
  it("prints ming + xiongdi sample", () => {
    const mingInput = buildPalaceNarrativeInput(SIM_MING);
    const mingText = renderPalaceNarrativeSample(mingInput, { raw: SIM_MING });

    const xdInput = buildPalaceNarrativeInput(SIM_XIONGDI);
    const xdText = renderPalaceNarrativeSample(xdInput, { raw: SIM_XIONGDI });

    const out = [
      "========== 模擬盤 A｜命宮（天梁化忌 + 昌輔 + 火陀）==========",
      "",
      mingText,
      "",
      "========== 模擬盤 B｜兄弟宮（廉府 + 火陀）==========",
      "",
      xdText,
      "",
    ].join("\n");

    console.log(out);
    expect(mingText).toContain("【斷語】");
    expect(xdText).toContain("【這一宮的核心結構】");
  });
});
