/**
 * 12 宮【星曜結構】諮詢式敘事：主星保留完整段落，輔／煞／雜曜改為逐顆 1～2 句，不再用卡片與 --- 分隔。
 */

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
 * - 否則：baseMeaning + 宮位語境 → 「{base}在你的{context}中會被特別感受到。」（有 palaceContexts 時）或「{base}在這個領域會被感受到。」
 * - 若 isSha：結尾補一句挑戰提醒。
 * 回傳僅為「……」內容，開頭「X在這一宮，代表」由 buildPalaceStarNarrativeBlock 統一加。
 */
export function buildStarNarrativeForPalace(
  star: StarForPalace,
  palaceName: string,
  palaceContexts?: Record<string, string>
): string {
  const name = (star.name ?? "").trim();
  const palace = (palaceName ?? "").trim() || "此宮";
  const inPalace = (star.meaningInPalace ?? "").trim();
  const base = (star.baseMeaning ?? "").trim();
  const isSha = starKind(name) === "sha";

  let body = "";
  if (inPalace) {
    body = firstOneOrTwoSentences(inPalace);
  } else if (base) {
    const context = palaceContexts?.[palace] ?? palaceContexts?.[palace.replace(/宮$/, "")] ?? palaceContexts?.[palace.replace(/宮$/, "") + "宮"];
    body = context
      ? `${base}在你的${context}中會被特別感受到。`
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
  const blocks = [head, base, inPalace ? `【本宮表現】\n${inPalace}` : "", action ? `【行動建議】\n${action}` : ""].filter(Boolean);
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

/**
 * 產出整宮【星曜結構】區塊：主星完整段、輔煞雜逐顆 1～2 句，段落自然銜接，無 ---。
 */
export function buildPalaceStarNarrativeBlock(
  ctx: PalaceContextForStars,
  options?: { getNatalSihua?: (starName: string) => string; palaceContexts?: Record<string, string> }
): string {
  if (!ctx?.stars?.length) return "";
  const getSihua = options?.getNatalSihua ?? (() => "");
  const palaceContexts = options?.palaceContexts;
  const sorted = sortStarsByKind(ctx.stars);
  const palaceName = (ctx.palaceName ?? "").trim() || "此宮";

  const mainStars = sorted.filter((s) => starKind(s.name) === "main");
  const nonMain = sorted.filter((s) => starKind(s.name) !== "main");

  const parts: string[] = [];

  for (const s of mainStars) {
    const block = formatMainStarBlock(s, getSihua(s.name));
    if (block) parts.push(block);
  }

  let leadIndex = 0;
  for (const s of nonMain) {
    const body = buildStarNarrativeForPalace(s, palaceName, palaceContexts);
    if (!body) continue;
    const [lead, suffix] = NON_MAIN_LEADS[leadIndex % NON_MAIN_LEADS.length];
    leadIndex++;
    const sentence = body.endsWith("。") ? body : body + (suffix || "。");
    parts.push(`${s.name}${lead}${sentence}`);
  }

  return parts.join("\n\n");
}
