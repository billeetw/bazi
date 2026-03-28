/**
 * S22／S23 技術版／命書骨架：將結構線／轉化流格式化為可讀段落
 * 系統列印用語與內文區隔：內文避免「卡關、流失、偏弱」等空話；此處標籤用生活化中文輔助判讀。
 */

import type { StructureLine, TransformationFlow } from "./types.js";

/** 內部演算法標籤 → 畫面上給專家看的短標（非對使用者敘事本體） */
const BALANCE_LABEL: Record<StructureLine["balanceType"], string> = {
  balanced: "平衡組合",
  weak: "整體底子偏薄",
  biased: "兩端強弱差距大",
};

const FLOW_LABEL: Record<TransformationFlow["flowType"], string> = {
  smooth: "轉化較順",
  stuck: "努力與成果比例常對不起來",
  leaking: "有進有出、較難堆成累積",
  blocked: "投入難變成看得見的結果",
};

export function formatStructureLinesForTechnical(lines: StructureLine[]): string {
  if (!lines.length) return "（無結構線資料）";
  const parts = lines.map((l) => {
    const bt = BALANCE_LABEL[l.balanceType] ?? l.balanceType;
    const refLine = `（參考：${l.palaceA} ${l.scoreA}／5　${l.palaceB} ${l.scoreB}／5　綜合約 ${l.totalScore.toFixed(1)}／5　落差 ${l.gapScore.toFixed(1)}　｜ ${bt}）`;
    const head = [`━━━━━━━━━━━━━━━━`, `【${l.title}】${l.subtitle}`];
    head.push(l.hitLine ? `「${l.hitLine}」${refLine}` : refLine);
    return [...head, ``, l.summary, ``, l.insight].join("\n");
  });
  return parts.join("\n\n");
}

export function formatTransformationFlowsForTechnical(flows: TransformationFlow[]): string {
  if (!flows.length) return "（無轉化流資料）";
  const parts = flows.map((f) => {
    const ft = FLOW_LABEL[f.flowType] ?? f.flowType;
    const ratePct = Math.round(f.conversionRate * 100);
    const over = f.isOverperforming ? "（承接面目前較有餘裕）" : "";
    const refLine = `（參考：${f.from} → ${f.to}　轉化參考值約 ${ratePct}%　｜ ${ft}${over}）`;
    const head = [`━━━━━━━━━━━━━━━━`, `【${f.title}】${f.subtitle}`];
    if (f.hitLine) {
      head.push(`「${f.hitLine}」`);
      head.push(refLine);
    } else {
      head.push(refLine);
    }
    return [...head, ``, f.summary, ``, f.advice].join("\n");
  });
  return parts.join("\n\n");
}
