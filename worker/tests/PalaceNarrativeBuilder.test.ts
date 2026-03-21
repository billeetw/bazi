/**
 * 逐宮讀者敘事：田宅 pilot、命宮四化篩選、渲染順序
 */
import { describe, expect, it } from "vitest";
import { buildPalaceNarrativeInput } from "../src/lifebook/s17/palaceNarrative/PalaceNarrativeBuilder.js";
import { renderPalaceNarrativeSample } from "../src/lifebook/s17/palaceNarrative/palaceNarrativeSampleRenderer.js";
import type { PalaceRawInput } from "../src/lifebook/s17/palaceNarrative/palaceNarrativeTypes.js";

const FIELD_SAMPLE: PalaceRawInput = {
  palace: "田宅宮",
  mainStars: ["武曲", "天相"],
  minorStars: ["文昌", "台輔"],
  miscStars: ["天馬", "旬空", "截路", "孤辰", "天刑"],
  brightness: {
    武曲: "得",
    天相: "廟",
    文昌: "陷",
  },
  relatedPalaces: ["田宅宮", "兄弟宮", "疾厄宮", "子女宮"],
};

describe("PalaceNarrativeBuilder v1 田宅宮 pilot", () => {
  it("builds non-empty structural summary and lead stars", () => {
    const out = buildPalaceNarrativeInput(FIELD_SAMPLE);
    expect(out.structuralSummary.length).toBeGreaterThan(10);
    expect(out.leadMainStar).toBe("武曲");
    expect(out.coLeadMainStars).toContain("天相");
  });

  it("田宅宮：權重敘事可套用 tianZhaiPalaceProfiles（武曲）", () => {
    const raw: PalaceRawInput = {
      palace: "田宅宮",
      mainStars: ["武曲"],
      minorStars: [],
      miscStars: [],
      brightness: { 武曲: "廟" },
      natalTransforms: {},
    };
    const input = buildPalaceNarrativeInput(raw);
    const text = renderPalaceNarrativeSample(input, { raw });
    expect(input.weightedMode).toBe(true);
    expect(text).toMatch(/買房|不動產|開創/);
  });

  it("builds expected phenomena and decision/pitfall lists", () => {
    const out = buildPalaceNarrativeInput(FIELD_SAMPLE);
    const joined = out.phenomena.join(" ");
    expect(joined).toMatch(/變動|移動|節奏波動|摩擦/);
    expect(joined).toMatch(/空落感|空缺感|不踏實/);
    expect(joined).toMatch(/中斷|繞路|阻斷/);
    expect(joined).toMatch(/獨處/);
    expect(joined).toMatch(/規範|壓力|法務|裝修/);
    expect(out.decisionPatterns.length).toBeGreaterThanOrEqual(2);
    expect(out.pitfalls.length).toBeGreaterThanOrEqual(2);
  });

  it("田宅宮：多顆現象／坑星時先總述一句，避免重複前綴與重複「重大買賣」", () => {
    const out = buildPalaceNarrativeInput(FIELD_SAMPLE);
    expect(out.phenomena[0]).toMatch(/在居住與房產議題上，各星曜的現場感如下/);
    expect(out.phenomena.some((l) => /^實際居住與房產議題上，「/.test(l))).toBe(false);
    const pitfallText = out.pitfalls.join("\n");
    expect((pitfallText.match(/重大買賣宜放慢核對產權與現金流/g) ?? []).length).toBeLessThanOrEqual(1);
  });

  it("疾厄宮：權重多星時「日常運作中…」總述至多一次", () => {
    const raw: PalaceRawInput = {
      palace: "疾厄宮",
      mainStars: ["紫微", "天同"],
      minorStars: ["鈴星", "擎羊"],
      miscStars: ["天刑"],
      brightness: {},
      relatedPalaces: ["命宮"],
    };
    const out = buildPalaceNarrativeInput(raw);
    const ph = out.phenomena.join("\n");
    expect((ph.match(/日常運作中，重點會落在/g) ?? []).length).toBeLessThanOrEqual(1);
  });

  it("兄弟宮：多顆現象／坑星時「日常運作中…」「最常見的坑…」長前綴各至多一次", () => {
    const raw: PalaceRawInput = {
      palace: "兄弟宮",
      mainStars: ["廉貞", "天府"],
      minorStars: [],
      miscStars: ["火星", "陀羅"],
      brightness: {},
      relatedPalaces: ["命宮"],
    };
    const out = buildPalaceNarrativeInput(raw);
    expect(out.weightedMode).toBe(true);
    const ph = out.phenomena.join("\n");
    const pit = out.pitfalls.join("\n");
    expect((pit.match(/最常見的坑，是「責任與金錢界線不清，合作破局風險」/g) ?? []).length).toBeLessThanOrEqual(
      1
    );
    /* 多星時：總述一句 + 星別短句，「日常運作中…」長前綴只出現一次 */
    expect((ph.match(/日常運作中，重點會落在/g) ?? []).length).toBe(1);
    expect(out.phenomena.length).toBeGreaterThan(2);
  });

  it("兄弟宮：火星／陀羅若在輔星欄仍應合併為總述 + 短句（與盤面分類誤置相容）", () => {
    const raw: PalaceRawInput = {
      palace: "兄弟宮",
      mainStars: ["廉貞", "天府"],
      minorStars: ["火星", "陀羅"],
      miscStars: [],
      brightness: {},
    };
    const out = buildPalaceNarrativeInput(raw);
    expect(out.weightedMode).toBe(true);
    const ph = out.phenomena.join("\n");
    expect((ph.match(/日常運作中，重點會落在/g) ?? []).length).toBe(1);
  });

  it("filters natal transforms to stars that sit in the palace (ming + global mutagen)", () => {
    const noneInPalace: PalaceRawInput = {
      palace: "命宮",
      mainStars: ["武曲", "天相"],
      minorStars: [],
      miscStars: [],
      brightness: {},
      natalTransforms: { 祿: "天機", 權: "太陽", 科: "文曲", 忌: "廉貞" },
    };
    const outNone = buildPalaceNarrativeInput(noneInPalace);
    expect(outNone.natalTransformItems?.length ?? 0).toBe(0);

    const oneInPalace: PalaceRawInput = {
      palace: "命宮",
      mainStars: ["武曲", "天相"],
      minorStars: [],
      miscStars: [],
      natalTransforms: { 祿: "武曲", 權: "天機" },
    };
    const outOne = buildPalaceNarrativeInput(oneInPalace);
    expect(outOne.natalTransformItems?.length).toBe(1);
    expect(outOne.natalTransformItems?.[0].label).toMatch(/武曲/);
  });

  it("renders complete readable section instead of JSON dump", () => {
    const out = buildPalaceNarrativeInput(FIELD_SAMPLE);
    expect(out.readerPremium).toBeDefined();
    const text = renderPalaceNarrativeSample(out, { raw: FIELD_SAMPLE });
    expect(text).toContain("生活根基與安全基地（田宅宮）");
    expect(text).toContain("【斷語】");
    expect(text).toContain("🔹 其他星曜");
    expect(text).not.toContain("🔹 輔助星");
    expect(text).toContain("【這一宮的核心結構】");
    expect(text).toContain("【你會怎麼做決策】");
    expect(text).toContain("【這一宮的真實運作】");
    expect(text).toContain("【最容易踩的坑】");
    expect(text).toContain("【相關牽動】");
    expect(text).toContain("這一宮會和兄弟宮、疾厄宮、子女宮互相牽動。");
    expect(text.trim().startsWith("{")).toBe(false);
  });

  it("命宮：含斷語、提問、鏡像、力量收尾（premium 層）", () => {
    const raw: PalaceRawInput = {
      palace: "命宮",
      mainStars: ["天梁"],
      minorStars: [],
      miscStars: [],
      brightness: { 天梁: "廟" },
      natalTransforms: { 忌: "天梁" },
    };
    const input = buildPalaceNarrativeInput(raw);
    const text = renderPalaceNarrativeSample(input, { raw });
    expect(input.mingNarrativePremium).toBeDefined();
    expect(text).toContain("【斷語】");
    expect(text).toContain("【想先問你】");
    expect(text).toContain("【鏡像】");
    expect(text).toContain("【轉個念，力就出來】");
    expect(text).toMatch(/撐住|扛|界線/);
  });

  it("命宮：readerNarrativeIntensity=soft 使用較柔斷語档", () => {
    const raw: PalaceRawInput = {
      palace: "命宮",
      mainStars: ["天梁"],
      minorStars: [],
      miscStars: [],
      brightness: {},
      natalTransforms: { 忌: "天梁" },
      readerNarrativeIntensity: "soft",
    };
    const input = buildPalaceNarrativeInput(raw);
    expect(input.mingNarrativePremium?.headlines.soft).toContain("多半");
    expect(input.mingNarrativePremium?.provocativeQuestions.length).toBeGreaterThan(0);
  });

  it("ming palace: star structure block comes before compact intro when raw is passed", () => {
    const raw: PalaceRawInput = {
      palace: "命宮",
      mainStars: ["武曲", "天相"],
      minorStars: ["文昌"],
      miscStars: ["天馬"],
      brightness: { 武曲: "得", 天相: "廟", 文昌: "陷" },
      natalTransforms: { 祿: "天機" },
    };
    const input = buildPalaceNarrativeInput(raw);
    const text = renderPalaceNarrativeSample(input, { raw });
    const idxDuan = text.indexOf("【斷語】");
    const idxMirror = text.indexOf("【鏡像】");
    const idxStar = text.indexOf("【星曜結構解析】");
    const idxCore = text.indexOf("【這一宮的核心結構】");
    expect(idxDuan).toBeGreaterThanOrEqual(0);
    expect(idxMirror).toBeGreaterThan(idxDuan);
    expect(idxStar).toBeGreaterThan(idxMirror);
    expect(idxCore).toBeGreaterThan(idxStar);
    expect(text).not.toContain("🔹 本命四化");
  });

  it("single main star uses single closing, not 兩顆主星", () => {
    const raw: PalaceRawInput = {
      palace: "命宮",
      mainStars: ["太陰"],
      minorStars: [],
      miscStars: [],
      brightness: { 太陰: "廟" },
      natalTransforms: {},
    };
    const input = buildPalaceNarrativeInput(raw);
    const text = renderPalaceNarrativeSample(input, { raw });
    expect(text).toContain("這顆主星形塑了你");
    expect(text).not.toContain("這兩顆主星形塑了你");
    expect(text).toContain("太陰（廟）");
    expect(text).toContain("因為亮度為「廟」");
  });

  it("命宮：核心結構不重複貼兩次人格首句；決策不重複定調句", () => {
    const raw: PalaceRawInput = {
      palace: "命宮",
      mainStars: ["太陰"],
      minorStars: [],
      miscStars: [],
      brightness: { 太陰: "廟" },
      natalTransforms: {},
    };
    const input = buildPalaceNarrativeInput(raw);
    expect(input.weightedMode).toBe(true);
    const text = renderPalaceNarrativeSample(input, { raw });
    const core = "你的人格是外柔內剛，重內在感受、家庭感與細節品質。";
    expect((text.match(new RegExp(core.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []).length).toBeLessThanOrEqual(
      1
    );
    const dec = "你會先確認心理安全與情緒可承接，再決定是否加碼投入。";
    expect((text.match(new RegExp(dec.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g")) ?? []).length).toBeLessThanOrEqual(
      1
    );
  });

  it("命宮：主星命宮語料已接入（以天機為例）", () => {
    const raw: PalaceRawInput = {
      palace: "命宮",
      mainStars: ["天機"],
      minorStars: [],
      miscStars: [],
      brightness: { 天機: "得" },
      natalTransforms: {},
    };
    const input = buildPalaceNarrativeInput(raw);
    const text = renderPalaceNarrativeSample(input, { raw });
    expect(text).toContain("高敏銳思考與策略反應");
    expect(text).toContain("想法很多、表達很快");
    expect(text).toContain("過度思考會稀釋行動力");
  });

  it("ignores natalTransformsIn; only benming mutagen map counts for 本命四化", () => {
    const raw: PalaceRawInput = {
      palace: "命宮",
      mainStars: ["太陰"],
      minorStars: [],
      miscStars: [],
      natalTransforms: {},
      natalTransformsIn: [
        { fromPalace: "兄弟宮", toPalace: "命宮", transform: "祿", layer: "natal", starName: "太陰" },
      ] as PalaceRawInput["natalTransformsIn"],
    };
    const input = buildPalaceNarrativeInput(raw);
    expect(input.natalTransformItems?.length ?? 0).toBe(0);
  });

  it("財帛宮：接入權重驅動後，無主星可由地劫等星拉動後段敘事", () => {
    const raw: PalaceRawInput = {
      palace: "財帛宮",
      mainStars: [],
      minorStars: [],
      miscStars: ["地劫", "三台", "八座"],
      brightness: { 地劫: "廟" },
      natalTransforms: {},
    };
    const input = buildPalaceNarrativeInput(raw);
    const text = renderPalaceNarrativeSample(input, { raw });
    expect(text).toContain("你的核心主軸是");
    expect(text).toContain("地劫");
    expect(text).toContain("現金流");
    expect(text).toContain("地劫、三台");
    expect(text).toMatch(/理十次賠八次|短炒|財庫/);
    expect(text).not.toContain("你傾向用可持續的方式安排生活與責任");
    expect(text).not.toContain("你希望生活是能被整理、被長期維持的。");
    expect(input.weightedMode).toBe(true);
  });

  it("財帛宮：主星命中 wealthPalaceProfiles（紫微）", () => {
    const raw: PalaceRawInput = {
      palace: "財帛宮",
      mainStars: ["紫微"],
      minorStars: [],
      miscStars: [],
      brightness: { 紫微: "廟" },
      natalTransforms: {},
    };
    const input = buildPalaceNarrativeInput(raw);
    const text = renderPalaceNarrativeSample(input, { raw });
    expect(input.weightedMode).toBe(true);
    expect(text).toMatch(/記帳|隨性|花完/);
  });

  it("無主星：非財帛宮也可用輔／雜權重拉動分段（疾厄宮＋地劫）", () => {
    const raw: PalaceRawInput = {
      palace: "疾厄宮",
      mainStars: [],
      minorStars: [],
      miscStars: ["地劫"],
      brightness: { 地劫: "廟" },
      natalTransforms: {},
    };
    const input = buildPalaceNarrativeInput(raw);
    const text = renderPalaceNarrativeSample(input, { raw });
    expect(input.weightedMode).toBe(true);
    expect(text).toContain("你的核心主軸是");
    expect(text).toContain("身心壓力");
    expect(text).toContain("地劫");
    expect(text).not.toContain("地劫被引動時");
    expect(text).not.toContain("你傾向用可持續的方式安排生活與責任");
  });

  it("12宮權重入口：非財帛宮命中權重時也可覆寫後段敘事（以官祿宮文昌示例）", () => {
    const raw: PalaceRawInput = {
      palace: "官祿宮",
      mainStars: [],
      minorStars: ["文昌"],
      miscStars: [],
      brightness: { 文昌: "廟" },
      natalTransforms: {},
    };
    const input = buildPalaceNarrativeInput(raw);
    const text = renderPalaceNarrativeSample(input, { raw });
    expect(text).toContain("你的核心主軸是");
    expect(text).not.toContain("官祿宮這一塊");
    expect(text).toContain("專業、法務、制度工作");
    expect(text).toContain("過度理論");
    expect(text).toContain("太死板會失去機會");
  });

  it("財帛宮：batch-1 premium（斷語→鏡像→星曜→核心）且 readerPremium 有值", () => {
    const raw: PalaceRawInput = {
      palace: "財帛宮",
      mainStars: ["武曲"],
      minorStars: [],
      miscStars: [],
      brightness: { 武曲: "廟" },
      natalTransforms: {},
    };
    const input = buildPalaceNarrativeInput(raw);
    const text = renderPalaceNarrativeSample(input, { raw });
    expect(input.readerPremium).toBeDefined();
    expect(input.readerPremium?.headlines.standard.length).toBeGreaterThan(5);
    const idxDuan = text.indexOf("【斷語】");
    const idxMirror = text.indexOf("【鏡像】");
    const idxStar = text.indexOf("【星曜結構解析】");
    const idxCore = text.indexOf("【這一宮的核心結構】");
    expect(idxDuan).toBeGreaterThanOrEqual(0);
    expect(idxMirror).toBeGreaterThan(idxDuan);
    expect(idxStar).toBeGreaterThan(idxMirror);
    expect(idxCore).toBeGreaterThan(idxStar);
    expect(text).toContain("【轉個念，力就出來】");
  });

  it("官祿宮：batch-1 premium 順序與轉念層", () => {
    const raw: PalaceRawInput = {
      palace: "官祿宮",
      mainStars: ["天機"],
      minorStars: [],
      miscStars: [],
      brightness: { 天機: "廟" },
      natalTransforms: {},
    };
    const input = buildPalaceNarrativeInput(raw);
    const text = renderPalaceNarrativeSample(input, { raw });
    expect(input.readerPremium).toBeDefined();
    const idxDuan = text.indexOf("【斷語】");
    const idxMirror = text.indexOf("【鏡像】");
    const idxStar = text.indexOf("【星曜結構解析】");
    const idxCore = text.indexOf("【這一宮的核心結構】");
    expect(idxMirror).toBeGreaterThan(idxDuan);
    expect(idxStar).toBeGreaterThan(idxMirror);
    expect(idxCore).toBeGreaterThan(idxStar);
    expect(text).toContain("【轉個念，力就出來】");
  });

  it("兄弟宮：batch-2 schema premium 順序（斷語→鏡像→星曜→核心）", () => {
    const raw: PalaceRawInput = {
      palace: "兄弟宮",
      mainStars: ["天同"],
      minorStars: [],
      miscStars: [],
      brightness: { 天同: "廟" },
      natalTransforms: {},
    };
    const input = buildPalaceNarrativeInput(raw);
    const text = renderPalaceNarrativeSample(input, { raw });
    expect(input.readerPremium).toBeDefined();
    const idxDuan = text.indexOf("【斷語】");
    const idxMirror = text.indexOf("【鏡像】");
    const idxStar = text.indexOf("【星曜結構解析】");
    const idxCore = text.indexOf("【這一宮的核心結構】");
    expect(idxMirror).toBeGreaterThan(idxDuan);
    expect(idxStar).toBeGreaterThan(idxMirror);
    expect(idxCore).toBeGreaterThan(idxStar);
    expect(text).toContain("【轉個念，力就出來】");
  });

  it("福德宮：天同＋巨門專屬語料、無深讀前綴／無決策星曜前綴／無問句主題尾註", () => {
    const raw: PalaceRawInput = {
      palace: "福德宮",
      mainStars: ["天同", "巨門"],
      minorStars: [],
      miscStars: ["天空"],
      brightness: {},
      natalTransforms: {},
    };
    const input = buildPalaceNarrativeInput(raw);
    const text = renderPalaceNarrativeSample(input, { raw });
    expect(input.readerPremium?.bodyOverrides?.phenomenonLines?.length).toBeGreaterThan(0);
    expect(text).toContain("你不是不知道現實，只是不想破壞那個穩定感");
    expect(text).toContain("不要讓氣氛變差");
    expect(text).toContain("恢復過來");
    expect(text).toMatch(/腦中反覆整理|腦袋沒有/);
    expect(text).not.toMatch(/深讀\(/);
    expect(text).not.toContain("（定調主星｜");
    expect(text).not.toContain("（主題：");
  });

  it("夫妻宮：batch-1 premium 順序", () => {
    const raw: PalaceRawInput = {
      palace: "夫妻宮",
      mainStars: ["天同"],
      minorStars: [],
      miscStars: [],
      brightness: { 天同: "廟" },
      natalTransforms: {},
    };
    const input = buildPalaceNarrativeInput(raw);
    const text = renderPalaceNarrativeSample(input, { raw });
    expect(input.readerPremium).toBeDefined();
    const idxDuan = text.indexOf("【斷語】");
    const idxMirror = text.indexOf("【鏡像】");
    const idxStar = text.indexOf("【星曜結構解析】");
    const idxCore = text.indexOf("【這一宮的核心結構】");
    expect(idxMirror).toBeGreaterThan(idxDuan);
    expect(idxStar).toBeGreaterThan(idxMirror);
    expect(idxCore).toBeGreaterThan(idxStar);
  });

  it("官祿宮主星（太陽、天梁）命中權重後應使用 careerProfiles，而非套版收尾句", () => {
    const raw: PalaceRawInput = {
      palace: "官祿宮",
      mainStars: ["太陽", "天梁"],
      minorStars: ["天魁"],
      miscStars: ["地空", "紅鸞"],
      brightness: { 太陽: "廟", 天梁: "廟", 天魁: "廟", 地空: "平" },
      natalTransforms: {},
    };
    const input = buildPalaceNarrativeInput(raw);
    const text = renderPalaceNarrativeSample(input, { raw });
    expect(input.weightedMode).toBe(true);
    expect(text).toContain("公眾角色、管理、服務型領導");
    expect(text).toContain("過度付出不計回報");
    expect(text).toContain("顧問、醫療、教育、監督角色");
    expect(text).not.toMatch(/推向「公眾角色、管理、服務型領導」/);
    expect(text).not.toContain("在官祿宮的決策層面");
    expect(text).not.toContain("風險警報：");
    expect(text).not.toContain("禁忌決策是：");
    expect(text).not.toContain("你傾向用可持續的方式安排生活與責任");
  });
});
