/**
 * 宮位／星曜 canonical 單一入口：命書與過濾邏輯統一用「宮位＝中文＋宮」「星曜＝中文名」。
 */

import { PALACE_ID_TO_NAME, PALACE_NAME_ZH_TO_ID, STAR_ID_TO_NAME, STAR_NAME_ZH_TO_ID } from "./schema.js";

/** 宮位 canonical：命宮、財帛宮、兄弟宮…（id 或 中文名 皆可入，出中文＋宮） */
export function toPalaceCanonical(idOrName: string): string {
  const x = (idOrName ?? "").trim();
  if (!x) return "";
  const byId = (PALACE_ID_TO_NAME as Record<string, string>)[x];
  if (byId) {
    if (byId === "命宮" || byId.endsWith("宮")) return byId;
    return byId + "宮";
  }
  if (x === "命") return "命宮";
  if (x.endsWith("宮")) return x;
  const byName = (PALACE_NAME_ZH_TO_ID as Record<string, string>)[x] ?? (PALACE_NAME_ZH_TO_ID as Record<string, string>)[x + "宮"];
  if (byName) {
    const name = (PALACE_ID_TO_NAME as Record<string, string>)[byName];
    if (name?.endsWith("宮")) return name;
    return name ? name + "宮" : x + "宮";
  }
  return x + "宮";
}

/** 星曜 canonical：紫微、天機…（id 或 中文名 皆可入，出中文名） */
export function toStarName(idOrName: string): string {
  const x = (idOrName ?? "").trim();
  if (!x) return "";
  const byId = (STAR_ID_TO_NAME as Record<string, string>)[x];
  if (byId) return byId;
  if ((STAR_NAME_ZH_TO_ID as Record<string, string>)[x]) return x;
  return x;
}
