import { HOME_PALACE_MATRIX_ORDER } from "./computePalaceMatrixHighlight";
import type { HomeSummary } from "./types";

/**
 * archive demo 已切離：React Viewer 首頁只讀 summary，
 * 不在 component 內直接讀 chart_json / sections。
 */
export const DEFAULT_HOME_SUMMARY: HomeSummary = {
  oracle: {
    anchor: "DESTINY CORE 2026",
    progressLabel: "歲月流轉 23%",
    progressPercent: 23,
    title: "關鍵推進年",
    prophecy: "今年將迎來跨界爆發機遇，若節奏失衡，代價將直接落在身心負載。",
    doItems: ["推動跨界合作", "建立標準流程", "主導新資源專案"],
    dontItems: ["孤軍奮戰", "透支睡眠", "極限施壓團隊"],
    hintText: "2026.03.24 ✧ 今日流日忌：不宜做出重大承諾",
    warningText: "絕對不要在情緒疲勞或連續熬夜後，做出職涯切換的決定。",
  },
  timeline: [
    {
      id: "y2026",
      year: 2026,
      label: "2026 · 推進",
      subtitle: "本命與流年交會",
      isCurrent: true,
      branch: "right",
      signals: ["alert", "career"],
      status: "active",
      actionTarget: "s17",
      isLocked: false,
      gate: "open",
      risk: "danger",
      symbol: "災",
      monthPreview: [
        { id: "m2026-03", month: "03", label: "農曆三月", summary: "官祿起伏", risk: "danger", severity: "high", kind: "alert", actionTarget: "s19" },
        { id: "m2026-04", month: "04", label: "農曆四月", summary: "貴人暗助", risk: "neutral", severity: "medium", kind: "career", actionTarget: "s19" },
        { id: "m2026-05", month: "05", label: "農曆五月", summary: "資金水位", risk: "wealth", severity: "medium", kind: "wealth", actionTarget: "s19" },
      ],
    },
    {
      id: "y2027",
      year: 2027,
      label: "2027 · 盤整",
      subtitle: "下一階段配置",
      isCurrent: false,
      branch: "left",
      signals: ["wealth"],
      status: "upcoming",
      actionTarget: "s19",
      isLocked: true,
      gate: "locked",
      risk: "wealth",
      symbol: "祿",
      monthPreview: [],
    },
  ],
  cardTitle: "2026 ACTIVE",
  cardDescription: "本命與流年交會之推進年；點擊時間節點可進入下一層與啟示漏斗。",
  currentNodeId: "y2026",
  revelationsByNodeId: {
    y2026: {
      kind: "fruit-danger",
      title: "體力紅燈預警",
      subtitle: "HEALTH ALERT",
      palaceLabel: "疾厄宮 · 能量耗竭",
      starLabel: "擎羊／陀羅交沖",
      prophecy: "若執意推進高強度專案，將提高突發性健康風險。",
      doomSummary: "不解鎖完整推演，容易踩中「連續熬夜 → 決策失誤」連鎖陷阱。",
      ctaLabel: "解鎖完整健康解方",
    },
    y2027: {
      kind: "fog",
      title: "2027 軌跡仍籠罩在迷霧中",
      subtitle: "PREMIUM",
      prophecy: "解鎖後可對齊大限、流年與四化疊影，預先配置下一年度節奏。",
      ctaLabel: "解鎖 2027 完整導航",
    },
  },
  palaceMatrix: {
    order: [...HOME_PALACE_MATRIX_ORDER],
    activePalaceId: null,
    hintLine: "十二宮速覽 · 點進查看對應章節",
    source: "none",
  },
  revelationsByMonthId: {
    "m2026-03": {
      kind: "month-detail",
      title: "流月細節（示意）",
      subtitle: "MONTHLY",
      palaceLabel: "官祿宮",
      prophecy: "此月宜盤點流程、收斂承諾；重大簽約需搭配完整流年上下文。",
      ctaLabel: "解鎖全年流月",
    },
  },
};

