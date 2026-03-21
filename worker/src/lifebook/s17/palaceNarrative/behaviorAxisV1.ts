/**
 * Behavior Axis v1：命宮地支 → dynamic | relational | introverted
 * 語氣微偏移、星曜×軸衝突句、Loop 示範（不暴露框架名詞）。
 * 規格：docs/lifebook-behavior-axis-v1-spec.md
 *
 * 管線尚未預設開啟；由 PalaceNarrativeBuilder / renderer 選擇性呼叫。
 */

export type BehaviorAxis = "dynamic" | "relational" | "introverted";

/** 驟馬 */
export const DYNAMIC_BRANCHES = ["寅", "申", "巳", "亥"] as const;
/** 桃花 */
export const RELATIONAL_BRANCHES = ["子", "午", "卯", "酉"] as const;
/** 孤獨（其餘四墓庫等） */
export const INTROVERTED_BRANCHES = ["辰", "戌", "丑", "未"] as const;

/** 由命宮地支決定 Behavior Axis（單一來源與規格一致） */
export function getBehaviorAxis(branch: string): BehaviorAxis {
  const b = (branch ?? "").trim();
  if (DYNAMIC_BRANCHES.includes(b as (typeof DYNAMIC_BRANCHES)[number])) return "dynamic";
  if (RELATIONAL_BRANCHES.includes(b as (typeof RELATIONAL_BRANCHES)[number])) return "relational";
  return "introverted";
}

/** 斷語／headline 在標準句後接的尾巴（不露框架） */
export const HEADLINE_SHIFT_V1: Record<BehaviorAxis, string> = {
  dynamic: "，而且不太會停在原地太久",
  relational: "，也會同時在看人與氣氛",
  introverted: "，而且多半會先收在自己裡面處理",
};

export function applyHeadlineShiftV1(base: string, axis: BehaviorAxis): string {
  const s = (base ?? "").trim();
  if (!s) return s;
  return s + HEADLINE_SHIFT_V1[axis];
}

/** H3：每宮最多加一句（整句提供，由呼叫端合併到三句之一） */
export const DECISION_SHIFT_LINE_V1: Record<BehaviorAxis, string> = {
  dynamic: "你不太會等到完全穩才動，通常會先試一段再調整",
  relational: "你很少只看事情本身，也會同時評估人與關係",
  introverted: "你會先在心裡想清楚一輪，再決定要不要動",
};

/** H4：首選注入（整句，可接在最後一條 pitfall 後或獨立呈現） */
export const PITFALL_SHIFT_LINE_V1: Record<BehaviorAxis, string> = {
  dynamic: "這樣的節奏久了，很容易還沒站穩就已經換場",
  relational: "這樣下來，很容易為了關係調整太多自己",
  introverted: "久了會變成卡在裡面，想動但啟動不了",
};

/** 轉個念 */
export const TURN_SHIFT_LINE_V1: Record<BehaviorAxis, string> = {
  dynamic: "先慢一點，確認方向，再動會更穩",
  relational: "先分清楚這是事情還是關係，再決定怎麼回應",
  introverted: "先把想的說出來一小步，再決定要不要動",
};

/** 注入規則（與規格一致） */
export const INJECTION_RULE_V1 = {
  maxPerPalace: 2 as const,
  priority: ["pitfall", "decision", "headline"] as const,
  avoidSections: ["structuralSummary"] as const,
};

/** 禁用：露框架、說教感（若命中則不注入或改寫） */
export const BANNED_FRAMEWORK_SUBSTRINGS_V1 = [
  "你是那種會",
  "你的命格是",
  "因為你屬於",
  "你屬於",
] as const;

export function textPassesBehaviorAxisToneGateV1(text: string): boolean {
  const t = text ?? "";
  for (const w of BANNED_FRAMEWORK_SUBSTRINGS_V1) {
    if (t.includes(w)) return false;
  }
  return true;
}

/** 簡單長度上限（可由產品調整） */
export const MAX_SHIFTED_SENTENCE_CHARS_V1 = 120;

// ── 星曜 × Axis 衝突（稀疏表） ─────────────────────────────

export type ConflictRuleV1 = {
  star: string;
  axis: BehaviorAxis;
  line: string;
  /** 越小越先命中 */
  priority: number;
};

export const STAR_AXIS_CONFLICT_RULES_V1: ConflictRuleV1[] = [
  { star: "太陰", axis: "dynamic", priority: 1, line: "你其實需要時間感受與消化，但生活的節奏常把你往外推，很難真的停下來。" },
  { star: "武曲", axis: "introverted", priority: 2, line: "你會把事情扛起來，但不太會把壓力往外放，很多東西最後變成自己消化。" },
  { star: "天機", axis: "dynamic", priority: 2, line: "你腦中其實會先跑很多版本，但現實常讓你來不及想完就已經做了。" },
  { star: "巨門", axis: "relational", priority: 2, line: "你很會看人，但也容易在互動裡多想，關係一靠近就開始出現內在拉扯。" },
  { star: "廉貞", axis: "introverted", priority: 2, line: "你的情緒其實很強，但多半不會直接表達，而是壓在裡面慢慢累積。" },
  { star: "貪狼", axis: "introverted", priority: 2, line: "你其實有很多想要的東西，但不一定會往外拿，常常變成在心裡反覆拉扯。" },
];

function normalizeStarToken(s: string): string {
  return (s ?? "").replace(/星$/u, "").trim();
}

/** 主星名是否在陣列中（含化忌等後綴的寬鬆匹配） */
export function mainStarsIncludeStar(mainStars: string[], starCanon: string): boolean {
  const target = normalizeStarToken(starCanon);
  if (!target) return false;
  for (const raw of mainStars) {
    const n = normalizeStarToken(raw);
    if (n === target || n.startsWith(target)) return true;
  }
  return false;
}

/** 取第一條命中衝突（依 priority 升序） */
export function getStarAxisConflictLineV1(mainStars: string[], axis: BehaviorAxis): string | undefined {
  const pool = STAR_AXIS_CONFLICT_RULES_V1.filter((r) => r.axis === axis && mainStarsIncludeStar(mainStars, r.star));
  if (pool.length === 0) return undefined;
  pool.sort((a, b) => a.priority - b.priority);
  return pool[0]?.line;
}

// ── Loop 示範（每宮最多一句；可擴表） ───────────────────────

export const LOOP_LINE_BY_PALACE_V1: Partial<Record<string, string>> = {
  命宮: "所以你最後還是會回到那個「比較像你」的選擇，只是通常已經繞了一圈。",
  財帛宮: "所以你會在「穩」與「其實可以再往前一點」之間反覆拉扯。",
  福德宮: "所以你會一直在「先讓自己好一點」與「事情其實還在」之間循環。",
  夫妻宮: "所以很多話你其實知道要說，但會拖到關係撐不住才說出口。",
};

export const LOOP_CONTROL_V1 = {
  maxPerPalace: 1 as const,
  priorityPalaces: ["命宮", "福德宮", "財帛宮", "夫妻宮"] as const,
};

export function getLoopLineV1(palaceCanon: string): string | undefined {
  const p = palaceCanon.endsWith("宮") ? palaceCanon : `${palaceCanon}宮`;
  return LOOP_LINE_BY_PALACE_V1[p];
}

/** 進階：太陰 × dynamic 一條式張力（與衝突表第一句一致，可給 UI 選用） */
export const TENSION_EXAMPLE_TAIYIN_DYNAMIC_V1 =
  "你會先收住自己 → 但現實會推著你動 → 所以你一直在「還沒準備好」與「已經在動」之間來回";

/** 預留：天馬加強時只調強度，不新增句子（intensity 0～1） */
export function intensityFromTianMaOptional(_hasTianMa: boolean): 0 | 1 {
  return _hasTianMa ? 1 : 0;
}

// ── Feature flag 管線：微偏移 + 衝突 + Loop（分開驗收） ─────────

/** 與 LifeBookConfig 欄位名一一對應，方便驗收「哪一層在加分／搗亂」 */
export type BehaviorAxisFeatureFlags = {
  behaviorAxisV1?: boolean;
  behaviorAxisConflictV1?: boolean;
  behaviorAxisLoopV1?: boolean;
};

/** 預設「窄開啟」：僅這四宮套用（避免全盤語感一次改太多） */
export const BEHAVIOR_AXIS_NARROW_PALACES_V1 = new Set<string>(["命宮", "福德宮", "財帛宮", "夫妻宮"]);

const MAX_PITFALL_MERGED_CHARS_V1 = 280;
const MAX_DECISION_MERGED_CHARS_V1 = 220;

function trimMergedFixed(s: string, maxLen: number): string {
  if (s.length <= maxLen) return s;
  return `${s.slice(0, Math.max(0, maxLen - 1))}…`;
}

export function anyBehaviorAxisFlagEnabled(flags?: Partial<BehaviorAxisFeatureFlags>): boolean {
  if (!flags) return false;
  return Boolean(flags.behaviorAxisV1 || flags.behaviorAxisConflictV1 || flags.behaviorAxisLoopV1);
}

/**
 * 在既有 H3/H4 字串上套用 Behavior Axis（不動 structuralSummary）。
 * 建議 rollout：先 behaviorAxisV1 → 再 conflictV1 → 最後 loopV1。
 */
export function applyBehaviorAxisLayersToPalaceNarrative(input: {
  palace: string;
  mainStars: string[];
  decisionPatterns: string[];
  pitfalls: string[];
  mingSoulBranch?: string;
  flags: Partial<BehaviorAxisFeatureFlags>;
  /** 預設 true：僅四宮；false = 12 宮皆可（wide open） */
  narrowPalacesOnly?: boolean;
}): {
  decisionPatterns: string[];
  pitfalls: string[];
  behaviorLoopLine?: string;
  behaviorAxis?: BehaviorAxis;
  behaviorAxisApplied?: { v1: boolean; conflictV1: boolean; loopV1: boolean };
} {
  const empty = {
    decisionPatterns: [...input.decisionPatterns],
    pitfalls: [...input.pitfalls],
  };
  if (!anyBehaviorAxisFlagEnabled(input.flags)) return empty;

  const branch = (input.mingSoulBranch ?? "").trim();
  if (!branch) return empty;

  const p = input.palace.endsWith("宮") ? input.palace : `${input.palace}宮`;
  const narrow = input.narrowPalacesOnly !== false;
  if (narrow && !BEHAVIOR_AXIS_NARROW_PALACES_V1.has(p)) return empty;

  const axis = getBehaviorAxis(branch);
  const applied = { v1: false, conflictV1: false, loopV1: false };
  const decisions = [...input.decisionPatterns];
  const pitfalls = [...input.pitfalls];

  if (input.flags.behaviorAxisV1) {
    if (pitfalls.length > 0) {
      const tail = PITFALL_SHIFT_LINE_V1[axis];
      const last = pitfalls[pitfalls.length - 1];
      const merged = `${last} ${tail}`.trim();
      if (textPassesBehaviorAxisToneGateV1(merged)) {
        pitfalls[pitfalls.length - 1] = trimMergedFixed(merged, MAX_PITFALL_MERGED_CHARS_V1);
        applied.v1 = true;
      }
    }
    if (decisions.length > 0) {
      const dline = DECISION_SHIFT_LINE_V1[axis];
      const lastD = decisions[decisions.length - 1];
      const mergedD = `${lastD} ${dline}`.trim();
      if (textPassesBehaviorAxisToneGateV1(mergedD)) {
        decisions[decisions.length - 1] = trimMergedFixed(mergedD, MAX_DECISION_MERGED_CHARS_V1);
        applied.v1 = true;
      }
    }
  }

  if (input.flags.behaviorAxisConflictV1) {
    const line = getStarAxisConflictLineV1(input.mainStars, axis);
    if (line && pitfalls.length > 0) {
      const last = pitfalls[pitfalls.length - 1];
      const merged = `${last} ${line}`.trim();
      if (textPassesBehaviorAxisToneGateV1(merged)) {
        pitfalls[pitfalls.length - 1] = trimMergedFixed(merged, MAX_PITFALL_MERGED_CHARS_V1);
        applied.conflictV1 = true;
      }
    }
  }

  let behaviorLoopLine: string | undefined;
  if (input.flags.behaviorAxisLoopV1) {
    const loop = getLoopLineV1(p);
    if (loop?.trim() && textPassesBehaviorAxisToneGateV1(loop)) {
      behaviorLoopLine = loop.trim();
      applied.loopV1 = true;
    }
  }

  return {
    decisionPatterns: decisions,
    pitfalls,
    behaviorLoopLine,
    behaviorAxis: axis,
    behaviorAxisApplied: applied,
  };
}
