/**
 * S19 多宮融合（Synthesis）：多個宮位同時觸發時組合成一個事件描述
 * 規則：一次只輸出 1 條、依 priority 取最高、必須跨宮位才成立
 */

import type { GongGanFlow } from "../../gonggan-flows.js";

export interface SynthesisRuleMatch {
  /** 至少命中這些宮位（every 都要在 triggeredPalaces 內） */
  palaces: string[];
  /** 可選：限定四化類型 */
  transforms?: ("祿" | "權" | "科" | "忌")[];
  /** 可選：限定星曜 */
  stars?: string[];
}

export interface SynthesisRule {
  id: string;
  match: SynthesisRuleMatch;
  priority: number;
  result: {
    title: string;
    description: string;
    scenarios: string[];
    actionHint?: string;
  };
}

/** 宮位名稱正規化（與 interpretationEngine 一致） */
function normPalace(p: string): string {
  const s = (p ?? "").trim();
  if (!s) return "";
  return s.endsWith("宮") ? s : `${s}宮`;
}

/** 第一批高價值組合 */
export const SYNTHESIS_RULES: SynthesisRule[] = [
  {
    id: "relationship_affected_by_social",
    match: {
      palaces: ["夫妻宮", "兄弟宮"],
      transforms: ["忌"],
    },
    priority: 10,
    result: {
      title: "關係受外部影響",
      description: "感情或親密關係容易受到同儕、朋友或合作關係的干擾",
      scenarios: [
        "伴侶與朋友／合作之間產生衝突",
        "第三方意見影響關係判斷",
        "關係問題其實來自外部壓力",
      ],
      actionHint: "先分清楚是兩個人的問題，還是外部干擾",
    },
  },
  {
    id: "work_affects_money",
    match: {
      palaces: ["官祿宮", "財帛宮"],
    },
    priority: 9,
    result: {
      title: "工作與收入連動",
      description: "工作狀況會直接影響收入與資源流動",
      scenarios: [
        "案子與收入直接掛鉤",
        "工作變動帶動金流變化",
        "收入不穩來自工作結構",
      ],
      actionHint: "不要只看收入，要看工作結構",
    },
  },
  {
    id: "career_external_pressure",
    match: {
      palaces: ["官祿宮", "遷移宮"],
      transforms: ["忌"],
    },
    priority: 9,
    result: {
      title: "外部壓力進入工作",
      description: "市場或外部環境的壓力會直接影響工作",
      scenarios: [
        "客戶或市場需求造成壓力",
        "外部評價影響職場表現",
        "工作節奏被外界牽動",
      ],
      actionHint: "先穩內部，再應對外部",
    },
  },
  {
    id: "output_affects_career",
    match: {
      palaces: ["子女宮", "官祿宮"],
    },
    priority: 8,
    result: {
      title: "成果影響工作",
      description: "你的產出或成果會直接影響工作表現與評價",
      scenarios: [
        "作品或專案決定職場位置",
        "成果好壞影響機會",
        "需要用輸出證明自己",
      ],
      actionHint: "先把輸出做好",
    },
  },
  {
    id: "mental_affects_all",
    match: {
      palaces: ["福德宮"],
    },
    priority: 7,
    result: {
      title: "內在狀態影響整體",
      description: "你的情緒與精神狀態會放大或削弱其他面向",
      scenarios: [
        "明明事情不大，但感覺很累",
        "狀態好時一切順，狀態差時全部卡",
        "問題的核心其實在內在",
      ],
      actionHint: "先調整狀態，再處理事情",
    },
  },
];

export interface SynthesisResult {
  rule: SynthesisRule;
  result: SynthesisRule["result"];
}

function synthesisTransformsSatisfied(rule: SynthesisRule, flows: GongGanFlow[] | undefined): boolean {
  const need = rule.match.transforms;
  if (!need?.length) return true;
  if (!flows?.length) return true;

  const month = flows.filter((f) => f.layer === "month");
  for (const p of rule.match.palaces) {
    const pn = normPalace(p);
    const ok = month.some(
      (f) => normPalace(f.toPalace) === pn && need.includes(f.transform as (typeof need)[number])
    );
    if (!ok) return false;
  }
  return true;
}

/**
 * 從多個觸發宮位中選出最高優先的一條 synthesis。
 * 必須跨宮位（triggeredPalaces.length >= 2）才成立；一次只輸出 1 條。
 * 若規則帶 match.transforms 且傳入 flows，則每個 match 宮位都須有對應流月四化命中。
 */
export function runSynthesis(
  triggeredPalaces: string[],
  flows?: GongGanFlow[]
): SynthesisResult | undefined {
  const normalized = triggeredPalaces.map(normPalace).filter(Boolean);
  if (normalized.length < 2) return undefined;

  const matched = SYNTHESIS_RULES.filter((rule) => {
    if (!rule.match.palaces.every((p) => normalized.includes(normPalace(p)))) return false;
    return synthesisTransformsSatisfied(rule, flows);
  });
  if (!matched.length) return undefined;

  const byPriority = [...matched].sort((a, b) => b.priority - a.priority);
  const top = byPriority[0];
  if (!top) return undefined;

  return { rule: top, result: top.result };
}
