/**
 * 五行雷達圖（命書 Viewer 內嵌，不依賴主站 app.js）
 * 資料格式：{ 木?, 火?, 土?, 金?, 水? } 數值
 */

import React from "react";

const ORDER = ["金", "木", "水", "火", "土"] as const;
const LABELS: Record<string, string> = { 木: "木", 火: "火", 土: "土", 金: "金", 水: "水" };

function normalize(wx: Record<string, unknown> | null | undefined): { order: typeof ORDER; raw: Record<string, number>; normalized: Record<string, number> } {
  const raw: Record<string, number> = {};
  ORDER.forEach((k) => (raw[k] = Math.max(0, Number(wx?.[k] ?? 0))));
  const max = Math.max(0, ...ORDER.map((k) => raw[k]));
  const normalized: Record<string, number> = {};
  ORDER.forEach((k) => (normalized[k] = max > 0 ? (raw[k] / max) * 100 : 0));
  return { order: ORDER, raw, normalized };
}

export interface WuxingRadarProps {
  /** 五行數值，例：chart_json.bazi.wuxing.strategic 或 .surface */
  wx: Record<string, unknown> | null | undefined;
  size?: number;
  className?: string;
}

export function WuxingRadar({ wx, size = 220, className = "" }: WuxingRadarProps) {
  if (!wx || typeof wx !== "object") return null;
  const { order, raw, normalized } = normalize(wx);
  const cx = size / 2;
  const cy = size / 2;
  const r = (size * 0.71) / 2;
  const startAngle = -Math.PI / 2;
  const step = (Math.PI * 2) / order.length;

  function polar(angle: number, radius: number) {
    return { x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
  }
  function pointsForLevel(levelPct: number) {
    return order
      .map((_, i) => {
        const a = startAngle + step * i;
        const p = polar(a, (r * levelPct) / 100);
        return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      })
      .join(" ");
  }

  const gridLevels = [20, 40, 60, 80, 100];
  const dataPoints = order
    .map((k, i) => {
      const a = startAngle + step * i;
      const pct = Math.max(0, Math.min(100, Number(normalized[k] ?? 0)));
      const p = polar(a, (r * pct) / 100);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className={className} style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" role="img" aria-label="五行雷達圖">
        {gridLevels.map((lvl) => {
          const pts = order
            .map((_, i) => polar(startAngle + step * i, (r * lvl) / 100))
            .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
            .join(" ");
          return <polygon key={lvl} points={pts} fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth={1} />;
        })}
        {order.map((_, i) => {
          const a = startAngle + step * i;
          const p = polar(a, r);
          return (
            <line key={`axis-${i}`} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(148,163,184,0.18)" strokeWidth={1} />
          );
        })}
        <polygon
          points={dataPoints}
          fill="rgba(251,191,36,0.12)"
          stroke="rgba(251,191,36,0.75)"
          strokeWidth={2}
        />
        {order.map((k, i) => {
          const a = startAngle + step * i;
          const p = polar(a, r + 18);
          const v = Number(raw[k] ?? 0);
          const label = LABELS[k] ?? k;
          return (
            <g key={k}>
              <text x={p.x} y={p.y} fill="rgba(226,232,240,0.92)" fontSize={11} fontWeight={800} textAnchor="middle" dominantBaseline="middle">
                {label}
              </text>
              <text x={p.x} y={p.y + 12} fill="rgba(148,163,184,0.9)" fontSize={10} textAnchor="middle" dominantBaseline="middle">
                {Number.isFinite(v) ? v.toFixed(1) : "0.0"}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
