/**
 * 命盤與五行：有 chart_json.bazi.wuxing 時內嵌五行雷達圖；否則以 iframe 嵌入主站示範頁。
 */

import React from "react";
import { LIFEBOOK_DEMO_CHART_URL } from "../constants";
import { WuxingRadar } from "./WuxingRadar";

export interface ChartEmbedProps {
  /** 命書的命盤快照；含 bazi.wuxing 時顯示內嵌五行雷達圖 */
  chartJson?: Record<string, unknown> | null;
  className?: string;
}

function getWuxingFromChart(chartJson: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  const bazi = chartJson?.bazi as Record<string, unknown> | undefined;
  const wuxing = bazi?.wuxing as Record<string, unknown> | undefined;
  if (!wuxing || typeof wuxing !== "object") return null;
  const wx = (wuxing.strategic ?? wuxing.surface) as Record<string, unknown> | undefined;
  if (!wx || typeof wx !== "object") return null;
  return wx;
}

export function ChartEmbed({ chartJson, className = "" }: ChartEmbedProps) {
  const wx = getWuxingFromChart(chartJson ?? null);
  const hasRadar = wx != null && ["木", "火", "土", "金", "水"].some((k) => wx[k] != null);

  return (
    <section className={`rounded-xl border border-slate-700/50 bg-slate-800/20 p-4 ${className}`}>
      <h2 className="text-sm font-bold text-slate-400 mb-2">命盤與五行</h2>
      {hasRadar ? (
        <>
          <p className="text-sm text-slate-500 mb-3">本命書五行能量（戰略）</p>
          <WuxingRadar wx={wx} size={220} className="mx-auto" />
        </>
      ) : (
        <>
          <p className="text-sm text-slate-500 mb-3">
            此區塊會嵌入主站的紫微命盤與五行雷達圖示範頁。
          </p>
          <iframe
            src={LIFEBOOK_DEMO_CHART_URL}
            title="紫微命盤與五行雷達圖"
            className="w-full min-h-[540px] border-0 rounded-xl bg-slate-900/50"
            loading="lazy"
            sandbox="allow-scripts allow-same-origin"
          />
        </>
      )}
    </section>
  );
}
