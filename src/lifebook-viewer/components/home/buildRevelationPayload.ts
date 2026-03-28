import type { HomeSummary, RevelationContent } from "./types";

export interface RevelationRequestInput {
  source: "node" | "month" | "fog";
  nodeId?: string;
  monthId?: string;
}

function monthKindLabel(kind: "alert" | "wealth" | "career" | "love"): string {
  if (kind === "alert") return "風險警示";
  if (kind === "wealth") return "資源與財務";
  if (kind === "career") return "事業推進";
  return "關係與連結";
}

function monthActionAdvice(kind: "alert" | "wealth" | "career" | "love", severity: "high" | "medium" | "low"): string {
  if (kind === "alert") {
    return severity === "high"
      ? "把高風險決策延後，先做減壓與節奏重整。"
      : "先做風險盤點，再推進可控項目。";
  }
  if (kind === "wealth") return "聚焦現金流與可量化成果，避免分心投入。";
  if (kind === "career") return "把目標縮成 1-2 個可執行里程碑，逐步驗證。";
  return "先澄清角色邊界與期待，再談承諾。";
}

function monthConsequence(kind: "alert" | "wealth" | "career" | "love"): string {
  if (kind === "alert") return "若忽略警訊，容易引發連鎖失誤與身心透支。";
  if (kind === "wealth") return "若未聚焦收斂，機會成本會快速放大。";
  if (kind === "career") return "若缺乏節奏管理，推進效率會被反覆中斷。";
  return "若不先校準關係節奏，容易出現誤判與摩擦。";
}

function buildMonthRevelation(summary: HomeSummary, monthId: string): RevelationContent | null {
  for (const node of summary.timeline) {
    const m = node.monthPreview.find((x) => x.id === monthId);
    if (!m) continue;
    const why = `${m.label}（${m.month}）屬於「${monthKindLabel(m.kind)}」訊號，當前摘要為：${m.summary}`;
    const how = monthActionAdvice(m.kind, m.severity);
    const doom = monthConsequence(m.kind);
    return {
      kind: "month",
      title: `${m.label} 行動啟示`,
      subtitle: `${m.severity.toUpperCase()} · ${monthKindLabel(m.kind)}`,
      palaceLabel: node.label,
      prophecy: why,
      logicRows: [
        { label: "為什麼", value: why },
        { label: "要怎麼做", value: how },
        { label: "如果不做會怎樣", value: doom },
      ],
      doomSummary: doom,
      ctaLabel: "查看完整月份策略",
    };
  }
  return null;
}

/**
 * 將首頁互動轉譯為統一啟示 payload，避免在 UI 現場拼內容。
 */
export function buildRevelationPayloadFromAction(
  summary: HomeSummary,
  input: RevelationRequestInput
): RevelationContent | null {
  if (input.monthId && summary.revelationsByMonthId?.[input.monthId]) {
    return summary.revelationsByMonthId[input.monthId];
  }
  if (input.monthId) {
    const generated = buildMonthRevelation(summary, input.monthId);
    if (generated) return generated;
  }
  if (input.nodeId && summary.revelationsByNodeId[input.nodeId]) {
    return summary.revelationsByNodeId[input.nodeId];
  }
  return null;
}

