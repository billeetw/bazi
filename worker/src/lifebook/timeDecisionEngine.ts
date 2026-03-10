/**
 * 時間模組決策引擎：依小限宮位 + 風險等級，產出「適合／不適合」的決策事件建議。
 * 僅輸出 event id 與 theme，文案由 eventLabels / 命書模板組裝；AI 渲染版不顯示 riskLevel／權重數字。
 */

export type DecisionEventId =
  | "start_business"
  | "change_job"
  | "move_house"
  | "invest"
  | "marry_or_commit"
  | "divorce_or_breakup"
  | "have_child"
  | "study_or_retrain"
  | "rest_and_reset";

export type RiskMode = "open" | "neutral" | "defensive";

/** riskLevel 1-2: 開拓期；3: 盤整期；4-5: 防禦期 */
export function getRiskMode(riskLevel: number): RiskMode {
  if (riskLevel >= 4) return "defensive";
  if (riskLevel === 3) return "neutral";
  return "open";
}

export interface DecisionMatrixConfig {
  palaceEventWeights: Record<string, Partial<Record<DecisionEventId, number>>>;
  eventLabels: Record<string, string>;
  palaceThemes: Record<string, string>;
}

export interface DecisionAdviceInput {
  palace: string;
  riskLevel: 1 | 2 | 3 | 4 | 5;
  matrix: DecisionMatrixConfig["palaceEventWeights"];
  /** 若提供，會填入 output.theme */
  palaceThemes?: Record<string, string>;
}

export interface DecisionAdviceOutput {
  theme: string;
  recommended: DecisionEventId[];
  avoid: DecisionEventId[];
}

const HIGH_COMMITMENT_EVENTS: DecisionEventId[] = [
  "start_business",
  "change_job",
  "invest",
  "move_house",
  "marry_or_commit",
  "divorce_or_breakup",
  "have_child",
];

const LOW_RISK_EVENTS: DecisionEventId[] = ["rest_and_reset", "study_or_retrain"];

/** 宮位名正規化：兄弟宮→兄弟、命宮→命宮 */
function normPalace(p: string): string {
  if (!p) return "";
  const s = (p || "").trim().replace(/宮$/, "");
  return s === "命" ? "命宮" : s || p;
}

/**
 * 依宮位 + riskLevel + 權重矩陣，產出建議／避免的決策事件 id。
 * 不產出文案，僅 id，供後續用 eventLabels 對應。
 */
export function getDecisionAdvice(input: DecisionAdviceInput): DecisionAdviceOutput {
  const { palace, riskLevel, matrix, palaceThemes } = input;
  const palaceNorm = normPalace(palace);
  const weights = matrix[palaceNorm];
  const theme = palaceThemes?.[palaceNorm] ?? "";

  if (!weights || typeof weights !== "object") {
    return { theme, recommended: [], avoid: [] };
  }

  const mode = getRiskMode(riskLevel);
  const entries = Object.entries(weights) as [DecisionEventId, number][];
  const byWeight = entries
    .filter(([, w]) => typeof w === "number")
    .sort((a, b) => (b[1] as number) - (a[1] as number));

  let recommended: DecisionEventId[] = [];
  let avoid: DecisionEventId[] = [];

  if (mode === "open") {
    recommended = byWeight.filter(([, w]) => (w as number) >= 3).map(([id]) => id);
    if (recommended.length > 4) recommended = recommended.slice(0, 4);
    const restId = "rest_and_reset" as DecisionEventId;
    if (recommended.includes(restId)) avoid = []; // 開拓期不特別避免
    else avoid = [];
  } else if (mode === "neutral") {
    recommended = byWeight.filter(([, w]) => (w as number) >= 2).map(([id]) => id);
    if (recommended.length > 4) recommended = recommended.slice(0, 4);
    avoid = byWeight.filter(([, w]) => (w as number) <= 1).map(([id]) => id);
    avoid = avoid.filter((id) => HIGH_COMMITMENT_EVENTS.includes(id)).slice(0, 3);
  } else {
    // defensive
    recommended = byWeight
      .filter(([id, w]) => LOW_RISK_EVENTS.includes(id) && (w as number) >= 2)
      .map(([id]) => id);
    if (recommended.length > 3) recommended = recommended.slice(0, 3);
    if (recommended.length === 0) recommended = ["rest_and_reset", "study_or_retrain"];
    avoid = HIGH_COMMITMENT_EVENTS.filter((id) => {
      const w = weights[id];
      return typeof w === "number" && w >= 1;
    });
    if (avoid.length > 5) avoid = avoid.slice(0, 5);
  }

  return { theme, recommended, avoid };
}

export interface XiaoXianYearItem {
  year?: number | null;
  nominalAge?: number | null;
  palace?: string;
  riskLevel?: 1 | 2 | 3 | 4 | 5;
  tag?: "shock" | "mine" | "wealth";
}

export interface YearDecisionSummary {
  year: number;
  age: number;
  palace: string;
  theme: string;
  recommendedEvents: { id: string; label: string }[];
  avoidEvents: { id: string; label: string }[];
}

/**
 * 從單年小限資料 + 決策矩陣，組出該年的決策摘要（含 event id 與 label）。
 */
export function buildYearDecisionSummary(
  item: XiaoXianYearItem,
  matrix: DecisionMatrixConfig
): YearDecisionSummary {
  const palaceNorm = normPalace(item.palace ?? "");
  const theme = matrix.palaceThemes?.[palaceNorm] ?? "人生節奏";
  const riskLevel = (item.riskLevel ?? deriveRiskLevelFromTag(item.tag)) as 1 | 2 | 3 | 4 | 5;
  const advice = getDecisionAdvice({
    palace: item.palace ?? palaceNorm,
    riskLevel,
    matrix: matrix.palaceEventWeights,
    palaceThemes: matrix.palaceThemes,
  });

  const recommendedEvents = (advice.recommended || []).map((id) => ({
    id,
    label: matrix.eventLabels?.[id] ?? id,
  }));
  const avoidEvents = (advice.avoid || []).map((id) => ({
    id,
    label: matrix.eventLabels?.[id] ?? id,
  }));

  return {
    year: typeof item.year === "number" ? item.year : 0,
    age: typeof item.nominalAge === "number" ? item.nominalAge : 0,
    palace: palaceNorm ? (palaceNorm === "命宮" ? "命宮" : palaceNorm + "宮") : "",
    theme: advice.theme || theme,
    recommendedEvents,
    avoidEvents,
  };
}

function deriveRiskLevelFromTag(tag?: string): 1 | 2 | 3 | 4 | 5 {
  if (tag === "mine") return 5;
  if (tag === "shock") return 4;
  if (tag === "wealth") return 2;
  return 3;
}

/**
 * 組出「今年」決策摘要區塊文字（給 s16 yearDecisionSummaryBlock）。
 * 語氣為建議、不顯示 riskLevel。
 */
export function formatYearDecisionSummaryBlock(summary: YearDecisionSummary): string {
  const lines: string[] = [];
  lines.push("今年適合的行動：");
  if (summary.recommendedEvents.length > 0) {
    summary.recommendedEvents.forEach((e) => lines.push("- " + e.label));
  } else {
    lines.push("- （依流年與小限，今年可先觀望再動）");
  }
  lines.push("");
  lines.push("今年不建議大動作：");
  if (summary.avoidEvents.length > 0) {
    summary.avoidEvents.forEach((e) => lines.push("- " + e.label));
  } else {
    lines.push("- （無特別需避開的類型）");
  }
  return lines.join("\n");
}

/**
 * 組出小限時間軸文字（給 s15a xiaoXianDecisionTimeline）。
 * 每行：年份（歲數） 宮位、主題、適合、避免。
 */
export function formatXiaoXianDecisionTimeline(summaries: YearDecisionSummary[]): string {
  return summaries
    .map((s) => {
      const head = `${s.year}（${s.age}歲） ${s.palace}`;
      const themeLine = `主題：${s.theme}`;
      const recLine =
        s.recommendedEvents.length > 0
          ? "適合：" + s.recommendedEvents.map((e) => e.label).join("、")
          : "適合：觀望與累積";
      const avoidLine =
        s.avoidEvents.length > 0
          ? "避免：" + s.avoidEvents.map((e) => e.label).join("、")
          : "避免：無特別";
      return [head, themeLine, recLine, avoidLine].join("\n");
    })
    .join("\n\n");
}

/** 驗證 decisionMatrix：12 宮、event id 在 eventLabels、defensive 時 avoid 非空 */
export function validateDecisionMatrix(matrix: DecisionMatrixConfig): { ok: boolean; errors: string[] } {
  const errors: string[] = [];
  const PALACES = [
    "命宮", "兄弟", "夫妻", "子女", "財帛", "疾厄", "遷移", "僕役", "官祿", "田宅", "福德", "父母",
  ];
  const eventIds = new Set(Object.keys(matrix.eventLabels ?? {}));

  if (!matrix.palaceEventWeights || typeof matrix.palaceEventWeights !== "object") {
    errors.push("palaceEventWeights 缺失或非物件");
    return { ok: false, errors };
  }

  for (const p of PALACES) {
    if (!(p in matrix.palaceEventWeights)) {
      errors.push(`palaceEventWeights 缺少宮位：${p}`);
    } else {
      const w = matrix.palaceEventWeights[p];
      if (w && typeof w === "object") {
        for (const id of Object.keys(w)) {
          if (!eventIds.has(id)) {
            errors.push(`宮位 ${p} 使用未在 eventLabels 定義的 id：${id}`);
          }
        }
      }
    }
  }

  // defensive 時至少一個 avoid
  const testOut = getDecisionAdvice({
    palace: "官祿",
    riskLevel: 5,
    matrix: matrix.palaceEventWeights,
  });
  if (testOut.avoid.length === 0) {
    errors.push("riskLevel 4–5（防禦期）時，engine 應至少回傳一項 avoid");
  }

  return { ok: errors.length === 0, errors };
}
