/**
 * 命盤主戰場偵測器：從整張命盤找出資源/壓力/事件集中宮位，輸出 Top 3。
 * 計分：四化（祿權科忌×層級）+ 主星 + 煞星 + 三方四正
 * 評語依 tags 動態生成（三標籤 → 雙標籤 → 單 tag），並帶入宮位語義一句。
 */

import { buildAssembleInput } from "./chartToAssembleInput.js";
import { PALACES, PALACE_ID_TO_NAME, STAR_ID_TO_NAME } from "./schema.js";
import { toPalaceCanonical } from "./canonicalKeys.js";
import { getPalaceSemantic } from "./starSemanticDictionary.js";
import type { NormalizedSiHuaEvent } from "./s00UnifiedTypes.js";
import type { DominantPalace } from "./s00UnifiedTypes.js";

/** 單一 tag 評語（功能層／密度層／主軸層） */
export const PALACE_TAG_COMMENT: Record<string, string> = {
  祿疊: "這裡容易聚集資源、機會與可累積的成果，越早經營越容易看到複利。",
  忌疊: "這裡容易成為壓力與修正的集中點，若太急著解決，反而容易讓問題放大。",
  權疊: "這裡常伴隨責任、主導與決策壓力，你很難完全被動，往往需要主動定義規則。",
  科疊: "這裡適合用方法、學習與系統化來優化，很多問題不是硬撐，而是要找到更好的做法。",
  主星集中: "這個領域的議題密度高，會反覆出現在你的生活裡，不太容易被忽略。",
  三方核心: "這裡與你的主線結構高度連動，牽一髮往往會動全身。",
};

/** 雙標籤組合專用句（優先於單 tag 句） */
export const PALACE_TAG_PAIR_COMMENT: Array<{ tags: [string, string]; lines: string[] }> = [
  { tags: ["祿疊", "忌疊"], lines: ["這裡容易聚集資源與機會，但同時也是壓力與修正的集中點，代表你在這個領域常會一邊得到、一邊承受。", "若太急著追結果，容易把原本可以累積的優勢變成心理負擔。"] },
  { tags: ["忌疊", "權疊"], lines: ["這裡不只是壓力點，也是責任點，很多事最後會落到你身上處理。"] },
  { tags: ["祿疊", "權疊"], lines: ["這裡有資源也有主導權，若能主動布局，往往能放大成果。"] },
  { tags: ["科疊", "忌疊"], lines: ["這裡的問題通常不是不能解，而是需要更好的方法與節奏。"] },
  { tags: ["科疊", "權疊"], lines: ["這裡適合你透過方法與制度掌握局面，而不是只靠硬撐。"] },
  { tags: ["祿疊", "三方核心"], lines: ["這裡不只是有資源，還是主線槓桿點，值得長期投入。"] },
  { tags: ["忌疊", "三方核心"], lines: ["這裡是核心課題之一，越逃避越容易反覆被命運推回來。"] },
  { tags: ["祿疊", "主星集中"], lines: ["這裡容易累積資源與成果，是你比較容易看到回報的領域。"] },
  { tags: ["忌疊", "主星集中"], lines: ["這裡的壓力密度較高，很多需要面對與修正的事情會集中在這個領域。"] },
  { tags: ["權疊", "主星集中"], lines: ["這裡常會需要你主動承擔或做決定，很少能完全置身事外。"] },
  { tags: ["科疊", "主星集中"], lines: ["這裡的問題往往可以透過方法與理解改善，而不是單純靠努力。"] },
];

/** 三標籤組合專用句（最優先） */
export const PALACE_TAG_TRIPLE_COMMENT: Array<{ tags: [string, string, string]; lines: string[] }> = [
  {
    tags: ["祿疊", "主星集中", "三方核心"],
    lines: [
      "這裡容易聚集資源、機會與成果，是值得長期經營的累積點。",
      "這個領域的議題密度高，會反覆出現在你的生活裡。",
      "它又位於主線核心，往往牽動整體決策方向。",
    ],
  },
  {
    tags: ["忌疊", "權疊", "主星集中"],
    lines: [
      "這裡不只是壓力點，也是責任點，很多事最後會落到你身上處理。",
      "這個領域的議題密度高，代表你很難完全不管。",
      "若太急著扛起全部，壓力反而會持續堆積。",
    ],
  },
  {
    tags: ["忌疊", "祿疊", "主星集中"],
    lines: [
      "這裡容易一邊得到、一邊承受，代表機會與心理壓力常會綁在一起出現。",
      "若太急著追結果，原本可累積的優勢反而會變成內耗。",
      "這個領域的議題密度高，會反覆影響你的判斷與狀態。",
    ],
  },
];

const TAG_ORDER: string[] = ["祿疊", "忌疊", "權疊", "科疊", "主星集中", "三方核心"];

const LAYER_WEIGHT: Record<string, number> = { natal: 2, decade: 1, year: 1, minor: 1 };
const TRANSFORM_SCORE: Record<string, number> = { lu: 3, quan: 2, ke: 1, ji: 3 };
const MAIN_STAR_SCORE: Record<string, number> = {
  ziWei: 3, tianFu: 3, wuQu: 2, tianXiang: 2, qiSha: 2, poJun: 2, lianZhen: 2,
  tianJi: 2, taiYang: 2, juMen: 2, taiYin: 2, tianTong: 2, tianLiang: 2, tanLang: 2,
};
const SHA_STAR_IDS = new Set(["qingYang", "tuoLuo", "huoXing", "lingXing", "diKong", "diJie"]);
const SANFANG_PALACE_NAMES = new Set(["命宮", "財帛宮", "官祿宮", "遷移宮"]);

export interface DetectDominantPalacesInput {
  chartJson: Record<string, unknown>;
  config?: { tenGodByPalace?: Record<string, string> } | null;
  events: NormalizedSiHuaEvent[];
}

/**
 * 依計分規則算出每宮 score，回傳 Top 3 DominantPalace
 */
export function detectDominantPalaces(input: DetectDominantPalacesInput): DominantPalace[] {
  const { chartJson, config, events } = input;
  const assemble = buildAssembleInput(chartJson, config ?? null, "zh-TW");
  const starByPalace = assemble.starByPalace as Partial<Record<string, string[]>> | undefined;
  const idToName = STAR_ID_TO_NAME as Record<string, string>;
  const palaceIdToName = PALACE_ID_TO_NAME as Record<string, string>;

  const scoreByPalace = new Map<string, number>();
  const tagsByPalace = new Map<string, string[]>();
  const evidenceByPalace = new Map<string, unknown[]>();

  for (const p of PALACES) {
    const name = p.name.endsWith("宮") ? p.name : p.name + "宮";
    const canonical = toPalaceCanonical(name);
    scoreByPalace.set(canonical, 0);
    tagsByPalace.set(canonical, []);
    evidenceByPalace.set(canonical, []);
  }

  for (const e of events) {
    const to = e.toPalace ? toPalaceCanonical(e.toPalace) : null;
    if (!to || !scoreByPalace.has(to)) continue;
    const tw = LAYER_WEIGHT[e.layer] ?? 1;
    const ts = TRANSFORM_SCORE[e.transform] ?? 0;
    const add = ts * tw;
    scoreByPalace.set(to, (scoreByPalace.get(to) ?? 0) + add);
    const tag = e.transform === "lu" ? "祿" : e.transform === "ji" ? "忌" : e.transform === "quan" ? "權" : "科";
    if (!tagsByPalace.get(to)!.includes(tag + "疊")) tagsByPalace.get(to)!.push(tag + "疊");
    evidenceByPalace.get(to)!.push({ layer: e.layer, transform: e.transform, star: e.starNameZh ?? e.starId });
  }

  if (starByPalace) {
    for (const [pid, starIds] of Object.entries(starByPalace)) {
      if (!Array.isArray(starIds)) continue;
      const palaceName = (palaceIdToName[pid] ?? pid);
      const canonical = toPalaceCanonical(palaceName);
      let s = scoreByPalace.get(canonical) ?? 0;
      const tags = tagsByPalace.get(canonical) ?? [];
      for (const id of starIds) {
        const name = idToName[id] ?? id;
        const starScore = MAIN_STAR_SCORE[id] ?? (SHA_STAR_IDS.has(id) ? 1 : 0);
        s += starScore;
        if (starScore >= 2 && !tags.includes("主星集中")) tags.push("主星集中");
        if (SHA_STAR_IDS.has(id)) tags.push("煞星");
      }
      scoreByPalace.set(canonical, s);
      tagsByPalace.set(canonical, tags);
    }
  }

  for (const p of PALACES) {
    const name = p.name.endsWith("宮") ? p.name : p.name + "宮";
    const canonical = toPalaceCanonical(name);
    if (!SANFANG_PALACE_NAMES.has(canonical)) continue;
    const s = (scoreByPalace.get(canonical) ?? 0) + 2;
    scoreByPalace.set(canonical, s);
    const tags = tagsByPalace.get(canonical) ?? [];
    if (!tags.includes("三方核心")) tags.push("三方核心");
    tagsByPalace.set(canonical, tags);
  }

  const result: DominantPalace[] = [];
  const sorted = [...scoreByPalace.entries()].sort((a, b) => b[1] - a[1]);
  for (let i = 0; i < Math.min(3, sorted.length); i++) {
    const [palace, score] = sorted[i];
    result.push({
      palace,
      score,
      tags: [...new Set(tagsByPalace.get(palace) ?? [])],
      evidence: evidenceByPalace.get(palace) ?? [],
    });
  }
  return result;
}

function tagSetMatch(tags: string[], required: string[]): boolean {
  return required.every((t) => tags.includes(t));
}

/**
 * 依 tags 產出該宮評語：先檢查三標籤 → 雙標籤覆寫，其餘依 TAG_ORDER 各輸出一句。
 */
function buildPalaceTagComments(tags: string[]): string[] {
  const ordered = TAG_ORDER.filter((t) => tags.includes(t));
  if (ordered.length === 0) return [];
  const used = new Set<string>();
  const out: string[] = [];

  for (const triple of PALACE_TAG_TRIPLE_COMMENT) {
    if (tagSetMatch(tags, triple.tags)) {
      triple.tags.forEach((t) => used.add(t));
      out.push(...triple.lines);
      return out;
    }
  }

  for (const pair of PALACE_TAG_PAIR_COMMENT) {
    const [a, b] = pair.tags;
    if (tags.includes(a) && tags.includes(b)) {
      used.add(a);
      used.add(b);
      out.push(...pair.lines);
    }
  }

  for (const t of ordered) {
    if (used.has(t)) continue;
    if (t === "科疊" && tags.includes("忌疊")) continue;
    const line = PALACE_TAG_COMMENT[t];
    if (line) out.push(line);
  }
  return out;
}

/**
 * 將 Top 3 主戰場轉成 s00「命盤主舞台」一段文案；每宮依 tags 動態生成多句評語，並補一次宮位語義。
 */
export function formatDominantPalacesBlock(dominant: DominantPalace[]): string {
  if (dominant.length === 0) return "";
  const lines: string[] = ["在整張命盤中，以下宮位被能量集中點亮："];
  for (const d of dominant) {
    const tagStr = d.tags.length > 0 ? `（${d.tags.join("、")}）` : "";
    const comments = buildPalaceTagComments(d.tags);
    const palSem = getPalaceSemantic(d.palace);
    const palaceLead = palSem ? `${d.palace}對應的是${palSem.core}。` : "";
    const body =
      comments.length > 0
        ? (palaceLead ? palaceLead + "\n" : "") + comments.join("\n")
        : palaceLead || "這裡是命盤中的重要舞台，很多事件與決策會與此領域相關。";
    lines.push(`\n${d.palace} ${tagStr}\n${body}`);
  }
  return lines.join("");
}
