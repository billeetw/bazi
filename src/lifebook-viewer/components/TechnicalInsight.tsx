/**
 * 技術依據：事件層／關係層／能量層三行呈現（MVP）
 */

import React from "react";
import type { StarInfo } from "../constants";
import { TEN_GOD_THEMES, WUXING_STYLE } from "../constants";

interface TechnicalInsightProps {
  stars: StarInfo[];
  tenGod: string | null;
  wuxing: string | null;
}

export const TechnicalInsight: React.FC<TechnicalInsightProps> = ({
  stars,
  tenGod,
  wuxing,
}) => {
  const tenGodTheme = tenGod ? TEN_GOD_THEMES[tenGod] : undefined;
  const wuxingStyle = wuxing ? WUXING_STYLE[wuxing] : undefined;

  return (
    <div className="lifebook-tech-container font-mono text-sm bg-black/50 border border-white/5 rounded-lg overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
        <div className="bg-black/40 p-4 border-l border-y border-white/5">
          <div className="text-[10px] text-blue-500/80 mb-2 uppercase tracking-widest opacity-80">Layer 01 · Event / Stars</div>
          {stars.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {stars.map((s) => (
                <span key={s.name} className="text-xs px-2 py-0.5 rounded bg-slate-700/50 text-slate-300">
                  {s.name}
                  {s.transform ? `·化${s.transform}` : ""}
                </span>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-500">本宮僅以敘事推論，暫無星曜細節。</div>
          )}
        </div>

        <div className="bg-black/60 p-4 border border-white/10 relative z-10 shadow-xl">
          <div className="text-[10px] text-purple-400/80 mb-2 uppercase tracking-widest opacity-80">Layer 02 · 10-Gods</div>
          {tenGod ? (
            <div className="space-y-1">
              <span
                className="inline-block text-xs px-2 py-0.5 rounded border text-slate-200"
                style={{ borderColor: tenGodTheme?.color ?? "#888", color: tenGodTheme?.color ?? "#ccc" }}
              >
                {tenGod}
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                {tenGodTheme?.description ?? "描述你在此領域與他人的互動角色。"}
              </p>
            </div>
          ) : (
            <div className="text-xs text-slate-500">本宮未帶入十神資料。</div>
          )}
        </div>

        <div className="bg-black/40 p-4 border-r border-y border-white/5">
          <div className="text-[10px] text-emerald-500/80 mb-2 uppercase tracking-widest opacity-80">Layer 03 · Wuxing</div>
          {wuxing ? (
            <div
              className="inline-flex items-center gap-2 px-2 py-1 rounded border text-xs text-slate-300"
              style={{
                borderColor: wuxingStyle?.border ?? "#555",
                color: wuxingStyle?.text ?? "#aaa",
              }}
            >
              <span className="font-medium">{wuxing}</span>
              <span className="opacity-80">此宮五行代表該領域手感與順逆。</span>
            </div>
          ) : (
            <div className="text-xs text-slate-500">本宮未帶入五行資料。</div>
          )}
        </div>
      </div>
      <div className="text-[9px] text-slate-600 text-right font-mono px-4 py-1.5 border-t border-white/5">
        SYSTEM_ID: DEEP_INSIGHT_CORE_V1.0
      </div>
    </div>
  );
};
