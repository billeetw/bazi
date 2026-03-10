/**
 * 行動建議卡片（可帶十神／五行標籤）
 */

import React from "react";
import { TEN_GOD_THEMES, WUXING_STYLE } from "../constants";

interface ActionCardProps {
  tenGod?: string | null;
  wuxing?: string | null;
  advice: string;
}

export const ActionCard: React.FC<ActionCardProps> = ({
  tenGod,
  wuxing,
  advice,
}) => {
  const tenGodTheme = tenGod ? TEN_GOD_THEMES[tenGod] : undefined;
  const wuxingStyle = wuxing ? WUXING_STYLE[wuxing] : undefined;

  return (
    <div className="lifebook-action-card group bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-300 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base opacity-80" aria-hidden>💡</span>
        <div className="flex flex-wrap items-center gap-2">
          {tenGod != null && tenGod !== "" && (
            <span
              className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border border-cyan-400/40 text-cyan-300/90 bg-cyan-500/10"
              style={tenGodTheme ? { borderColor: `${tenGodTheme.color}40`, color: tenGodTheme.color } : undefined}
            >
              {tenGod}
            </span>
          )}
          {wuxing != null && wuxing !== "" && (
            <span
              className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded border flex-shrink-0"
              style={
                wuxingStyle
                  ? { borderColor: `${wuxingStyle.border}60`, color: wuxingStyle.text, backgroundColor: `${wuxingStyle.bg}40` }
                  : { borderColor: "rgba(191,191,191,0.4)", color: "#9ca3af" }
              }
            >
              {wuxing}
            </span>
          )}
        </div>
      </div>
      <p className="lifebook-action-text text-sm text-slate-300 leading-relaxed group-hover:text-white transition-colors">{advice}</p>
    </div>
  );
};
