import type { LifeBookViewerState } from "../../types";
import type { PalaceId } from "../../themes/palaceVisualTheme";
import { resolvePalacePreset } from "../../themes/palaceThemePresets";
import { SECTION_ORDER } from "../../constants";
import type { HomeAuditCta, HomeOracleTextForCta, HomePalaceMatrix, HomeTimelineNode } from "./types";
import { computePalaceMatrixHighlight } from "./computePalaceMatrixHighlight";

/** 推薦語氣／入口（Telemetry、之後 LLM 溫度可對齊） */
export type FocusTone = "timeline" | "matrix" | "audit";

export interface ComputeFocusOptions {
  /**
   * 時間軸節點（Timeline CTA、帶 `timeline_node` 的 Viewer 語境）。
   * 有則優先於 matrix / audit。
   */
  timelineNode?: HomeTimelineNode | null;
  /**
   * 若省略，內部以 `computePalaceMatrixHighlight(state)` 推導。
   */
  matrix?: HomePalaceMatrix | null;
  /** Timeline 選宮時：matrix 無活動宮可回落 audit 建議宮 */
  auditCta?: HomeAuditCta | null;
  /** Oracle 摘要：audit CTA 與缺 matrix 活動宮時的文字分類 */
  oracleTexts?: HomeOracleTextForCta;
  /** Timeline 上與本節點同年或相鄰的節點 id（可選；不傳則只回當前節點） */
  timelineAll?: HomeTimelineNode[] | null;
}

export interface ComputedFocus {
  primaryPalaceId: PalaceId;
  /** 一句話：為何選這宮（給 CTA / 摘要） */
  reasonLine: string;
  tone: FocusTone;
  /** 相關時間軸 id（Dashboard 高亮、之後 personalization） */
  relatedTimelineNodeIds: string[];
}

function pickPrimarySection(sections: NonNullable<LifeBookViewerState["sections"]>) {
  for (const key of SECTION_ORDER) {
    if (sections[key]) return sections[key];
  }
  const first = Object.keys(sections)[0];
  return first ? sections[first] : null;
}

function classifyPalaceIdFromBlob(blob: string): PalaceId {
  const b = blob.replace(/\s+/g, "");
  if (/(關係|伴侶|夫妻|感情|情緒|對方|互動|拉扯|愛|戀|婚姻)/.test(b)) return "fuqi";
  if (/(角色|責任|工作|職場|官祿|站位|使命|職務|主管|職位)/.test(b)) return "guanlu";
  if (/(資源|金錢|財|收入|得失|安全|配置|物質|薪|獲利)/.test(b)) return "caibo";
  if (/(自我|內在|矛盾|底色|本命)/.test(b)) return "ming";
  return "ming";
}

const REASON_LINE: Partial<Record<PalaceId, string>> = {
  fuqi: "你的不安正在影響關係",
  guanlu: "角色與責任的拉扯正在消耗你",
  caibo: "資源與得失的焦慮需要被看見",
  ming: "先回到內在節奏，再做外在決策",
};

function pickPalaceForTimeline(
  node: HomeTimelineNode,
  matrix: HomePalaceMatrix | null | undefined,
  audit: HomeAuditCta | null | undefined
): PalaceId {
  const fromMatrix = matrix?.activePalaceId as PalaceId | null | undefined;
  if (fromMatrix) return fromMatrix;
  const fromAudit = audit?.palaceId as PalaceId | undefined;
  if (fromAudit) return fromAudit;
  return node.actionTarget === "s19" ? "guanlu" : "ming";
}

function relatedIdsForNode(all: HomeTimelineNode[] | null | undefined, node: HomeTimelineNode): string[] {
  if (!all || all.length === 0) return [node.id];
  const sameYear = all.filter((n) => n.year === node.year).map((n) => n.id);
  return sameYear.length > 0 ? sameYear : [node.id];
}

/** Home／Matrix／Timeline 共用：主宮 + 理由 + 相關時間節點 */
export function computeFocus(state: LifeBookViewerState, options?: ComputeFocusOptions | null): ComputedFocus | null {
  const sections = state.sections ?? {};
  if (Object.keys(sections).length === 0) return null;

  const matrix = options?.matrix ?? computePalaceMatrixHighlight(state);
  const node = options?.timelineNode ?? undefined;

  if (node) {
    const palaceId = pickPalaceForTimeline(node, matrix, options?.auditCta ?? undefined);
    const { row } = resolvePalacePreset(palaceId);
    return {
      primaryPalaceId: palaceId,
      reasonLine: `對齊 ${node.year} 年「${node.label}」主線，建議先讀：${row.displayNameZh}`,
      tone: "timeline",
      relatedTimelineNodeIds: relatedIdsForNode(options?.timelineAll ?? null, node),
    };
  }

  const active = matrix?.activePalaceId as PalaceId | null | undefined;
  if (active) {
    const { row } = resolvePalacePreset(active);
    const hint = matrix?.hintLine?.trim();
    return {
      primaryPalaceId: active,
      reasonLine: hint && hint.length > 0 ? hint : `十二宮當前引動：${row.displayNameZh}`,
      tone: "matrix",
      relatedTimelineNodeIds: [],
    };
  }

  const oracle = options?.oracleTexts;
  if (oracle) {
    const primary = pickPrimarySection(sections);
    const blob = [
      oracle.prophecy,
      oracle.title,
      oracle.cardDescription,
      ...oracle.doItems,
      ...oracle.dontItems,
      primary?.structure_analysis,
      primary?.behavior_pattern,
      primary?.blind_spots,
      primary?.strategic_advice,
      sections.s02?.structure_analysis,
      sections.s08?.structure_analysis,
      sections.s10?.structure_analysis,
    ]
      .filter(Boolean)
      .map((x) => String(x))
      .join(" ");
    const palaceId = classifyPalaceIdFromBlob(blob);
    return {
      primaryPalaceId: palaceId,
      reasonLine: REASON_LINE[palaceId] ?? REASON_LINE.ming!,
      tone: "audit",
      relatedTimelineNodeIds: [],
    };
  }

  const palaceId: PalaceId = "ming";
  return {
    primaryPalaceId: palaceId,
    reasonLine: REASON_LINE.ming!,
    tone: "audit",
    relatedTimelineNodeIds: [],
  };
}
