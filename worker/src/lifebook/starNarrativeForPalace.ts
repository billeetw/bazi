/**
 * 12 宮【星曜結構】諮詢式敘事：主星保留完整段落，輔／煞／雜曜改為逐顆 1～2 句，不再用卡片與 --- 分隔。
 * Phase 3A：語意資料一律經 narrativeFacade 取得，不再直接讀 content / JSON。
 * 命宮試點：s02 【核心特質】改為主星定調 + 亮度敘事 + 本宮表現 + 輔星整合敘事（僅命宮，不影響他宮）。
 */

import {
  createNarrativeFacade,
  type NarrativeContentLookup,
  type NarrativeFacade,
} from "./narrativeFacade.js";

/** 與 PalaceContext.stars 相容的單星資訊 */
export interface StarForPalace {
  name: string;
  strength?: string;
  meaningInPalace?: string;
  baseMeaning?: string;
  actionAdvice?: string;
}

export interface PalaceContextForStars {
  palaceName: string;
  stars: StarForPalace[];
}

const MAIN_STAR_NAMES = new Set<string>([
  "紫微", "天機", "太陽", "武曲", "天同", "廉貞", "天府", "太陰", "貪狼", "巨門", "天相", "天梁", "七殺", "破軍",
]);
const SHA_STAR_NAMES = new Set<string>(["擎羊", "陀羅", "火星", "鈴星", "地空", "地劫"]);
/** 輔星（左輔、右弼、文昌、文曲、祿存、天馬、天魁、天鉞），其餘非主非煞視為雜曜 */
const AUX_STAR_NAMES = new Set<string>(["左輔", "右弼", "文昌", "文曲", "祿存", "天馬", "天魁", "天鉞"]);

function starKind(starName: string): "main" | "aux" | "sha" | "misc" {
  if (MAIN_STAR_NAMES.has(starName)) return "main";
  if (SHA_STAR_NAMES.has(starName)) return "sha";
  if (AUX_STAR_NAMES.has(starName)) return "aux";
  return "misc";
}

/** 取第一句或前兩句（以。！？為界） */
function firstOneOrTwoSentences(text: string): string {
  const t = (text ?? "").trim();
  if (!t) return "";
  const parts = t.split(/(?<=[。！？])\s*/).filter(Boolean);
  if (parts.length <= 2) return t;
  return parts.slice(0, 2).join("");
}

const SHA_CHALLENGE = "煞星在此宮可能帶來壓力或推動，需留意節奏與界線。";

/**
 * 單顆星「內容」句（輔／煞／雜用 1～2 句；主星仍由呼叫方組完整段）。
 * - 若有 meaningInPalace：取其前 1～2 句作為內容。
 * - 否則：baseMeaning + 宮位語境 → 「{base}在你的{context}中會被特別感受到。」（有 contextStr 時）或「{base}在這個領域會被感受到。」
 * - 若 isSha：結尾補一句挑戰提醒。
 * 回傳僅為「……」內容，開頭「X在這一宮，代表」由 buildPalaceStarNarrativeBlock 統一加。
 * @param contextStr 宮位敘事語境（來自 facade.getPalaceSemantic().context），可為 null
 */
export function buildStarNarrativeForPalace(
  star: StarForPalace,
  palaceName: string,
  contextStr?: string | null
): string {
  const name = (star.name ?? "").trim();
  const inPalace = (star.meaningInPalace ?? "").trim();
  const base = (star.baseMeaning ?? "").trim();
  const isSha = starKind(name) === "sha";

  let body = "";
  if (inPalace) {
    body = firstOneOrTwoSentences(inPalace);
  } else if (base) {
    body = contextStr
      ? `${base}在你的${contextStr}中會被特別感受到。`
      : `${base}在這個領域會被感受到。`;
  }
  if (!body) return "";

  if (isSha && !body.includes("壓力") && !body.includes("推動")) {
    body = body + " " + SHA_CHALLENGE;
  }
  return body;
}

/**
 * 主星完整段落：baseMeaning + 本宮表現 + 行動建議（保留原結構，僅不再加 ---）。
 */
function formatMainStarBlock(star: StarForPalace, natalSihua: string): string {
  const head = [star.name, star.strength ? `（${star.strength}）` : "", natalSihua].filter(Boolean).join(" ");
  const base = (star.baseMeaning ?? "").trim();
  const inPalace = (star.meaningInPalace ?? "").trim();
  const action = (star.actionAdvice ?? "").trim();
  const blocks = [head, base, inPalace ? inPalace : "", action ? `【行動建議】\n${action}` : ""].filter(Boolean);
  return blocks.join("\n\n");
}

/**
 * 依 主星→輔星→煞星→雜曜 排序。
 */
function sortStarsByKind(stars: StarForPalace[]): StarForPalace[] {
  const order = (s: StarForPalace) => {
    const k = starKind(s.name);
    return k === "main" ? 0 : k === "aux" ? 1 : k === "sha" ? 2 : 3;
  };
  return [...stars].sort((a, b) => order(a) - order(b));
}

/** 輔星／煞星／雜曜：第一顆「在這一宮，代表」、第二顆「也在這裡，表示」、其餘「在此宮，意味著」 */
const NON_MAIN_LEADS: Array<[string, string]> = [
  ["在這一宮，代表", "。"],
  ["也在這裡，表示", "。"],
  ["在此宮，意味著", "。"],
];

/** 亮度 → 敘事用語（12 宮【核心特質】用）；使用既有 star.strength，不新算。 */
const BRIGHTNESS_NARRATIVE: Record<string, string> = {
  廟: "在此處力量完整",
  旺: "在此處表現順暢",
  得: "在此處能正常發揮",
  利: "在此處能正常發揮",
  平: "在此處影響較為中性",
  陷: "在此處較不穩定",
};

const VALID_STRENGTH = ["廟", "旺", "得", "利", "平", "陷"];

function getBrightnessNarrativePhrase(strength: string | undefined): string {
  if (!strength || !strength.trim()) return "在此處能發揮其特質";
  const key = strength.trim();
  const normalizedStrength = VALID_STRENGTH.includes(key) ? key : "平";
  return BRIGHTNESS_NARRATIVE[normalizedStrength] ?? "在此處影響較為中性";
}

/** 取第一句（以。！？為界）用於亮度敘事結尾 */
function firstSentence(text: string): string {
  const t = (text ?? "").trim();
  if (!t) return "";
  const m = t.match(/^[^。！？]*[。！？]?/);
  return m ? m[0].trim() : t;
}

/** 判斷是否為完整句（以。！？結尾） */
function isCompleteSentence(s: string): boolean {
  const t = (s ?? "").trim();
  return /[。！？]$/.test(t) && t.length > 1;
}

/**
 * 語意橋接：亮度句後半。避免「因此 + 名詞串」懸空。
 * - 若 plain 有完整第一句，優先接「因此{第一句}」。
 * - 若僅有 core 或為名詞短語，包裝成「這使你的{core}特質特別鮮明」。
 */
function brightnessTailFromSemantic(starSem: { plain: string | null; core: string | null }): string {
  const plain = (starSem.plain ?? "").trim();
  const core = (starSem.core ?? "").trim();
  const plainFirst = firstSentence(plain);
  if (plainFirst && isCompleteSentence(plainFirst)) {
    return "因此" + (plainFirst.startsWith("因此") ? plainFirst.slice(2) : plainFirst);
  }
  const nounPhrase = plainFirst || core;
  if (nounPhrase) {
    const normalized = nounPhrase.replace(/[。！？]+$/, "").trim();
    return normalized ? `這使你的${normalized}特質特別鮮明。` : "這使此星在此宮的特質特別鮮明。";
  }
  return "因此此星在此宮的特質會明顯影響你的性格與方向。";
}

/** 無主星時的敘事（12 宮通用）：先說明無主星定調，若有輔星／雜曜則補「主要能量來源」句與差異化表現。 */
function buildNoMainStarBlock(
  facade: NarrativeFacade,
  nonMain: StarForPalace[],
  palaceName: string
): string {
  const lead = "此宮無主星坐守，因此此宮的輪廓不會由單一主星直接定調。";
  const fallbackMingGong = "因此你的個性與人生方向，往往會受到對宮與三方四正的牽動與塑形。";
  const fallbackOther = "因此此宮的表現往往會受到對宮與三方四正星曜的牽動與塑形。";
  const fallback = palaceName === "命宮" ? fallbackMingGong : fallbackOther;
  if (nonMain.length === 0) return lead + fallback;
  const firstStar = nonMain[0];
  const inPalaceBlock = facade.getStarInPalaceSemantic(firstStar.name, palaceName);
  const meaning = (inPalaceBlock.meaningInPalace ?? inPalaceBlock.baseMeaning ?? "").trim();
  const diffNarrative = meaning ? firstOneOrTwoSentences(meaning) : "";
  const energyLine = `但「${firstStar.name}」仍會成為此宮最明顯的能量來源。`;
  const withDiff = diffNarrative ? energyLine + diffNarrative + (diffNarrative.endsWith("。") ? "" : "。") : energyLine;
  return lead + withDiff;
}

/**
 * 12 宮通用：【核心特質】緊湊格式 — **主星（亮度）**、本宮由...定調。{亮度敘事}、【星曜在本宮表現】、輔星整合一段。
 */
function buildPalaceStarNarrativeCompact(
  facade: NarrativeFacade,
  mainStars: StarForPalace[],
  nonMain: StarForPalace[],
  getSihua: (starName: string) => string,
  palaceName: string
): string {
  const parts: string[] = [];
  const palaceLabel = palaceName || "此宮";

  if (mainStars.length === 0) {
    return buildNoMainStarBlock(facade, nonMain, palaceName);
  }

  // 1. 主星標題（緊湊）：**主星名（亮度）**
  for (const s of mainStars) {
    const boldHead = "**" + s.name + (s.strength ? `（${s.strength}）` : "") + "**";
    parts.push(boldHead);
  }

  // 2. 總定調句 + 每顆主星一句亮度敘事（多主星用 \n\n 分隔，不黏在一起）
  const mainNames = mainStars.map((s) => s.name).join("、");
  const joint = mainStars.length > 1 ? "共同" : "";
  parts.push(`本宮由${mainNames}${joint}定調。`);
  for (const s of mainStars) {
    const starSem = facade.getStarSemantic(s.name);
    const brightnessPhrase = getBrightnessNarrativePhrase(s.strength);
    const brightnessTail = brightnessTailFromSemantic(starSem);
    parts.push(`${s.name}${brightnessPhrase}，${brightnessTail}`);
  }

  // 3. 本宮表現區塊（標題【星曜在本宮表現】僅在模板出現一次，此處不重複）
  const inPalaceBlocks: string[] = [];
  for (const s of mainStars) {
    const inPalaceBlock = facade.getStarInPalaceSemantic(s.name, palaceName);
    const meaningInPalace = (inPalaceBlock.meaningInPalace ?? "").trim();
    if (meaningInPalace) {
      inPalaceBlocks.push(`${s.name}在${palaceLabel}的表現為：\n${meaningInPalace}`);
    }
  }
  if (inPalaceBlocks.length > 0) {
    parts.push(inPalaceBlocks.join("\n\n"));
  }

  // 4. 輔星整合敘事（一段）；語料若已含「X在Y宮，」則不再重複前綴
  const assistantStars = nonMain.filter((s) => starKind(s.name) !== "sha");
  if (assistantStars.length > 0) {
    const clauses: string[] = [];
    for (const s of assistantStars) {
      const inPalaceBlock = facade.getStarInPalaceSemantic(s.name, palaceName);
      const meaning = (inPalaceBlock.meaningInPalace ?? inPalaceBlock.baseMeaning ?? "").trim();
      const short = meaning ? firstOneOrTwoSentences(meaning) : "";
      if (short) {
        const prefixOnly = `${s.name}在${palaceLabel}，`;
        const body = short.startsWith(prefixOnly) ? short.slice(prefixOnly.length).trim() : short;
        clauses.push(body ? `${s.name}在${palaceLabel}，${body}` : `${s.name}在${palaceLabel}。`);
      } else {
        const starSem = facade.getStarSemantic(s.name);
        const base = (starSem.plain ?? starSem.core ?? "").trim();
        if (base) clauses.push(`${s.name}在${palaceLabel}，讓此領域受到${base}的影響。`);
      }
    }
    if (clauses.length > 0) {
      const oneParagraph = clauses.join("。").replace(/。+/g, "。").trim();
      parts.push(oneParagraph + (oneParagraph.endsWith("。") ? "" : "。"));
    }
  }

  const hasSha = nonMain.some((s) => starKind(s.name) === "sha");
  if (hasSha) {
    parts.push(SHA_CHALLENGE);
  }

  return parts.join("\n\n");
}

/**
 * 產出整宮【核心特質】區塊（12 宮通用）：緊湊格式 **主星（亮度）**、本宮由...定調。{亮度敘事}、【星曜在本宮表現】、輔星整合一段。
 */
export function buildPalaceStarNarrativeBlock(
  ctx: PalaceContextForStars,
  options?: {
    getNatalSihua?: (starName: string) => string;
    /** 供 facade 查表；未傳時 facade 僅使用 inline 字典與矩陣 */
    content?: NarrativeContentLookup;
  }
): string {
  if (!ctx?.stars?.length) return "";
  const getSihua = options?.getNatalSihua ?? (() => "");
  const facade = createNarrativeFacade(options?.content);
  const sorted = sortStarsByKind(ctx.stars);
  const palaceName = (ctx.palaceName ?? "").trim() || "此宮";

  const mainStars = sorted.filter((s) => starKind(s.name) === "main");
  const nonMain = sorted.filter((s) => starKind(s.name) !== "main");

  return buildPalaceStarNarrativeCompact(facade, mainStars, nonMain, getSihua, palaceName);
}

/** 星曜介紹用：無字典時顯示的預設句 */
const STAR_INTRO_FALLBACK = "此星參與本宮能量。";

/**
 * 產出整宮【星曜介紹】區塊（12 宮通用）：逐一列出本宮星曜，每顆一行標題 + 一句介紹（語意來自 core/plain，非「在本宮表現」）。
 */
export function buildPalaceStarIntroBlock(
  ctx: PalaceContextForStars,
  options?: { content?: NarrativeContentLookup }
): string {
  if (!ctx?.stars?.length) return "";
  const facade = createNarrativeFacade(options?.content);
  const sorted = sortStarsByKind(ctx.stars);
  const blocks: string[] = [];
  for (const star of sorted) {
    const name = (star.name ?? "").trim();
    const strength = (star.strength ?? "").trim();
    const head = "**" + name + (strength ? `（${strength}）` : "") + "**";
    const sem = facade.getStarSemantic(name);
    const raw = (sem.plain ?? sem.core ?? (star.baseMeaning ?? "").trim()) || "";
    const intro = raw || STAR_INTRO_FALLBACK;
    blocks.push(head + "\n" + intro);
  }
  return blocks.join("\n\n");
}
