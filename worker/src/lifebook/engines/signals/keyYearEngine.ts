/**
 * P2: 關鍵年份／小限落宮 產出 KeyYearFinding[]。
 * 第一版：由 minorFortuneByPalace 或 yearlyHoroscope + overlap 標記地雷／機會／震盪宮。
 */

import type { KeyYearFinding } from "../../lifebookFindings.js";

export interface MinorFortuneEntry {
  palace: string;
  year?: number | null;
  nominalAge?: number | null;
  note?: string | null;
}

const MINE_KEYWORDS = ["地雷", "避開", "保守"];
const WEALTH_KEYWORDS = ["機會", "積極", "把握"];
const SHOCK_KEYWORDS = ["吉凶", "震盪", "謹慎"];

function inferSignal(note: string | undefined): "mine" | "wealth" | "shock" {
  if (!note) return "shock";
  const n = note.trim();
  if (MINE_KEYWORDS.some((k) => n.includes(k))) return "mine";
  if (WEALTH_KEYWORDS.some((k) => n.includes(k))) return "wealth";
  if (SHOCK_KEYWORDS.some((k) => n.includes(k))) return "shock";
  return "shock";
}

/**
 * 從 minorFortuneByPalace（各宮小限首次年份 + note）產出 KeyYearFinding[]。
 */
export function runKeyYearFromMinorFortune(
  minorFortuneByPalace: MinorFortuneEntry[] | undefined,
  birthYear: number | undefined
): KeyYearFinding[] {
  const out: KeyYearFinding[] = [];
  if (!Array.isArray(minorFortuneByPalace)) return out;
  const baseYear = birthYear ?? new Date().getFullYear();

  for (const entry of minorFortuneByPalace) {
    const year = entry.year ?? (entry.nominalAge != null ? baseYear + entry.nominalAge : null);
    const age = entry.nominalAge ?? (year != null && birthYear != null ? year - birthYear : undefined);
    if (year == null) continue;
    const palace = entry.palace?.trim() ? (entry.palace.endsWith("宮") ? entry.palace : entry.palace + "宮") : "";
    if (!palace) continue;
    const signal = inferSignal(entry.note ?? undefined);
    const label: KeyYearFinding["label"] = signal === "wealth" ? "opportunity" : signal === "mine" ? "mine" : "shock";
    const narrative = entry.note ?? (signal === "mine" ? "該年小限落此宮，宜保守" : signal === "wealth" ? "該年小限落此宮，可把握機會" : "該年小限落此宮，吉凶並見");
    const advice = signal === "mine" ? "避免重大決策" : signal === "wealth" ? "可積極布局" : "謹慎決策";
    const score = signal === "shock" ? 2 : signal === "mine" ? 2 : 1;
    out.push({ year, age: age ?? 0, palace, label, signal, narrative, advice, score });
  }
  return out;
}
