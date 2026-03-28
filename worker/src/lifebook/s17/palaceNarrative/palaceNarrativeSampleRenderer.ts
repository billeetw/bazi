/**
 * 逐宮讀者敘事：將 PalaceNarrativeInput + PalaceRawInput 組成讀者向全文（含【星曜結構解析】）。
 * 與命書章節 s17「疊宮分析」不同；疊宮見 palaceOverlay.ts。
 */
import { getPalaceSemantic, getStarSemantic } from "../../starSemanticDictionary.js";
import type {
  MingNarrativePremiumPayload,
  PalaceNarrativeInput,
  PalaceNatalTransformItem,
  PalaceRawInput,
  ReaderNarrativeIntensity,
} from "./palaceNarrativeTypes.js";
import { getPalaceNarrativeCopy } from "./palaceNarrativeCopy.js";
import { getMiscPhenomenaShortMap, MING_GONG_PHENOMENA_FALLBACKS } from "./palaceMiscPhenomena.js";
import { getMingProfile } from "./mingProfiles.js";
import { normalizeNarrativePunctuation, stripMarkdownEmphasis } from "./narrativePunctuation.js";
import { getWealthProfile } from "./wealthPalaceProfiles.js";
import { getCareerProfile } from "./careerProfiles.js";
import { getTianZhaiProfile } from "./tianZhaiPalaceProfiles.js";
import { formatCareerForbiddenHuman, formatCareerPhenomenonHuman } from "./segmentHumanTone.js";
import { PALACE_SEGMENT_SCHEMA } from "./weightedPalaceSchemas.js";

import starPalacesMainZhTw from "../../../../content/starPalacesMain-zh-TW.json";
import { getMingDualMainStarNarrativeText } from "./mingDualMainStarNarrative.js";

type BrightnessKey = "廟" | "旺" | "得" | "利" | "平" | "陷";

/** 主星：接在「代表…」之後，因亮度而補一句（無亮度則不輸出） */
const MAIN_BRIGHTNESS_BECAUSE: Record<BrightnessKey, string> = {
  廟: "因為亮度為「廟」，這份特質通常表現得更自然、完整，也較容易成為你可倚重的穩定能力。",
  旺: "因為亮度為「旺」，這份特質更有存在感，也較容易被看見與運用。",
  得: "因為亮度為「得」，這份特質多半能穩定發揮，但仍需情境配合。",
  利: "因為亮度為「利」，這份特質能發揮，但較依情境與節奏。",
  平: "因為亮度為「平」，優勢與挑戰都較仰賴後天整合。",
  陷: "因為亮度為「陷」，這份特質在此較受壓或需反覆整合，優勢往往要靠節奏與經驗磨出來。",
};

/** 主星＋亮度：可覆寫預設句（例：太陰＋廟） */
const STAR_BRIGHTNESS_BECAUSE_OVERRIDE: Partial<Record<string, Partial<Record<BrightnessKey, string>>>> = {
  太陰: {
    廟: "因為亮度為「廟」，這種感受力與內在觀察通常表現得更自然、更穩，也更容易成為你可靠的內在能力。",
  },
};

/** 輔星／雜曜亮度補充（星曜結構解析用） */
const AUX_BRIGHTNESS_PHRASE: Record<BrightnessKey, string> = {
  廟: "在此宮修飾力強，容易成為別人對你的鲜明印象。",
  旺: "在此宮存在感明顯，會明顯調味主星。",
  得: "在此宮能穩定發揮修飾作用。",
  利: "在此宮能發揮修飾作用，較依情境配合。",
  平: "在此宮屬於細膩調味，優缺點要靠整合。",
  陷: "容易在小地方過度糾結，或想太多反而卡住。",
};

/** 輔星短說明（無語義字典時後備） */
const MINOR_STAR_LINE: Record<string, string> = {
  文昌: "代表邏輯、規劃與細節。",
  文曲: "代表表達、才藝與感性路徑。",
  左輔: "代表助力、協作與貴人緣的加分。",
  右弼: "代表暗助、默契與柔性支援。",
  天魁: "代表明面貴人、機會被看見。",
  天鉞: "代表暗貴人、關鍵時有人拉一把。",
  祿存: "代表守成、累積與對資源的敏感度。",
  天馬: "代表變動、奔波與外在節奏。",
  台輔: "代表體面、質感與被看見的價值。你會在意生活環境是否有一定水準與呈現。",
  封誥: "代表名分、認可與被正式看見的期待。",
  龍池: "代表才藝、品味與細膩呈現的直覺。",
  鳳閣: "代表門面、質感與外在呈現的自我要求。",
  紅鸞: "代表緣分訊號與關係氛圍的敏感度。",
  天喜: "代表喜氣、場合與心情起伏的連動。",
  華蓋: "代表獨思、美學與需要一點與眾不同的空間。",
  三台: "代表階梯式成長與地位累積的傾向。",
  八座: "代表名望與社會形象的加乘。",
  冠帶: "代表成長期、展現欲與想站穩位置的張力。",
  病符: "代表小耗、反覆狀態對身心與判斷的干擾，宜保守。",
  寡宿: "代表獨處需求與親密邊界，合作要劃清節奏。",
  劫殺: "代表突發損失與資源被截斷的風險，宜分散備援。",
  天空: "代表理想化與執行空隙，需設停損與驗收。",
  旬中: "代表時機縫隙與節點之間的佈局感。",
  空亡: "代表落空感或補不滿，要靠里程碑拉回踏實。",
  天官: "代表制度、職稱與儀式感，宜走正規承認的路。",
  天福: "代表福氣與僥倖成分，仍須主動接機會。",
  蜚廉: "代表口舌是非與名聲波動，曝光要收斂。",
  天傷: "代表委屈與受傷敏感，宜先止血再決策。",
  天使: "代表收尾、傳遞與照護類課題。",
  天廚: "代表飲食、品味與生活享受及相關花費。",
  龍德: "代表低潮時的轉圜與信用紅利。",
  年解: "代表年度清理、和解與解套。",
  截空: "代表銜接處踩空，承諾宜分段驗收。",
};

/** 其他星曜：僅字典／句庫有資料才回傳，禁止泛用補句 */
function otherStarSemanticCore(star: string): string | null {
  const sem = getStarSemantic(star);
  if (sem?.core) return `代表${sem.core}。`;
  const fb = MINOR_STAR_LINE[star];
  if (fb) return fb.endsWith("。") ? fb : `${fb}。`;
  return null;
}

function normalizeB(b: "廟" | "旺" | "得" | "平" | "陷" | undefined): BrightnessKey | undefined {
  if (b === "得") return "得";
  return b;
}

const STAR_PALACES_MAIN = (starPalacesMainZhTw as { starPalacesMain?: Record<string, string> }).starPalacesMain ?? {};

/** 本宮星曜總數不多時，從 starPalacesMain 抽一段加長主星說明（避免版面過瘦） */
function isSparsePalaceForCorpus(raw: PalaceRawInput): boolean {
  const n = raw.mainStars.length + raw.minorStars.length + raw.miscStars.length;
  return n <= 6;
}

const IMPORTANT_AUX: ReadonlySet<string> = new Set([
  "左輔",
  "右弼",
  "文昌",
  "文曲",
  "天魁",
  "天鉞",
  "祿存",
  "天馬",
]);

const SHA_STARS: ReadonlySet<string> = new Set(["擎羊", "陀羅", "火星", "鈴星", "地空", "地劫", "天刑"]);

function stripTrailingPeriodInner(s: string): string {
  return (s ?? "").trim().replace(/[。．.]+$/u, "").trim();
}

function hashPick(seed: string, modulo: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % modulo;
}

/** 主星：一組人話共鳴句（非套版機械拼接，靠語義＋宮位主題＋輕微句式輪替） */
function resonanceParagraphMain(star: string, palaceCanon: string, palaceLabel: string): string | null {
  const sem = getStarSemantic(star);
  const pal = getPalaceSemantic(palaceCanon);
  const plain = stripTrailingPeriodInner(sem?.plain ?? "");
  const risk = stripTrailingPeriodInner(sem?.risk ?? "");
  const theme = (pal?.short ?? pal?.core ?? "").trim();
  if (!plain && !risk) return null;
  const k = hashPick(`${star}_${palaceCanon}_m`, 3);
  if (theme && risk && plain) {
    if (k === 0) {
      return normalizeNarrativePunctuation(
        `在「${palaceLabel}」與「${theme}」交會的地方，${plain}常常兌現成具體摩擦：${risk}。`


      );
    }
    if (k === 1) {
      return normalizeNarrativePunctuation(
        `外人看到的是你的風格，你自己更清楚反覆上場的是：${risk}；而你的起點往往來自${plain.slice(0, Math.min(plain.length, 40))}${plain.length > 40 ? "…" : ""}。`
      );
    }
  }
  if (risk) {
    return normalizeNarrativePunctuation(`在${palaceLabel}，這顆主星最常把你拖進去的節奏是：${risk}。`);
  }
  return normalizeNarrativePunctuation(`${plain}。`);
}

/** 輔星／煞／雜曜：語料或語義補一段，避免只剩一句「代表…」 */
function appendStarDeepLine(star: string, raw: PalaceRawInput, palaceLabel: string, lines: string[]): void {
  const corpus = palaceCorpusLookup(star, raw.palace)?.trim() ?? "";
  if (corpus.length >= 48) {
    lines.push(normalizeNarrativePunctuation(`脈絡補述：${clipCorpusParagraph(corpus, 180)}`), "");
    return;
  }
  const sem = getStarSemantic(star);
  const risk = stripTrailingPeriodInner(sem?.risk ?? "");
  const plain = stripTrailingPeriodInner(sem?.plain ?? "");
  if (SHA_STARS.has(star) && risk) {
    lines.push(normalizeNarrativePunctuation(`在${palaceLabel}，這顆星的力度常表現在：${risk}。`), "");
    return;
  }
  if (IMPORTANT_AUX.has(star)) {
    if (plain && risk) {
      lines.push(
        normalizeNarrativePunctuation(`放在${palaceLabel}，${plain}容易被放大成：${risk}。`),
        ""
      );
    } else if (risk) {
      lines.push(normalizeNarrativePunctuation(`在此宮，這顆星要你多留意的內在拉扯：${risk}。`), "");
    }
  }
}

function palaceCorpusLookup(star: string, palaceCanon: string): string | undefined {
  const p = (palaceCanon ?? "").trim();
  if (!p || !star) return undefined;
  const noGong = p.replace(/宮$/, "");
  return STAR_PALACES_MAIN[`${star}_${p}`] ?? STAR_PALACES_MAIN[`${star}_${noGong}`];
}

/** 保留完整句讀，不超過約 maxLen 字 */
function clipCorpusParagraph(text: string, maxLen: number): string {
  const t = normalizeNarrativePunctuation(text);
  if (t.length <= maxLen) return t;
  const cut = t.slice(0, maxLen);
  const punct = ["。", "；", "．"];
  let best = -1;
  for (const q of punct) {
    const i = cut.lastIndexOf(q);
    if (i > maxLen * 0.45) best = Math.max(best, i);
  }
  if (best >= 0) return cut.slice(0, best + 1).trim();
  return `${cut.trim()}…`;
}

function at(items: string[], idx: number, fallback: string): string {
  return items[idx] ?? fallback;
}

/** 固定長度陣列：取前 n 個，不足用 fallbacks 補 */
function padTo<T>(arr: T[], n: number, fallbacks: T[]): T[] {
  const out = arr.slice(0, n);
  while (out.length < n) out.push(fallbacks[out.length] ?? fallbacks[fallbacks.length - 1]);
  return out;
}

function titleForPalace(palace: string): string {
  const copy = getPalaceNarrativeCopy(palace);
  if (copy?.title) return copy.title;
  return `${palace}｜宮位敘事`;
}

function mainStarBecauseLine(star: string, b: BrightnessKey): string {
  return STAR_BRIGHTNESS_BECAUSE_OVERRIDE[star]?.[b] ?? MAIN_BRIGHTNESS_BECAUSE[b] ?? "";
}

function buildStarStructureBlock(raw: PalaceRawInput, natalTransformItems?: PalaceNatalTransformItem[]): string {
  const lines: string[] = [];
  const brightness = raw.brightness ?? {};
  const copy = getPalaceNarrativeCopy(raw.palace);
  const palaceLabel = copy?.shortLabel ?? raw.palace;

  lines.push("【星曜結構解析】", "");
  lines.push(raw.palace === "疾厄宮" ? "🔹 主星五行／體質線索" : "🔹 主定調星", "");

  const mainTotal = raw.mainStars.length;
  if (mainTotal > 0) {
    const mainParts = raw.mainStars.slice(0, 2).map((star) => {
      const b = normalizeB(brightness[star]);
      return b ? `${star}（${b === "得" ? "得" : b}）` : star;
    });
    lines.push(mainParts.join("＋"), "");
    const mingStarCompact = raw.palace === "命宮";
    const jiEMode = raw.palace === "疾厄宮";
    for (const star of raw.mainStars.slice(0, 2)) {
      const sem = getStarSemantic(star);
      const b = normalizeB(brightness[star]);
      if (jiEMode) {
        const label = b ? `${star}（${b}）` : star;
        lines.push(`${label}`, "");
        const wux = sem?.jiE_wuxingBody?.trim();
        if (wux) {
          lines.push(normalizeNarrativePunctuation(wux), "");
        } else {
          lines.push(
            normalizeNarrativePunctuation(
              "此星於疾厄宮之五行臟腑對照：語料待補；請結合全盤五行強弱與實際體質交叉校正（非醫療診斷）。"
            ),
            ""
          );
        }
        continue;
      }
      const core = sem?.core ?? "與此宮主題相關";
      const shortCore = core.split("、").slice(0, 3).join("、");
      const because = b ? mainStarBecauseLine(star, b) : "";
      if (b) {
        lines.push(`${star}（${b}）：代表${shortCore}。${because}`, "");
      } else {
        lines.push(`${star}：代表${shortCore}。`, "");
      }
      const corpus = palaceCorpusLookup(star, raw.palace)?.trim() ?? "";
      if (mingStarCompact) {
        if (corpus.length >= 36) {
          lines.push(
            normalizeNarrativePunctuation(`補充一句：${clipCorpusParagraph(corpus, 115)}`),
            ""
          );
        } else {
          const res = resonanceParagraphMain(star, raw.palace, palaceLabel);
          if (res)
            lines.push(
              res.length > 130 ? normalizeNarrativePunctuation(`${res.slice(0, 128)}…`) : res,
              ""
            );
        }
        continue;
      }
      const useLongCorpus = corpus.length >= 55;
      if (useLongCorpus) {
        const clipped = clipCorpusParagraph(corpus, raw.mainStars.length === 1 ? 420 : 280);
        lines.push(normalizeNarrativePunctuation(clipped), "");
      } else if (isSparsePalaceForCorpus(raw) && corpus.length > 80) {
        const clipped = clipCorpusParagraph(corpus, raw.mainStars.length === 1 ? 340 : 240);
        lines.push(normalizeNarrativePunctuation(clipped), "");
      }
      if (!useLongCorpus || corpus.length < 200) {
        const res = resonanceParagraphMain(star, raw.palace, palaceLabel);
        if (res) lines.push(res, "");
      }
    }

    let closing = "";
    if (mainTotal === 1) {
      closing = copy?.mainStarSingleClosing ?? "";
    } else if (mainTotal === 2) {
      closing = copy?.mainStarComboClosing ?? "";
    } else {
      closing = copy?.mainStarManyClosing ?? copy?.mainStarComboClosing ?? "";
    }
    if (closing) lines.push(closing, "");
  }

  const otherNames = [...raw.minorStars, ...raw.miscStars];
  const seen = new Set<string>();
  const otherOrdered = otherNames.map((s) => s.trim()).filter((s) => {
    if (!s || seen.has(s)) return false;
    seen.add(s);
    return true;
  });

  if (otherOrdered.length > 0) {
    const miscShort = getMiscPhenomenaShortMap(raw.palace);
    const jiEOther = raw.palace === "疾厄宮";
    let otherSectionStarted = false;
    const startOtherSection = () => {
      if (!otherSectionStarted) {
        lines.push("🔹 其他星曜", "");
        otherSectionStarted = true;
      }
    };
    for (const star of otherOrdered) {
      const b = normalizeB(brightness[star]);
      const miscLine = miscShort[star]?.trim();
      if (miscLine) {
        startOtherSection();
        const label = b ? `${star}（${b}）` : star;
        lines.push(`${label}：${miscLine}`, "");
        appendStarDeepLine(star, raw, palaceLabel, lines);
        continue;
      }
      if (jiEOther) {
        const semJ = getStarSemantic(star);
        const jieBody = semJ?.jiE_wuxingBody?.trim();
        if (jieBody) {
          startOtherSection();
          const label = b ? `${star}（${b}）` : star;
          lines.push(`${label}`, "");
          lines.push(normalizeNarrativePunctuation(jieBody), "");
        }
        continue;
      }
      startOtherSection();
      const core = otherStarSemanticCore(star);
      if (core) {
        const tail = b ? AUX_BRIGHTNESS_PHRASE[b] : "";
        if (b === "陷") {
          lines.push(`${star}（陷）：${core}落在「陷」，${tail}`, "");
        } else if (b) {
          lines.push(`${star}（${b}）：${core}${tail}`, "");
        } else {
          lines.push(`${star}：${core}`, "");
        }
        appendStarDeepLine(star, raw, palaceLabel, lines);
      } else if (b) {
        lines.push(`${star}（${b}）：${AUX_BRIGHTNESS_PHRASE[b]}`, "");
        appendStarDeepLine(star, raw, palaceLabel, lines);
      }
    }
  }

  if (natalTransformItems && natalTransformItems.length > 0) {
    lines.push("🔹 本命四化", "");
    for (const item of natalTransformItems) {
      lines.push(`${item.label}`, "");
      lines.push(item.narrative, "");
    }
  }

  return stripMarkdownEmphasis(lines.join("\n").trim());
}

export interface RenderPalaceNarrativeOptions {
  /** 若有提供，會輸出【星曜結構解析】區塊 */
  raw?: PalaceRawInput;
}

/**
 * 依固定模板輸出宮位敘事（v1.1）。
 * - 決策 3 條、運作 5 條、盲點 3 條，不足時用 fallback 補齊。
 * - 若傳入 options.raw，會附加【星曜結構解析】區塊。
 */
function firstParagraph(text: string): string {
  const t = (text ?? "").trim();
  if (!t) return "";
  const parts = t.split(/\n\n+/);
  return (parts[0] ?? t).trim();
}

/** 命宮決策：依主星語義字典「plain」資料驅動一句 */
function mingDecisionLineFromStar(star: string, roleLabel: string): string | null {
  const name = (star ?? "").trim();
  if (!name) return null;
  const profile = getMingProfile(name);
  if (profile?.decision) return `（${roleLabel}｜${name}）${profile.decision}`;
  const sem = getStarSemantic(name);
  const plain = (sem?.plain ?? "").trim();
  if (!plain) return null;
  return `（${roleLabel}｜${name}）${plain}`;
}

/** 命宮運作：依主星「risk」資料驅動一句（日常摩擦／慣性壓力） */
function mingOperationLineFromStar(star: string, roleLabel: string): string | null {
  const name = (star ?? "").trim();
  if (!name) return null;
  const profile = getMingProfile(name);
  if (profile?.phenomenon) return `（${roleLabel}｜${name}）${profile.phenomenon}`;
  const sem = getStarSemantic(name);
  const risk = (sem?.risk ?? "").trim();
  if (!risk) return null;
  return `（${roleLabel}｜${name}）${risk}`;
}

function uniqueMainStarPair(input: PalaceNarrativeInput): { lead: string; co: string | null } {
  const lead = (input.leadMainStar ?? "").trim();
  const coRaw = (input.coLeadMainStars ?? []).map((s) => (s ?? "").trim()).filter(Boolean)[0] ?? "";
  const co = coRaw && coRaw !== lead ? coRaw : null;
  return { lead, co };
}

function normalizedTurnLine(s: string): string {
  return (s ?? "").replace(/\s+/g, "").trim();
}

/** 去掉「（定調主星｜XX）」前綴，供決策句去重 */
function stripMingDecisionRolePrefix(s: string): string {
  return (s ?? "").replace(/^\（[^）]*｜[^）]+\）\s*/, "").trim();
}

function dedupeMingDecisionLines(lines: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of lines) {
    const t = (raw ?? "").trim();
    if (!t) continue;
    const key = normalizedTurnLine(stripMingDecisionRolePrefix(t));
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

function readerPremiumPayload(input: PalaceNarrativeInput): MingNarrativePremiumPayload | undefined {
  return input.readerPremium ?? input.mingNarrativePremium;
}

/** 12 宮：有 premium payload 時皆為 斷語→星曜→核心… 同一順序 */
const READER_PREMIUM_FIRST_PALACES = new Set([
  "命宮",
  "兄弟宮",
  "夫妻宮",
  "子女宮",
  "財帛宮",
  "疾厄宮",
  "遷移宮",
  "僕役宮",
  "官祿宮",
  "田宅宮",
  "福德宮",
  "父母宮",
]);

const BATCH1_PHENOMENA_FALLBACKS = [
  "生活場景裡，這類節奏會一再出現。",
  "壓力來時，你的反應會比想像中更固定。",
];

/** 除命宫外：決策／運作條目不顯示「（定調主星｜…）（共軸主星｜…）」前綴 */
const STRIP_STAR_ROLE_PREFIX_PALACES = new Set(
  Object.keys(PALACE_SEGMENT_SCHEMA).filter((p) => p !== "命宮")
);

function schemaGenericDecisionLine(
  palace: string,
  star: string,
  roleLabel: string,
  opts?: { withRolePrefix?: boolean }
): string | null {
  const withPrefix = opts?.withRolePrefix !== false;
  const schema = PALACE_SEGMENT_SCHEMA[palace];
  if (!schema) return null;
  if (palace === "田宅宮") {
    const tz = getTianZhaiProfile(star);
    if (tz?.decision) {
      return withPrefix ? `（${roleLabel}｜${star}）${tz.decision}` : tz.decision;
    }
  }
  const sem = getStarSemantic(star);
  const plain = (sem?.plain ?? "").trim();
  if (!plain) return null;
  const body = `做決策時，會把重心放在「${schema.decisionFocus}」；其中「${star}」讓你更傾向「${plain}」。`;
  return withPrefix ? `（${roleLabel}｜${star}）${body}` : body;
}

function batchDecisionLineFromStar(palace: string, star: string, roleLabel: string): string | null {
  const name = (star ?? "").trim();
  if (!name) return null;
  if (palace === "財帛宮") {
    const w = getWealthProfile(name);
    if (w?.decision) return `（${roleLabel}｜${name}）${w.decision}`;
    const sem = getStarSemantic(name);
    const plain = (sem?.plain ?? "").trim();
    if (!plain) return null;
    return `（${roleLabel}｜${name}）${plain}`;
  }
  if (palace === "官祿宮") {
    const p = getCareerProfile(name);
    if (p) {
      const [a, b] = p.forbiddenDecisions;
      return `（${roleLabel}｜${name}）「${name}」較適合往「${p.careerFit}」累積舞台。${formatCareerForbiddenHuman(name, a, b)}`;
    }
    const sem = getStarSemantic(name);
    const plain = (sem?.plain ?? "").trim();
    if (!plain) return null;
    return `（${roleLabel}｜${name}）${plain}`;
  }
  if (palace === "夫妻宮") {
    const sem = getStarSemantic(name);
    const plain = (sem?.plain ?? "").trim();
    if (!plain) return null;
    return `（${roleLabel}｜${name}）${plain}`;
  }
  const roleOpts = { withRolePrefix: !STRIP_STAR_ROLE_PREFIX_PALACES.has(palace) };
  return schemaGenericDecisionLine(palace, name, roleLabel, roleOpts);
}

function schemaGenericOperationLine(
  palace: string,
  star: string,
  roleLabel: string,
  opts?: { withRolePrefix?: boolean }
): string | null {
  const withPrefix = opts?.withRolePrefix !== false;
  if (!PALACE_SEGMENT_SCHEMA[palace]) return null;
  if (palace === "田宅宮") {
    const tz = getTianZhaiProfile(star);
    if (tz?.phenomenon) {
      return withPrefix ? `（${roleLabel}｜${star}）${tz.phenomenon}` : tz.phenomenon;
    }
  }
  const sem = getStarSemantic(star);
  const risk = stripTrailingPeriodInner(sem?.risk ?? "");
  if (!risk) return null;
  const body = `「${star}」常表現在${risk}。`;
  return withPrefix ? `（${roleLabel}｜${star}）${body}` : body;
}

function batchOperationLineFromStar(palace: string, star: string, roleLabel: string): string | null {
  const name = (star ?? "").trim();
  if (!name) return null;
  if (palace === "財帛宮") {
    const w = getWealthProfile(name);
    if (w?.phenomenon) return `（${roleLabel}｜${name}）${w.phenomenon}`;
    const sem = getStarSemantic(name);
    const risk = (sem?.risk ?? "").trim();
    if (!risk) return null;
    return `（${roleLabel}｜${name}）${risk}`;
  }
  if (palace === "官祿宮") {
    const c = getCareerProfile(name);
    const sem = getStarSemantic(name);
    const riskAlert = c?.riskAlert ?? "";
    if (c || sem?.risk) {
      return `（${roleLabel}｜${name}）${formatCareerPhenomenonHuman(name, riskAlert, sem?.risk)}`;
    }
    return null;
  }
  if (palace === "夫妻宮") {
    const sem = getStarSemantic(name);
    const risk = (sem?.risk ?? "").trim();
    if (!risk) return null;
    return `（${roleLabel}｜${name}）${risk}`;
  }
  return schemaGenericOperationLine(palace, name, roleLabel, {
    withRolePrefix: !STRIP_STAR_ROLE_PREFIX_PALACES.has(palace),
  });
}

/** 非命宮：premium 後段（與命宮同欄位；財／官／夫用專屬語料，其餘宮用 schema＋語義／田宅語料） */
function buildNonMingReaderBodyBlocks(input: PalaceNarrativeInput, prem: MingNarrativePremiumPayload): string[] {
  const tier: ReaderNarrativeIntensity = input.readerNarrativeIntensity ?? "standard";
  const palace = input.palace;

  const decisionFallbacks = [
    "你會先評估值得投入的方向。",
    "你會優先選擇可長期穩定的做法。",
  ];
  const pitfallFallbacks = ["容易把穩定感變成控制感。", "容易顧結構卻忽略感受。"];

  const { lead, co } = uniqueMainStarPair(input);
  const coreBlock = firstParagraph(input.structuralSummary);

  const decisionData: string[] = [];
  const d1 = lead ? batchDecisionLineFromStar(palace, lead, "定調主星") : null;
  const d2 = co ? batchDecisionLineFromStar(palace, co, "共軸主星") : null;
  if (d1) decisionData.push(d1);
  if (d2) decisionData.push(d2);
  const copyDecisions = (input.decisionPatterns ?? []).filter(Boolean);
  const mergedForDedupe: string[] = [...decisionData];
  if (copyDecisions.length > 0) mergedForDedupe.push(copyDecisions[0]);
  const deduped = dedupeMingDecisionLines(mergedForDedupe);
  const decisions = padTo(deduped, Math.max(2, deduped.length), decisionFallbacks);

  const opData: string[] = [];
  const o1 = lead ? batchOperationLineFromStar(palace, lead, "定調主星") : null;
  const o2 = co ? batchOperationLineFromStar(palace, co, "共軸主星") : null;
  if (o1) opData.push(o1);
  if (o2) opData.push(o2);
  const realPhenomena = input.phenomena.filter(Boolean);
  const overridePh = prem.bodyOverrides?.phenomenonLines?.map((s) => s.trim()).filter(Boolean) ?? [];
  const phenomena =
    overridePh.length > 0
      ? overridePh
      : realPhenomena.length > 0
        ? realPhenomena
        : padTo([...opData], 2, [...BATCH1_PHENOMENA_FALLBACKS]);

  const mergedPitfalls = [...(input.pitfalls ?? [])];
  const filteredPitfalls = mergedPitfalls.filter((line) => {
    const t = (line ?? "").trim();
    if (!t) return false;
    if (/^最常見的坑，是「容易把慣性當本質/.test(t)) return false;
    return true;
  });
  const overridePf = prem.bodyOverrides?.pitfallLines?.map((s) => s.trim()).filter(Boolean) ?? [];
  const pitfalls =
    overridePf.length > 0
      ? padTo(overridePf, Math.max(2, overridePf.length), pitfallFallbacks)
      : padTo(filteredPitfalls.length ? filteredPitfalls : mergedPitfalls, 2, pitfallFallbacks);

  const out: string[] = [];
  out.push("【這一宮的核心結構】", "");
  out.push(coreBlock, "");
  out.push("【你會怎麼做決策】", "");
  decisions.forEach((s) => out.push(`- ${s}`));
  out.push("");
  out.push("【這一宮的真實運作】", "");
  phenomena.forEach((s) => out.push(`- ${s}`));
  out.push("");
  out.push("【最容易踩的坑】", "");
  pitfalls.forEach((s) => out.push(`- ${s}`));

  out.push("");
  out.push("【轉個念，就不一樣】", "");
  const t = prem.turns[tier];
  out.push(t.reframe, "");
  if (
    t.action &&
    normalizedTurnLine(t.action) !== normalizedTurnLine(t.reframe) &&
    !normalizedTurnLine(t.reframe).includes(normalizedTurnLine(t.action).slice(0, 12))
  ) {
    out.push(t.action, "");
  }

  out.push("");
  out.push("【相關牽動】", "");
  out.push(input.relatedPalacesNote ?? "此宮位目前未設定相關牽動。");
  return out;
}

/** 命宮：先打中（斷語／提問／鏡像），星曜區塊再接在後當背書 */
function buildMingStrikeThenMirror(input: PalaceNarrativeInput): string[] {
  const tier: ReaderNarrativeIntensity = input.readerNarrativeIntensity ?? "standard";
  const prem = readerPremiumPayload(input);
  if (!prem) return [];

  const out: string[] = [];
  out.push("【斷語】", "");
  const hd = prem.headlines[tier];
  const line = input.readerDisplayName?.trim()
    ? `${input.readerDisplayName.trim()}，${hd.replace(/^你/, "")}`
    : hd;
  out.push(line, "");

  if (prem.provocativeQuestions.length > 0) {
    out.push("【想先問你】", "");
    prem.provocativeQuestions.forEach((q) => out.push(`- ${q}`));
    out.push("");
  }

  out.push("【鏡像】", "");
  for (const para of prem.mirrors[tier]
    .split(/\n\n+/)
    .map((s) => s.trim())
    .filter(Boolean)) {
    out.push(para, "");
  }
  out.push("");
  return out;
}

/** 命宮：核心／決策／運作／坑／轉念／牽動（不含斷語、提問、鏡像） */
function buildMingPremiumBodyBlocks(input: PalaceNarrativeInput, prem: MingNarrativePremiumPayload): string[] {
  const tier: ReaderNarrativeIntensity = input.readerNarrativeIntensity ?? "standard";

  const decisionFallbacks = [
    "你會先評估值得投入的方向。",
    "你會優先選擇可長期穩定的做法。",
  ];
  const pitfallFallbacks = ["容易把穩定感變成控制感。", "容易顧結構卻忽略感受。"];

  const { lead, co } = uniqueMainStarPair(input);
  const coreProfileLines = [lead, co ?? ""]
    .filter(Boolean)
    .map((s) => getMingProfile(s))
    .filter((x): x is NonNullable<ReturnType<typeof getMingProfile>> => Boolean(x))
    .map((p) => p.core)
    .slice(0, 2);
  const coreProfileText = coreProfileLines.length > 0 ? `\n\n${coreProfileLines.join(" ")}` : "";
  /* renderMingStructuralSummary 已內嵌 mingProfiles.core，勿再貼一次人格首句 */
  const summary = firstParagraph(input.structuralSummary);
  const coreBlock =
    summary.includes("帶著你走") || summary.includes("這條線，現在主要由")
      ? summary
      : summary + coreProfileText;

  const decisionData: string[] = [];
  const d1 = lead ? mingDecisionLineFromStar(lead, "定調主星") : null;
  const d2 = co ? mingDecisionLineFromStar(co, "共軸主星") : null;
  if (d1) decisionData.push(d1);
  if (d2) decisionData.push(d2);
  const copyDecisions = (input.decisionPatterns ?? []).filter(Boolean);
  const mergedForDedupe: string[] = [...decisionData];
  if (copyDecisions.length > 0) mergedForDedupe.push(copyDecisions[0]);
  const deduped = dedupeMingDecisionLines(mergedForDedupe);
  const decisions = padTo(deduped, Math.max(2, deduped.length), decisionFallbacks);

  const opData: string[] = [];
  const o1 = lead ? mingOperationLineFromStar(lead, "定調主星") : null;
  const o2 = co ? mingOperationLineFromStar(co, "共軸主星") : null;
  if (o1) opData.push(o1);
  if (o2) opData.push(o2);
  const realPhenomena = input.phenomena.filter(Boolean);
  let phenomena: string[];
  if (prem) {
    phenomena =
      realPhenomena.length > 0
        ? realPhenomena
        : padTo([...opData], 2, [...MING_GONG_PHENOMENA_FALLBACKS]);
  } else {
    const maxMisc = Math.max(0, 4 - opData.length);
    const miscSlice = realPhenomena.slice(0, maxMisc);
    phenomena = [...opData, ...miscSlice];
    if (phenomena.length < 2) {
      phenomena = padTo(phenomena, 2, [...MING_GONG_PHENOMENA_FALLBACKS]);
    }
  }

  const pitfallProfileLines = [lead, co ?? ""]
    .filter(Boolean)
    .map((s) => getMingProfile(s))
    .filter((x): x is NonNullable<ReturnType<typeof getMingProfile>> => Boolean(x))
    .map((p) => p.pitfall)
    .slice(0, 2);
  /* premium 路徑下坑段已由權重／profile 語料組好，避免與 profile 再疊一次 */
  const mergedPitfalls = prem
    ? [...(input.pitfalls ?? [])]
    : [...pitfallProfileLines, ...(input.pitfalls ?? [])];
  const filteredPitfalls = mergedPitfalls.filter((line) => {
    const t = (line ?? "").trim();
    if (!t) return false;
    if (/^最常見的坑，是「容易把慣性當本質/.test(t)) return false;
    return true;
  });
  const pitfalls = padTo(filteredPitfalls.length ? filteredPitfalls : mergedPitfalls, 2, pitfallFallbacks);

  const out: string[] = [];
  out.push("【這一宮的核心結構】", "");
  out.push(coreBlock, "");
  out.push("【你會怎麼做決策】", "");
  decisions.forEach((s) => out.push(`- ${s}`));
  out.push("");
  out.push("【這一宮的真實運作】", "");
  phenomena.forEach((s) => out.push(`- ${s}`));
  out.push("");
  out.push("【最容易踩的坑】", "");
  pitfalls.forEach((s) => out.push(`- ${s}`));

  if (prem) {
    out.push("");
    out.push("【轉個念，就不一樣】", "");
    const t = prem.turns[tier];
    out.push(t.reframe, "");
    if (
      t.action &&
      normalizedTurnLine(t.action) !== normalizedTurnLine(t.reframe) &&
      !normalizedTurnLine(t.reframe).includes(normalizedTurnLine(t.action).slice(0, 12))
    ) {
      out.push(t.action, "");
    }
  }

  out.push("");
  out.push("【相關牽動】", "");
  out.push(input.relatedPalacesNote ?? "此宮位目前未設定相關牽動。");
  return out;
}

/** 命宮雙主星專題：僅在語料命中時插入（緊接【星曜結構解析】之後） */
function appendMingDualMainStarIfAny(lines: string[], raw: PalaceRawInput | undefined): void {
  const block = getMingDualMainStarNarrativeText(raw);
  if (!block) return;
  lines.push(block, "");
}

function buildReaderPremiumBodyBlocks(input: PalaceNarrativeInput): string[] {
  const prem = readerPremiumPayload(input);
  if (!prem) return [];
  if (input.palace === "命宮") {
    return buildMingPremiumBodyBlocks(input, prem);
  }
  return buildNonMingReaderBodyBlocks(input, prem);
}

export function renderPalaceNarrativeSample(
  input: PalaceNarrativeInput,
  options?: RenderPalaceNarrativeOptions
): string {
  const decisionFallbacks = [
    "你會先評估值得投入的方向。",
    "你會優先選擇可長期穩定的做法。",
    "你希望生活是能被整理、被長期維持的。",
  ];
  const phenomenaFallbacks =
    input.palace === "命宮"
      ? [...MING_GONG_PHENOMENA_FALLBACKS]
      : [
          "生活運作會受外部節奏牽動。",
          "內在安全感偶爾會出現波動。",
          "建立根基時可能需要繞路調整。",
          "你需要自己的空間與獨處時間恢復能量。",
          "在責任與規範上你對自己要求較高。",
        ];
  const pitfallFallbacks = [
    "容易把穩定感變成控制感。",
    "容易顧結構卻忽略感受。",
    "容易為了顧全整體穩定而壓住自己的需求。",
  ];

  const lines: string[] = [];
  lines.push(titleForPalace(input.palace), "");

  const prem = readerPremiumPayload(input);
  const useReaderPremiumFirst = Boolean(prem && READER_PREMIUM_FIRST_PALACES.has(input.palace));

  if (useReaderPremiumFirst) {
    lines.push(...buildMingStrikeThenMirror(input));
    if (options?.raw) {
      lines.push(buildStarStructureBlock(options.raw, input.natalTransformItems));
      lines.push("");
      appendMingDualMainStarIfAny(lines, options.raw);
    }
    lines.push(...buildReaderPremiumBodyBlocks(input));
  } else if (input.palace === "命宮") {
    if (options?.raw) {
      lines.push(buildStarStructureBlock(options.raw, input.natalTransformItems));
      lines.push("");
      appendMingDualMainStarIfAny(lines, options.raw);
    }
    const decisions = input.weightedMode ? input.decisionPatterns : padTo(input.decisionPatterns, 3, decisionFallbacks);
    const phenomena = input.weightedMode ? input.phenomena : padTo(input.phenomena, 5, phenomenaFallbacks);
    const pitfalls = input.weightedMode ? input.pitfalls : padTo(input.pitfalls, 3, pitfallFallbacks);
    lines.push("【這一宮的核心結構】", "");
    lines.push(input.structuralSummary, "");
    lines.push("【你會怎麼做決策】", "");
    decisions.forEach((s) => lines.push(`- ${s}`));
    lines.push("");
    lines.push("【這一宮的真實運作】", "");
    phenomena.forEach((s) => lines.push(`- ${s}`));
    lines.push("");
    lines.push("【最容易踩的坑】", "");
    pitfalls.forEach((s) => lines.push(`- ${s}`));
    lines.push("");
    lines.push("【相關牽動】", "");
    lines.push(input.relatedPalacesNote ?? "此宮位目前未設定相關牽動。");
  } else {
    if (options?.raw) {
      lines.push(buildStarStructureBlock(options.raw, input.natalTransformItems));
      lines.push("");
    }
    const decisions = input.weightedMode ? input.decisionPatterns : padTo(input.decisionPatterns, 3, decisionFallbacks);
    const phenomena = input.weightedMode ? input.phenomena : padTo(input.phenomena, 5, phenomenaFallbacks);
    const pitfalls = input.weightedMode ? input.pitfalls : padTo(input.pitfalls, 3, pitfallFallbacks);
    lines.push("【這一宮的核心結構】", "");
    lines.push(input.structuralSummary, "");
    lines.push("【你會怎麼做決策】", "");
    decisions.forEach((s) => lines.push(`- ${s}`));
    lines.push("");
    lines.push("【這一宮的真實運作】", "");
    phenomena.forEach((s) => lines.push(`- ${s}`));
    lines.push("");
    lines.push("【最容易踩的坑】", "");
    pitfalls.forEach((s) => lines.push(`- ${s}`));
    lines.push("");
    lines.push("【相關牽動】", "");
    lines.push(input.relatedPalacesNote ?? "此宮位目前未設定相關牽動。");
  }

  if (input.behaviorLoopLine?.trim()) {
    lines.push("");
    lines.push(`「一直在發生的」：${input.behaviorLoopLine.trim()}`);
  }

  return stripMarkdownEmphasis(lines.join("\n").trim());
}
