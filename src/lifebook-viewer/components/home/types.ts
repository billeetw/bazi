import type { DecisionTask } from "../../decision/timelineDecisionTask";
import type { RootBlueprintHeroMock, RootPrimaryFocusMock, RootTimelinePreviewNodeMock } from "./root/rootBlueprintMock";

/** 統一啟示／付費牆彈窗內容（單一轉化漏斗） */
export type RevelationLogicRow = { label: string; value: string };

export type RevelationContent = {
  /** 供分析／A-B 分組用 */
  kind?: string;
  title: string;
  subtitle?: string;
  palaceLabel?: string;
  starLabel?: string;
  prophecy?: string;
  /** 後果／付費牆強調區（紅框） */
  doomSummary?: string;
  logicRows?: RevelationLogicRow[];
  ctaLabel?: string;
};

export type HexFruitType = "danger" | "wealth" | "neutral";

export type BranchSide = "left" | "right";

export type HomeNodeRisk = "danger" | "wealth" | "neutral";
export type HomeNodeSignal = "alert" | "wealth" | "career" | "love";
export type HomeNodeGate = "open" | "partial" | "locked" | "teaser";
export type HomeNodeStatus = "active" | "upcoming" | "review";

export interface HomeMonthItem {
  id: string;
  month: string;
  label: string;
  summary: string;
  risk: HomeNodeRisk;
  severity: "high" | "medium" | "low";
  kind: "alert" | "wealth" | "career" | "love";
  actionTarget?: string;
}

export interface HomeTimelineNode {
  id: string;
  year: number;
  label: string;
  subtitle?: string;
  isCurrent: boolean;
  branch: BranchSide;
  signals: HomeNodeSignal[];
  status: HomeNodeStatus;
  monthPreview: HomeMonthItem[];
  actionTarget: string;
  isLocked: boolean;
  gate: HomeNodeGate;
  risk: HomeNodeRisk;
  symbol: string;
}

export interface HomeOracleSummary {
  anchor: string;
  progressLabel: string;
  progressPercent: number;
  title: string;
  prophecy: string;
  doItems: string[];
  dontItems: string[];
  hintText?: string;
  warningText?: string;
}

/** Step 2：十二宮 matrix 引動來源（可對齊 telemetry） */
export type HomePalaceMatrixSource = "monthly" | "liunian" | "yearly" | "weight" | "none";

/** Step 2：Home 十二宮格狀態 + 單一「當前引動」高亮 */
export interface HomePalaceMatrix {
  order: readonly string[];
  activePalaceId: string | null;
  hintLine: string;
  source: HomePalaceMatrixSource;
}

/** Oracle 摘要：`computeHomeAuditCta` / `computeFocus` 共用 */
export interface HomeOracleTextForCta {
  prophecy: string;
  doItems: string[];
  dontItems: string[];
  cardDescription: string;
  title: string;
}

/** Step 1：audit 區下行動導流（rule-based 推薦一宮 → Viewer 錨點） */
export interface HomeAuditCta {
  palaceId: string;
  leadLine: string;
  reasonLine: string;
  ctaLabel: string;
  /** Home 同頁 hash，例：`#palace-fuqi`（開啟宮位閱讀 overlay；完整列表仍可用 `?view=viewer#palace-*`） */
  href: string;
}

/** Step 3 後續：worker / findings 覆寫 detail 時用鍵值，避免硬依賴字串 */
export interface TimelineNodeCtaDetailParts {
  template: "timeline_cta_v1";
  timeline_node_id: string;
  section_key: string;
  palace_id: string;
  year: number;
}

/** Phase 3A.2 / 3B：時間軸節點 → Viewer deep link */
export interface TimelineNodeCta {
  /** 主因一句（卡片主文案） */
  reasonLine: string;
  /** 補充：章節錨點、試讀／捲動預期（Step 3B） */
  detailLine?: string;
  /** 結構化： findings 可覆寫 `detailLine` 而不破壞模板 */
  detailParts?: TimelineNodeCtaDetailParts;
  href: string;
  palaceId: string;
  sectionKey: string;
  /** 與 URL `timeline_node` 一致 */
  timelineNodeId: string;
}

export interface HomeSummary {
  oracle: HomeOracleSummary;
  timeline: HomeTimelineNode[];
  cardTitle: string;
  cardDescription: string;
  currentNodeId?: string;
  /** summary 層不做推導，僅提供預先組好的啟示 payload */
  revelationsByNodeId: Record<string, RevelationContent>;
  revelationsByMonthId?: Record<string, RevelationContent>;
  /** 未來可改由引擎寫入；現由 `computeHomeAuditCta` 產出 */
  auditCta?: HomeAuditCta | null;
  /** Step 2：十二宮 matrix + 引動提示；由 `computePalaceMatrixHighlight` 產出 */
  palaceMatrix?: HomePalaceMatrix | null;
  /** Phase 3A.2：`timeline[n].id` → 進完整閱讀的帶因 CTA */
  timelineViewerCtas?: Record<string, TimelineNodeCta>;
  /** Timeline MVP：單一決策任務（財帛／官祿），見 `buildTimelineDecisionTask` 契約 */
  decisionTask?: DecisionTask | null;
  /** 降生藍圖 Hero：有命盤 chart_json 時由 `buildRootBlueprintHeroFromChart` 填入 */
  rootBlueprintHero?: RootBlueprintHeroMock | null;
  /** 本週首要焦點：有 audit CTA 時優先於 mock */
  rootPrimaryFocus?: RootPrimaryFocusMock | null;
  /** 時間軸預覽兩節點：有 timeline 時優先於 mock */
  rootTimelinePreview?: { summaryLine: string; nodes: RootTimelinePreviewNodeMock[] } | null;
}

export type HomeNodeAction =
  | { type: "view_core_message"; source: "oracle" | "root" }
  | { type: "open_time_node"; nodeId: string }
  | { type: "open_revelation"; source: "node" | "month" | "fog"; nodeId?: string; monthId?: string };

export type HomeEventName =
  | "home_surface_resolved"
  | "home_core_viewed"
  | "home_time_node_clicked"
  | "home_revelation_opened"
  | "home_revelation_cta_clicked"
  | "home_palace_matrix_cell_clicked"
  | "timeline_node_clicked"
  | "timeline_decision_task_impression"
  | "timeline_decision_cta_click"
  | "palace_overlay_opened"
  | "palace_section_generate_started"
  | "palace_section_generate_succeeded"
  | "palace_section_generate_failed"
  | "palace_overlay_retry_clicked"
  | "viewer_access_blocked"
  | "viewer_scroll_success"
  | "viewer_route_resolved"
  | "viewer_gate_resolved";

/** 與 Worker `generate-section` 回應 `time_context` 同形（snake_case）；telemetry 固定附帶以利除錯 */
export interface TimeContextTelemetryPayload {
  time_zone: string;
  day_key: string;
  client_now_iso: string;
  day_key_mode: "civil_client_tz";
  timezone_source: "client_iana" | "fallback_utc";
}

/** 與 Worker `DayFlowFallbackReason` 對齊；日層／首頁 flow telemetry 可選 */
export type DayFlowFallbackReasonPayload =
  | "daily_incomplete"
  | "no_destiny_palace"
  | "parse_failed"
  | "monthly_only";

export interface HomeEventPayload {
  /** App shell 分流：root / viewer / timeline */
  app_surface?: string;
  /** Root 內：`default` | `domains` */
  root_sub_view?: string;
  entry_point?: "oracle" | "root" | "node" | "month" | "fog" | "palace_matrix" | "timeline";
  node_id?: string;
  month_id?: string;
  palace_id?: string;
  matrix_source?: HomePalaceMatrixSource;
  /** Phase 3A */
  year?: number;
  source?: string;
  section_key?: string;
  target_id?: string;
  reason?: string;
  intent_full?: boolean;
  is_viewer_mode?: boolean;
  hash?: string;
  timeline_node_id?: string;
  /** `resolveGateContract` */
  gate?: string;
  preview_mode?: string;
  cta_variant?: string;
  is_locked?: boolean;
  /** 每次完整閱讀掛載一個新 id（refresh = 新實例，事件不會被誤合併） */
  navigation_instance_id?: string;
  /** 同源分頁 session（可跨 refresh 關聯） */
  navigation_session_id?: string;
  /** `computeFocus` tone（若有） */
  focus_tone?: string;
  /** Timeline 單一決策任務：`DecisionTask.id` */
  task_id?: string;
  /** 文案／槽位版本（`timelineDecisionTask` 與產品約定） */
  task_schema_version?: string;
  /** 決策任務急迫度 */
  urgency?: "now" | "soon";
  /** 導向目標，例如完整閱讀 `viewer` */
  destination?: string;
  /** `lifebook_revelation_open`：node | month | fog */
  kind?: string;
  /** 單章生成失敗訊息 */
  error_message?: string;
  /** 帳號 id（`bazi_user.id` 或匿名 `bazi_user_id`），供 GA 與封測 journey 對齊 */
  user_id?: string;
  /** 封測邀請碼（`lifebook_v2_beta_invite_code`） */
  invite_code?: string;
  /** 與 API `time_context` 一致；未傳時由 `enrichTelemetryPayload` 以 client 快照補齊 */
  time_context?: TimeContextTelemetryPayload;
  /** Phase 1 時間敘事：`home_core_viewed` 精簡對焦（與 `TimelineHeroViewModelV0.current_focus` 對齊） */
  timeline_narrative_focus?: "day" | "year";
  /** `surfaceLabelZh` 之 key；未載入流日時可能缺 */
  surface_label_key?: string;
  /** 日層降級原因（與 `fallback_tier` 搭配除錯） */
  fallback_reason?: DayFlowFallbackReasonPayload;
  /** 宮位閱讀層：`root` | `timeline` */
  palace_reader_surface?: "root" | "timeline";
  /** `initial` | `retry` */
  generate_mode?: "initial" | "retry";
}
