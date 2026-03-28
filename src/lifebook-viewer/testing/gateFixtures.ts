/**
 * Gate 矩陣驗收用固定資料（整包最小 LifeBookViewerState）。
 * 含命宮／官祿／財帛／夫妻／疾厄最小章節，供模板預覽與 gate 同測。
 *
 * URL 範例：
 *   ?fixture=open
 *   ?fixture=partial&palace=guanlu
 *   ?fixture=locked&palace=caibo
 *   ?fixture=partial&palace=qianyi
 *
 * 焦點參數：`palace` | `focus` | `section`（見 parseGateFixtureFocusFromParams）。
 */

import type { LifeBookMeta, LifeBookUserSection, LifeBookViewerState } from "../types";
import type { PalacePreviewFocus } from "../constants";
import { PREVIEW_FOCUS_TO_SECTION_KEY } from "../constants";

export const GATE_FIXTURE_IDS = ["open", "partial", "teaser", "locked"] as const;
export type GateFixtureId = (typeof GATE_FIXTURE_IDS)[number];

function minimalSection(section_key: string, title: string): LifeBookUserSection {
  return {
    section_key,
    title,
    importance_level: "medium",
    structure_analysis: "【驗收 fixture】結構敘述固定句，用於重現 gate。",
    behavior_pattern: "【驗收 fixture】行為模式固定句。",
    blind_spots: "【驗收 fixture】盲區提示。",
    strategic_advice: "【驗收 fixture】策略建議。",
  };
}

/**
 * 依 `resolveGateContract` 規則組 meta（擴充欄位與 API 一致）。
 * `focus` 決定 partial 的 available_sections、locked 的 section_key。
 */
function metaForGateScenario(id: GateFixtureId, focus: PalacePreviewFocus): Record<string, unknown> {
  const focusKey = PREVIEW_FOCUS_TO_SECTION_KEY[focus];

  switch (id) {
    case "open":
      return { plan_tier: "pro" };
    case "partial":
      return {
        plan_tier: "free",
        available_sections: [focusKey],
      };
    case "teaser":
      return { plan_tier: "free" };
    case "locked":
      return {
        plan_tier: "free",
        locked_sections: [
          {
            section_key: focusKey,
            is_locked: true,
            lock_reason: "【驗收 fixture】此章節鎖定演示。",
          },
        ],
      };
  }
}

/**
 * 四組 gate 最小 `LifeBookViewerState`：含預覽十二宮（十二課題 section_key）。
 */
export function buildGateFixtureState(id: GateFixtureId, focus: PalacePreviewFocus = "ming"): LifeBookViewerState {
  return {
    meta: {
      schema_version: "1.0",
      client_name: "Gate fixture",
      ...metaForGateScenario(id, focus),
    } as LifeBookMeta,
    sections: {
      s02: minimalSection("s02", "命宮綜合分析"),
      s08: minimalSection("s08", "官祿宮綜合分析"),
      s10: minimalSection("s10", "財帛宮綜合分析"),
      s13: minimalSection("s13", "夫妻宮綜合分析"),
      s11: minimalSection("s11", "疾厄宮綜合分析"),
      s12: minimalSection("s12", "遷移宮綜合分析"),
      s01: minimalSection("s01", "福德宮綜合分析"),
      s09: minimalSection("s09", "田宅宮綜合分析"),
      s05: minimalSection("s05", "父母宮綜合分析"),
      s06: minimalSection("s06", "兄弟宮綜合分析"),
      s07: minimalSection("s07", "僕役宮綜合分析"),
      s14: minimalSection("s14", "子女宮綜合分析"),
    },
    weight_analysis: null,
    chart_json: null,
  };
}

export function isGateFixtureId(s: string): s is GateFixtureId {
  return (GATE_FIXTURE_IDS as readonly string[]).includes(s);
}

/**
 * 解析「要驗哪一宮」：支援 palace / focus / section。
 * 未指定時回傳 `null`（由呼叫端決定是否預設命宮）。
 */
export function parseGateFixtureFocusFromParams(params: URLSearchParams): PalacePreviewFocus | null {
  const raw = (params.get("palace") ?? params.get("focus") ?? params.get("section"))?.trim() ?? "";
  if (!raw) return null;
  const v = raw.toLowerCase();
  if (
    v === "guanlu" ||
    v === "s08" ||
    v === "career" ||
    v === "gl" ||
    v === "官祿" ||
    v === "官祿宮"
  ) {
    return "guanlu";
  }
  if (v === "caibo" || v === "s10" || v === "財帛" || v === "財帛宮") {
    return "caibo";
  }
  if (v === "fuqi" || v === "s13" || v === "夫妻" || v === "夫妻宮") {
    return "fuqi";
  }
  if (v === "jie" || v === "s11" || v === "疾厄" || v === "疾厄宮") {
    return "jie";
  }
  if (
    v === "qianyi" ||
    v === "s12" ||
    v === "遷移" ||
    v === "遷移宮" ||
    v === "qy"
  ) {
    return "qianyi";
  }
  if (v === "fude" || v === "s01" || v === "福德" || v === "福德宮") {
    return "fude";
  }
  if (
    v === "tianzhai" ||
    v === "s09" ||
    v === "田宅" ||
    v === "田宅宮" ||
    v === "tz"
  ) {
    return "tianzhai";
  }
  if (v === "fumu" || v === "s05" || v === "父母" || v === "父母宮") {
    return "fumu";
  }
  if (v === "xiongdi" || v === "s06" || v === "兄弟" || v === "兄弟宮" || v === "xd") {
    return "xiongdi";
  }
  if (
    v === "nuppu" ||
    v === "s07" ||
    v === "僕役" ||
    v === "僕役宮" ||
    v === "奴僕" ||
    v === "奴僕宮"
  ) {
    return "nuppu";
  }
  if (v === "zinv" || v === "s14" || v === "子女" || v === "子女宮") {
    return "zinv";
  }
  if (v === "ming" || v === "s02" || v === "命宮" || v === "mz") {
    return "ming";
  }
  return null;
}

/**
 * 從 `window.location.search` 解析 `fixture` / 焦點宮位。
 */
export function parseGateFixtureFromSearch(search: string): {
  id: GateFixtureId;
  focus: PalacePreviewFocus;
} | null {
  let params: URLSearchParams;
  try {
    params = new URLSearchParams(search.startsWith("?") ? search : `?${search}`);
  } catch {
    return null;
  }
  const raw = params.get("fixture")?.trim().toLowerCase();
  if (!raw || !isGateFixtureId(raw)) return null;
  return { id: raw, focus: parseGateFixtureFocusFromParams(params) ?? "ming" };
}
