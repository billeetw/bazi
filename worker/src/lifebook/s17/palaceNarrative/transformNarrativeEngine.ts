/**
 * 逐宮讀者敘事：四化語氣引擎 v1（本命四化未命中 facade 時之模板 fallback）
 * 統一「容易／傾向／比較容易」語氣，結合宮位主題、星曜語義與 starTransformMeanings.json。
 */

import starTransformMeaningsData from "../../../../content/starTransformMeanings.json";
import { getStarSemantic } from "../../starSemanticDictionary.js";

export type TransformDisplayZh = "祿" | "權" | "科" | "忌";

const starTransformMeanings = starTransformMeaningsData as Record<string, { text: string }>;

function toPalaceCanon(p: string): string {
  const s = (p ?? "").trim();
  if (!s) return "";
  return s.endsWith("宮") ? s : `${s}宮`;
}

function toJsonKeyTransform(t: TransformDisplayZh): "lu" | "quan" | "ke" | "ji" {
  const m: Record<TransformDisplayZh, "lu" | "quan" | "ke" | "ji"> = {
    祿: "lu",
    權: "quan",
    科: "ke",
    忌: "ji",
  };
  return m[t];
}

/** 宮位主題（人話短語，用於模板） */
export const PALACE_THEME: Record<string, string> = {
  命宮: "自我定位與人生方向",
  兄弟宮: "同儕、手足與合作",
  夫妻宮: "親密關係與一對一合作",
  子女宮: "創造、延伸成果與產出",
  財帛宮: "金錢、資源與投入回報",
  疾厄宮: "身心負荷與修復",
  遷移宮: "外在環境與移動",
  僕役宮: "團隊、人脈與協作",
  官祿宮: "工作、角色與責任",
  田宅宮: "安全感、根基與生活據點",
  福德宮: "內在狀態與精神能量",
  父母宮: "權威、支持與價值框架",
};

function getPalaceTheme(palace: string): string {
  return PALACE_THEME[toPalaceCanon(palace)] ?? `${toPalaceCanon(palace) || "此宮"}相關主題`;
}

/** 從語義字典取 1～2 個關鍵主題詞，供模板「星曜語義」槽位 */
function starSemanticPhrase(star: string): string {
  const sem = getStarSemantic(star);
  if (!sem) return "與此星相關的議題";
  if (sem.themes.length >= 2) return `${sem.themes[0]}與${sem.themes[1]}`;
  return sem.core.split("、").slice(0, 2).join("與") || sem.core;
}

function getJsonMeaning(star: string, transform: TransformDisplayZh): string | null {
  const key = `${star.trim()}_${toJsonKeyTransform(transform)}`;
  return starTransformMeanings[key]?.text ?? null;
}

/**
 * 將 JSON 長句改寫為較短、偏「傾向／容易」的補充（避免「會發生」）。
 */
function jsonToBiasTail(star: string, transform: TransformDisplayZh): string | null {
  const full = getJsonMeaning(star, transform);
  if (!full) return null;
  let t = full.replace(/^[^，]+，代表/, "").trim();
  t = t
    .replace(/會發生/g, "比較容易出現")
    .replace(/會變成/g, "容易變成")
    .replace(/會帶來/g, "比較容易帶來")
    .replace(/會被/g, "比較容易被");
  if (t.length > 120) {
    const first = t.split("。").filter(Boolean)[0];
    t = first ? `${first}。` : t.slice(0, 100) + "…";
  }
  return t || null;
}

export interface BuildTransformNarrativeOpts {
  star: string;
  transform: TransformDisplayZh;
  palace: string;
}

function takeSentences(parts: string[], max: number): string {
  return parts.filter(Boolean).slice(0, max).join("");
}

/**
 * 產出 1～3 句本命四化敘事（人話、容易／傾向語氣）。
 */
function isMingPalace(palace: string): boolean {
  const p = toPalaceCanon(palace);
  return p === "命宮";
}

/** 命宮：本命四化語氣略加重（人格底色） */
function applyMingGongToneIntensity(text: string): string {
  let t = text;
  t = t.replace(/你比較容易/g, "你更容易");
  t = t.replace(/比較容易/g, "更容易");
  t = t.replace(/比較容易被/g, "更容易被");
  t = t.replace(/比較容易帶來/g, "更容易帶來");
  t = t.replace(/比較容易出現/g, "更容易出現");
  if (!t.startsWith("在人格底色上")) {
    t = `在人格底色上，${t}`;
  }
  return t;
}

export function buildTransformNarrative(opts: BuildTransformNarrativeOpts): string {
  const star = (opts.star ?? "").trim();
  const transform = opts.transform;
  const palaceTheme = getPalaceTheme(opts.palace);
  const starPhrase = starSemanticPhrase(star);
  const tail = jsonToBiasTail(star, transform);
  const ming = isMingPalace(opts.palace);

  const finish = (text: string) => (ming ? applyMingGongToneIntensity(text) : text);

  switch (transform) {
    case "祿": {
      const parts = [
        `在「${palaceTheme}」這一塊，你比較容易感覺到資源、機會或支撐正在靠攏。`,
        `你傾向透過「${starPhrase}」相關的方式，慢慢打開局面或得到回報。`,
        tail ? `具體來說，${tail}` : `這通常不是突然變好，而是你原本某種能力，開始比較容易轉成實際收益。`,
      ];
      return finish(takeSentences(parts, 3));
    }
    case "權": {
      const parts = [
        `在「${palaceTheme}」這一塊，你會更想掌握主導權與節奏。`,
        `很多時候不是外在硬逼你，而是你自己傾向把事情控制好、推進好。`,
        tail ? `具體來說，${tail}` : `關鍵在於：你是主動掌握，還是不知不覺把壓力攬到自己身上。`,
      ];
      return finish(takeSentences(parts, 3));
    }
    case "科": {
      const parts = [
        `在「${palaceTheme}」這一塊，你比較容易找到方法去整理、修正與優化。`,
        `很多事情不需要硬撐，而是傾向透過「${starPhrase}」找到更穩的做法。`,
        tail ? `具體來說，${tail}` : `整體狀態會慢慢變穩，而不是一夕爆發。`,
      ];
      return finish(takeSentences(parts, 3));
    }
    case "忌": {
      const parts = [
        `在「${palaceTheme}」這一塊，容易出現壓力、卡頓或反覆消耗。`,
        `這些壓力多半和「${starPhrase}」有關；你傾向在這裡把得失看得很緊，比較容易反覆琢磨、放不下。`,
        tail ? `具體來說，${tail}` : `很多不舒服不是事情太難，而是你在這裡特別在意、特別放不下。`,
      ];
      return finish(takeSentences(parts, 3));
    }
    default:
      return finish(`在「${palaceTheme}」這一塊，與${star}相關的節奏值得你多留意。`);
  }
}

/** 多條四化時的排序：忌優先，其餘權祿科 */
const TRANSFORM_PRIORITY: TransformDisplayZh[] = ["忌", "權", "祿", "科"];

export function sortTransformsForPalace(
  items: Array<{ transform: TransformDisplayZh; star: string }>
): Array<{ transform: TransformDisplayZh; star: string }> {
  return [...items].sort(
    (a, b) => TRANSFORM_PRIORITY.indexOf(a.transform) - TRANSFORM_PRIORITY.indexOf(b.transform)
  );
}
