/**
 * 命宮「具名雙主星」專屬讀者向段落：僅在命宮且主星恰為兩顆、且 entries 有該組合鍵時輸出；否則完全跳過。
 * 與 ccl3/star-combinations（findings）分離，此檔專供長文敘事。
 */
import type { PalaceRawInput } from "./palaceNarrativeTypes.js";
import mingDualMainStarsZhTw from "../../../../content/ming-dual-main-stars-zh-TW.json";

type MingDualPayload = {
  version: number;
  sectionTitle?: string;
  entries: Record<string, { paragraphs: string[] }>;
};

const DATA = mingDualMainStarsZhTw as MingDualPayload;

/** 兩星無順序：永遠用同一個 key（zh-Hant 排序） */
export function canonicalMingDualStarKey(a: string, b: string): string {
  const x = a.trim();
  const y = b.trim();
  if (!x || !y || x === y) return "";
  const [first, second] = [x, y].sort((p, q) => p.localeCompare(q, "zh-Hant"));
  return `${first}+${second}`;
}

/**
 * 命宮雙主星專題全文；不適用時回傳 null（呼叫端勿輸出任何標題或留白）。
 */
export function getMingDualMainStarNarrativeText(raw: PalaceRawInput | undefined): string | null {
  if (!raw || raw.palace !== "命宮") return null;
  const ms = (raw.mainStars ?? []).map((s) => String(s).trim()).filter(Boolean);
  if (ms.length !== 2) return null;
  const key = canonicalMingDualStarKey(ms[0]!, ms[1]!);
  if (!key) return null;
  const entry = DATA.entries[key];
  if (!entry?.paragraphs?.length) return null;
  const paras = entry.paragraphs.map((p) => p.trim()).filter(Boolean);
  if (!paras.length) return null;
  const title = (DATA.sectionTitle ?? "【命宮雙主星專題】").trim();
  return `${title}\n\n${paras.join("\n\n")}`;
}
