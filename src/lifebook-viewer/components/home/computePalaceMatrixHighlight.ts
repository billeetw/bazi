import type { LifeBookViewerState } from "../../types";
import { PALACE_ID_ORDER, type PalaceId } from "../../themes/palaceVisualTheme";
import { resolvePalacePreset } from "../../themes/palaceThemePresets";
import type { HomePalaceMatrix, HomePalaceMatrixSource } from "./types";

/** 與 `PALACE_ID_ORDER` 一致（十二宮格順序） */
export const HOME_PALACE_MATRIX_ORDER: readonly PalaceId[] = PALACE_ID_ORDER;

const PALACE_ZH_EXACT: Record<string, PalaceId> = {
  命: "ming",
  兄弟: "xiongdi",
  父母: "fumu",
  夫妻: "fuqi",
  子女: "zinv",
  財帛: "caibo",
  疾厄: "jie",
  遷移: "qianyi",
  僕役: "nuppu",
  奴僕: "nuppu",
  交友: "nuppu",
  官祿: "guanlu",
  事業: "guanlu",
  田宅: "tianzhai",
  福德: "fude",
};

/** 長字先比對，避免「命」誤判。 */
const PALACE_ZH_SUBSTRING: [string, PalaceId][] = [
  ["兄弟", "xiongdi"],
  ["父母", "fumu"],
  ["夫妻", "fuqi"],
  ["子女", "zinv"],
  ["財帛", "caibo"],
  ["疾厄", "jie"],
  ["遷移", "qianyi"],
  ["僕役", "nuppu"],
  ["奴僕", "nuppu"],
  ["交友", "nuppu"],
  ["官祿", "guanlu"],
  ["事業", "guanlu"],
  ["田宅", "tianzhai"],
  ["福德", "fude"],
  ["命", "ming"],
];

/**
 * 將命盤／權重文字中的宮名對應到 `PalaceId`（可逐步與 worker 正規化對齊）。
 */
export function palaceNameZhToPalaceId(raw: string): PalaceId | null {
  const compact = raw.replace(/\s+/g, "");
  const stripped = compact.replace(/宮$/g, "");
  if (!stripped) return null;

  if (PALACE_ZH_EXACT[stripped]) return PALACE_ZH_EXACT[stripped];

  for (const [needle, id] of PALACE_ZH_SUBSTRING) {
    if (stripped.includes(needle) || compact.includes(needle)) return id;
  }
  return null;
}

function readChartPalaceHints(state: LifeBookViewerState): {
  monthlyPalace: string;
  liunianPalace: string;
  yearlyDestinyPalace: string;
} {
  const chart = state.chart_json as Record<string, unknown> | null | undefined;
  const s19 = state.sections?.s19;
  const tech = s19?.technical as Record<string, unknown> | undefined;
  const liunian = (tech?.liunian ?? chart?.liunian) as Record<string, unknown> | undefined;
  const yearly = (tech?.yearly_horoscope ?? chart?.yearlyHoroscope) as Record<string, unknown> | undefined;
  const monthly = (
    (chart?.ziwei as Record<string, unknown> | undefined)?.monthlyHoroscope ??
    chart?.monthlyHoroscope
  ) as Record<string, unknown> | undefined;

  return {
    monthlyPalace: String(monthly?.palace ?? "").trim(),
    liunianPalace: String(liunian?.palace ?? "").trim(),
    yearlyDestinyPalace: String(yearly?.destinyPalace ?? "").trim(),
  };
}

/**
 * Step 2：十二宮 matrix「當前引動」— 可解釋來源，無資料時仍可顯示格線但不強調。
 * 優先序：流月宮位 → 流年宮位 → 流年命宮落點 → 權重高壓宮位。
 */
export function computePalaceMatrixHighlight(state: LifeBookViewerState): HomePalaceMatrix {
  const hints = readChartPalaceHints(state);
  const risks = (state.weight_analysis?.risk_palaces ?? []).filter(Boolean).map(String);

  let activePalaceId: PalaceId | null = null;
  let source: HomePalaceMatrixSource = "none";
  let hintLine = "十二宮速覽 · 點進查看對應章節";

  const trySet = (raw: string, src: HomePalaceMatrixSource, prefix: string) => {
    const id = palaceNameZhToPalaceId(raw);
    if (!id) return false;
    activePalaceId = id;
    source = src;
    const { row } = resolvePalacePreset(id);
    hintLine = `${prefix}${row.displayNameZh}`;
    return true;
  };

  if (hints.monthlyPalace && trySet(hints.monthlyPalace, "monthly", "本月時間模組引動 · ")) {
    /* ok */
  } else if (hints.liunianPalace && trySet(hints.liunianPalace, "liunian", "流年節奏落點 · ")) {
    /* ok */
  } else if (hints.yearlyDestinyPalace && trySet(hints.yearlyDestinyPalace, "yearly", "年度視角落點 · ")) {
    /* ok */
  } else {
    for (const r of risks) {
      if (trySet(r, "weight", "命書權重提示需留意 · ")) break;
    }
  }

  return {
    order: [...HOME_PALACE_MATRIX_ORDER],
    activePalaceId,
    hintLine,
    source,
  };
}
