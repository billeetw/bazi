/**
 * 命宮×身宮關係：同宮／同向／錯位／張力型錯位／補償型錯位。
 * 產出個人化敘事，不露示例與戰略語氣。
 */

import { PALACES } from "./schema.js";

const RING = PALACES.map((p) => {
  const n = p.name;
  return n === "命宮" ? "命宮" : n.endsWith("宮") ? n : n + "宮";
});

function norm(palace: string): string {
  const s = (palace ?? "").trim();
  if (!s) return "";
  if (s === "命" || s === "命宮") return "命宮";
  return s.endsWith("宮") ? s : s + "宮";
}

function palaceIndex(palace: string): number {
  const p = norm(palace);
  if (!p) return -1;
  const idx = RING.findIndex((r) => r === p || r.replace(/宮$/, "") === p.replace(/宮$/, ""));
  return idx;
}

/** 命宮的三方四正宮位名集合（本宮+兩三合+對宮） */
function sanfangSizhengSet(mingPalace: string): Set<string> {
  const idx = palaceIndex(mingPalace);
  if (idx < 0) return new Set();
  const opp = (idx + 6) % 12;
  const t1 = (idx + 4) % 12;
  const t2 = (idx + 8) % 12;
  const names = [RING[idx], RING[t1], RING[t2], RING[opp]].map((n) => norm(n));
  return new Set(names);
}

type AlignmentType = "同宮" | "同向" | "錯位" | "張力型錯位" | "補償型錯位";

function getAlignmentType(mingPalace: string, bodyPalace: string): AlignmentType {
  const ming = norm(mingPalace);
  const body = norm(bodyPalace);
  if (!ming || !body) return "錯位";
  if (ming === body) return "同宮";
  const sfs = sanfangSizhengSet(mingPalace);
  if (sfs.has(body)) return "同向";

  // 錯位子型：張力型（主題衝突）vs 補償型（身宮補命宮之不足）
  const tensionPairs: [string, string][] = [
    ["命宮", "遷移"], ["命宮", "夫妻"], ["命宮", "僕役"],
    ["遷移", "命宮"], ["夫妻", "命宮"], ["財帛", "福德"], ["官祿", "夫妻"],
  ];
  const compensationPairs: [string, string][] = [
    ["命宮", "財帛"], ["命宮", "官祿"], ["命宮", "田宅"], ["命宮", "福德"],
    ["財帛", "命宮"], ["官祿", "命宮"], ["夫妻", "官祿"], ["遷移", "官祿"],
  ];
  const m = ming.replace(/宮$/, "");
  const b = body.replace(/宮$/, "");
  const m2 = ming === "命宮" ? "命宮" : m;
  const b2 = body === "命宮" ? "命宮" : b;
  for (const [x, y] of tensionPairs) {
    if ((x === m2 || x === ming) && (y === b2 || y === body)) return "張力型錯位";
  }
  for (const [x, y] of compensationPairs) {
    if ((x === m2 || x === ming) && (y === b2 || y === body)) return "補償型錯位";
  }
  return "錯位";
}

const NARRATIVES: Record<AlignmentType, string[]> = {
  同宮: [
    "命宮與身宮同宮，代表你這輩子想的和做的會落在同一個主題上，方向感強，但也容易固執。成熟後要練的是：在堅持裡保留彈性，讓初衷成為方向而不是枷鎖。",
    "命身同宮的人，人生體感與自我定位綁在一起，很多事都會回到「我是誰」「我要什麼」。好處是活得很一致，風險是把所有事都解讀成對自己的定義。",
  ],
  同向: [
    "命宮與身宮在同一條主線上（三方四正），想的與感受的場域相關，容易在同一類主題上發力。要留意的是：不要太單一賽道，保留一點跨線的彈性。",
    "身宮落在命宮同向的宮位，代表你的體感會集中在與命宮主題相關的領域，方向一致，較少「想一套、感受另一套」的斷裂。",
  ],
  錯位: [
    "命宮與身宮不同宮，代表你的人生體感會落在與「自我定位」不同的場域，有時會覺得想的方向和真正有感的領域不太一樣。要練的是：認清身宮才是你真正敏感的地方，決策與資源可以多放一點在那裡。",
    "命身錯位的人，容易在命宮主題與身宮主題之間擺盪。成熟後不是二選一，而是讓命宮定方向、身宮定「把力氣放在哪裡」的優先順序。",
  ],
  張力型錯位: [
    "命宮與身宮的主題有明顯張力：一個在自我與定位，一個在外部或關係，容易在「做自己」與「配合外界」之間拉扯。要練的是：在張力裡找平衡點，而不是壓掉其中一邊。",
    "這種組合常讓人感覺「心裡一套、身體一套」——靈魂要的與身宮敏感的場域不同。成熟後會學會在兩邊之間切換節奏，而不是長期犧牲其中一邊。",
  ],
  補償型錯位: [
    "身宮落在能補命宮之不足的場域，代表你後天會很自然地把體感與力氣放在「補強」的地方。例如命宮主自我，身宮在財帛或官祿，就會在資源與成就上特別有感覺。要善用這份補償，而不是當成負擔。",
    "命身補償型錯位的人，人生體感會集中在能支撐命宮主題的領域。成熟後要練的是：讓身宮的敏感度成為命宮方向的燃料，而不是分散注意力的來源。",
  ],
};

/**
 * 依命宮、身宮產出「命身是否同步」敘事一句；分同宮／同向／錯位／張力型錯位／補償型錯位。
 * 單一模板，不隨機選句。
 */
export function buildBodyPalaceAlignmentNarrative(
  mingPalace: string,
  bodyPalace: string,
  _seed?: number
): string {
  const t = getAlignmentType(mingPalace, bodyPalace);
  const arr = NARRATIVES[t];
  return arr?.length ? arr[0] : "";
}
