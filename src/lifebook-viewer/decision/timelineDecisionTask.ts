/**
 * Timeline Single Decision Task MVP
 *
 * 資料契約（寫死）：
 * - **只讀**：`chart_json.findings.natalFlowItems`（與 Worker `NormalizedChart.natal.flows` 對齊之 findings）、
 *   時間模組章節 `s17`／`s18`／`s19` 之正文、`weight_analysis`。
 * - **禁止**：`overlapAnalysis.items[].transformations`、任何自行推邊、未標明 authority 之舊欄位。
 *
 * 宮位產品對照（Viewer `SECTION_KEY_TO_PALACE_ID`）：財帛 → `s10`／`caibo`，官祿 → `s08`／`guanlu`。
 *
 * **rationale 組裝**：`pickMomentSentenceFromTimeModules`（S19→S18→S17 抽一句「此刻」）＋飛化說明＋急迫句；仍為單一任務、單一區塊輸出。
 */

import type { LifeBookUserSection, LifeBookViewerState } from "../types";
import type { HomeEventPayload } from "../components/home/types";
import { buildHomePalaceReadUrl, buildTimelineUrl } from "../routing/buildQuantumUrls";

export type DecisionTaskPalaceId = "caibo" | "guanlu";

/** 與 Viewer 十二宮錨點一致：`#palace-caibo`／`#palace-guanlu` */
export type DecisionTask = {
  id: string;
  title: string;
  summary: string;
  rationale: string;
  palaceId: DecisionTaskPalaceId;
  /** 對應章節鍵，供除錯／telemetry */
  sectionKey: "s10" | "s08";
  timelineNodeId?: string;
  urgency: "now" | "soon";
  viewerHref: string;
  timelineHref?: string;
};

const PALACE_WEALTH = "財帛宮";
const PALACE_CAREER = "官祿宮";

type NatalFlowLike = {
  fromPalace?: string;
  toPalace?: string;
  transform?: string;
  starName?: string;
};

function getNatalFlowItems(chartJson: Record<string, unknown> | null | undefined): NatalFlowLike[] {
  const raw = chartJson?.findings as { natalFlowItems?: unknown } | undefined;
  const items = raw?.natalFlowItems;
  return Array.isArray(items) ? (items as NatalFlowLike[]) : [];
}

function touchesPalace(item: NatalFlowLike, palace: typeof PALACE_WEALTH | typeof PALACE_CAREER): boolean {
  const fp = String(item.fromPalace ?? "");
  const tp = String(item.toPalace ?? "");
  return fp === palace || tp === palace;
}

function scoreFlowsForPalace(
  items: NatalFlowLike[],
  palace: typeof PALACE_WEALTH | typeof PALACE_CAREER
): { score: number; hasJi: boolean } {
  let s = 0;
  let hasJi = false;
  for (const it of items) {
    if (!touchesPalace(it, palace)) continue;
    const tr = String(it.transform ?? "");
    if (tr === "忌") {
      hasJi = true;
      s += 5;
    } else if (tr === "祿") s += 2;
    else if (tr === "權") s += 2;
    else if (tr === "科") s += 1;
    else s += 1;
  }
  return { score: s, hasJi };
}

function concatTimeModuleText(state: LifeBookViewerState): string {
  const keys = ["s17", "s18", "s19"] as const;
  const parts: string[] = [];
  for (const k of keys) {
    const sec = state.sections?.[k];
    if (!sec) continue;
    parts.push(sec.structure_analysis ?? "", sec.strategic_advice ?? "");
  }
  return parts.join("\n");
}

const TIME_MODULE_KEYS_DESC = ["s19", "s18", "s17"] as const;

/** 拆成可讀句（過短多為標題殘片，略過） */
function splitIntoCandidateSentences(blob: string): string[] {
  return String(blob ?? "")
    .split(/[。\n！？，,]+/)
    .map((s) => s.trim().replace(/\s+/g, " "))
    .filter((s) => s.length >= 6 && s.length <= 140);
}

function scoreMomentSentence(sentence: string, palaceId: DecisionTaskPalaceId): number {
  let s = 0;
  if (/今年|此刻|這段|這段時間|流年|本月|當前|近期|這陣子|近日|先|宜|不宜|要先|先把/.test(sentence)) s += 2;
  if (palaceId === "caibo") {
    if (/財帛|現金流|現金|資源|入帳|金錢|理財|收支|帳|回款/.test(sentence)) s += 4;
  } else {
    if (/官祿|職涯|工作|職責|職位|職場|交付|事業|上班|職務/.test(sentence)) s += 4;
  }
  return s;
}

function sectionBlobForMoment(sec: LifeBookUserSection | undefined): string {
  if (!sec) return "";
  return [sec.structure_analysis, sec.strategic_advice, sec.behavior_pattern, sec.blind_spots].filter(Boolean).join("\n");
}

/**
 * 從 S19→S18→S17 抽一句最像「此刻」的敘事（不讀 overlap）。
 * 優先：時間語感詞 + 與選定宮位（財帛／官祿）相關用語；無命中則取 s19 首句作軟 fallback。
 */
export function pickMomentSentenceFromTimeModules(
  state: LifeBookViewerState,
  palaceId: DecisionTaskPalaceId
): string | null {
  const scored: { sentence: string; score: number; tier: number }[] = [];
  let tier = 0;
  for (const key of TIME_MODULE_KEYS_DESC) {
    const blob = sectionBlobForMoment(state.sections?.[key]);
    for (const sentence of splitIntoCandidateSentences(blob)) {
      const score = scoreMomentSentence(sentence, palaceId) + (key === "s19" ? 3 : key === "s18" ? 1 : 0);
      scored.push({ sentence, score, tier: tier++ });
    }
  }
  if (scored.length === 0) return null;
  scored.sort((a, b) => b.score - a.score || a.tier - b.tier);
  const best = scored[0];
  if (best.score >= 4) {
    return best.sentence.length > 110 ? `${best.sentence.slice(0, 109)}…` : best.sentence;
  }
  const s19 = state.sections?.s19;
  const s19first = splitIntoCandidateSentences(sectionBlobForMoment(s19))[0];
  if (s19first) return s19first.length > 110 ? `${s19first.slice(0, 109)}…` : s19first;
  const fallback = scored.map((x) => x.sentence).find((s) => s.length >= 8);
  return fallback ?? null;
}

function scoreTextBias(text: string): { wealth: number; career: number } {
  let wealth = 0;
  let career = 0;
  if (/財帛|現金流|資源|金錢|理財/.test(text)) wealth += 3;
  if (/官祿|職涯|工作|職責|交付|職位/.test(text)) career += 3;
  return { wealth, career };
}

function scoreWeight(weight: LifeBookViewerState["weight_analysis"]): { wealth: number; career: number } {
  let wealth = 0;
  let career = 0;
  const lists = [weight?.risk_palaces, weight?.stable_palaces, weight?.top_focus_palaces].filter(Boolean) as string[][];
  for (const list of lists) {
    for (const p of list) {
      const t = String(p);
      if (/財帛/.test(t)) wealth += 2;
      if (/官祿/.test(t)) career += 2;
    }
  }
  return { wealth, career };
}

function pickPalace(
  items: NatalFlowLike[],
  text: string,
  weight: LifeBookViewerState["weight_analysis"],
  year: number
): { palaceId: DecisionTaskPalaceId; sectionKey: "s10" | "s08"; urgency: "now" | "soon"; flowReason: string } {
  const fw = scoreFlowsForPalace(items, PALACE_WEALTH);
  const fc = scoreFlowsForPalace(items, PALACE_CAREER);
  const tw = scoreTextBias(text);
  const ww = scoreWeight(weight);

  const totalW = fw.score + tw.wealth + ww.wealth;
  const totalC = fc.score + tw.career + ww.career;

  let palaceId: DecisionTaskPalaceId;
  let sectionKey: "s10" | "s08";

  if (totalW > totalC) {
    palaceId = "caibo";
    sectionKey = "s10";
  } else if (totalC > totalW) {
    palaceId = "guanlu";
    sectionKey = "s08";
  } else if (fw.score !== fc.score) {
    palaceId = fw.score > fc.score ? "caibo" : "guanlu";
    sectionKey = palaceId === "caibo" ? "s10" : "s08";
  } else {
    const pickCaibo = year % 2 === 0;
    palaceId = pickCaibo ? "caibo" : "guanlu";
    sectionKey = pickCaibo ? "s10" : "s08";
  }

  const palaceCanon = palaceId === "caibo" ? PALACE_WEALTH : PALACE_CAREER;
  const hasJi =
    palaceId === "caibo"
      ? fw.hasJi
      : fc.hasJi;
  const urgency: "now" | "soon" = hasJi ? "now" : "soon";

  const flowReason =
    items.length > 0
      ? `本命飛化資料中，與「${palaceCanon.replace("宮", "")}」相關的條目加權較高。`
      : "目前無結構化飛化列表，依時間模組摘要與權重線索推薦此宮。";

  return { palaceId, sectionKey, urgency, flowReason };
}

function parseYear(chart: Record<string, unknown> | null | undefined): number {
  if (!chart) return new Date().getFullYear();
  const y1 = Number((chart.yearlyHoroscope as { year?: unknown } | undefined)?.year);
  if (Number.isFinite(y1) && y1 > 1900 && y1 < 2200) return y1;
  const y2 = Number((chart.liunian as { year?: unknown } | undefined)?.year);
  if (Number.isFinite(y2) && y2 > 1900 && y2 < 2200) return y2;
  return new Date().getFullYear();
}

/**
 * 從命書 Viewer 狀態產出單一決策任務（財帛線／官祿線二選一）。
 * 不讀 overlap 邊；不呼叫 normalize。
 */
export function buildTimelineDecisionTask(state: LifeBookViewerState, opts?: { timelineNodeId?: string | null }): DecisionTask {
  const chart = state.chart_json;
  const year = parseYear(chart);
  const items = getNatalFlowItems(chart);
  const tmText = concatTimeModuleText(state);
  const { palaceId, sectionKey, urgency, flowReason } = pickPalace(items, tmText, state.weight_analysis, year);

  const timelineNodeId = opts?.timelineNodeId?.trim() || `y${year}`;
  /** 留在同一 SPA 根頁，以 `#palace-*` 開 overlay；勿導向 `?view=viewer`（無章節時會黑屏） */
  const viewerHref = buildHomePalaceReadUrl(palaceId);
  const timelineHref = buildTimelineUrl({ focus: timelineNodeId, source: "viewer" });

  const title =
    palaceId === "caibo" ? "這段時間，先處理現金流節奏" : "這段時間，先處理工作節奏與責任邊界";

  const summary =
    palaceId === "caibo"
      ? "優先校準資源進出與回報感，避免在節奏不明時加碼承諾。"
      : "優先劃清職責與交付節點，避免在邊界模糊時硬扛角色。";

  const momentLine = pickMomentSentenceFromTimeModules(state, palaceId);
  const urgencyClause =
    urgency === "now" ? "流向顯示忌星張力較明顯，適合先把節奏收斂再推進。" : "整體仍可循序調整，先把一件事做穩再做下一件。";
  const rationale = [momentLine, flowReason, urgencyClause].filter(Boolean).join(" ");

  const id = `tdt-${palaceId}-${year}-${timelineNodeId}`;

  return {
    id,
    title,
    summary,
    rationale,
    palaceId,
    sectionKey,
    timelineNodeId,
    urgency,
    viewerHref,
    timelineHref,
  };
}

/** 與產品／測試命名對齊（同 {@link buildTimelineDecisionTask}） */
export const buildTimelineDecisionTaskFromFindings = buildTimelineDecisionTask;

/** Timeline 決策任務文案／槽位契約版本（telemetry `task_schema_version`） */
export const TIMELINE_DECISION_TASK_SCHEMA_VERSION = "1";

/** 供 `timeline_decision_task_impression` / `timeline_decision_cta_click` 與 `viewer_route_resolved` join 用 */
export function buildTimelineDecisionTelemetryPayload(task: DecisionTask): HomeEventPayload {
  let year: number | undefined;
  const nid = task.timelineNodeId?.trim();
  if (nid && /^y\d{4}$/.test(nid)) {
    const yFromNode = Number(nid.slice(1));
    if (Number.isFinite(yFromNode) && yFromNode > 1900 && yFromNode < 2200) year = yFromNode;
  }
  if (year == null) {
    try {
      const href = task.viewerHref.startsWith("http") ? task.viewerHref : `https://local.invalid${task.viewerHref}`;
      const u = new URL(href);
      const y = Number(u.searchParams.get("year"));
      if (Number.isFinite(y) && y > 1900 && y < 2200) year = y;
    } catch {
      /* ignore */
    }
  }
  return {
    app_surface: "timeline",
    task_id: task.id,
    palace_id: task.palaceId,
    section_key: task.sectionKey,
    urgency: task.urgency,
    timeline_node_id: task.timelineNodeId,
    year,
    task_schema_version: TIMELINE_DECISION_TASK_SCHEMA_VERSION,
    destination: "palace_overlay",
  };
}
