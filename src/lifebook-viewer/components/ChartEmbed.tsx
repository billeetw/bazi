/**
 * 命盤與五行：有 chart_json.bazi.wuxing 時顯示五行雷達圖；無資料時顯示提示，不再嵌入首頁。
 */

import React from "react";
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
        <p className="text-sm text-slate-500">
          此命書未附帶可視化五行資料，故不顯示雷達圖。
        </p>
      )}
    </section>
  );
}
