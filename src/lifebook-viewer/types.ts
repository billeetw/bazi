/**
 * 命書 Viewer 與統一 LifeBookDocument 資料型別
 * 前台 viewer 與後台專家系統共用 LifeBookDocument；專家視角資料放在 expert 區塊。
 */

export type ImportanceLevel = "high" | "medium" | "low";

/** 技術版單章：API output_mode=technical 時每章會帶的命盤與組裝資料（自用，方便諮詢判讀） */
export interface LifeBookSectionTechnical {
  chart_slice?: Record<string, unknown>;
  star_palace_quotes?: Record<string, string>;
  underlying_params_text?: string;
  risk_block_text?: string;
  decadal_limits?: unknown;
  yearly_horoscope?: unknown;
  liunian?: unknown;
  minor_fortune_by_palace?: unknown;
  overlap_analysis?: unknown;
  weight_analysis?: unknown;
  wuxing_by_palace?: Record<string, string>;
  ten_god_by_palace?: Record<string, string>;
  ziwei?: unknown;
  bazi?: unknown;
  five_elements?: unknown;
  four_transformations?: unknown;
}

/** 單章：使用者看到的四欄 + 星曜宮位評語（與 API / Worker 一致）；技術版時含 technical */
export interface LifeBookUserSection {
  section_key: string;
  title: string;
  importance_level: ImportanceLevel;
  structure_analysis: string;
  behavior_pattern: string;
  blind_spots: string;
  strategic_advice: string;
  star_palace_quotes?: Record<string, string>;
  output_mode?: "ai" | "technical";
  technical?: LifeBookSectionTechnical;
}

/** 相容舊名，供 SectionCard 等沿用 */
export type SectionPayload = LifeBookUserSection;

export interface WeightAnalysis {
  top_focus_palaces?: string[];
  risk_palaces?: string[];
  stable_palaces?: string[];
  importance_map?: Record<string, ImportanceLevel>;
}

/** 命書中介格式的 meta（版本、關聯、展示用） */
export interface LifeBookMeta {
  schema_version: string;
  generator_version?: string;
  id?: string;
  chart_id?: string;
  locale?: string;
  client_name?: string;
  birth_info?: string;
  created_at?: string;
  /** 生成時選擇的版本：ai = 給用戶；technical = 資料庫技術版（自用） */
  output_mode?: "ai" | "technical";
}

/** infer 單章結構（Worker /life-book/infer 回傳） */
export interface SectionInsight {
  core_insight?: string;
  evidence?: string;
  implications?: string;
  suggestions?: string;
}

/** 專家／debug 區塊（僅後台使用，不給使用者看） */
export interface LifeBookExpertBlock {
  infer_insight?: Record<string, SectionInsight>;
  per_section?: Record<
    string,
    {
      raw_insight?: SectionInsight;
      token_usage?: { prompt: number; completion: number };
      model?: string;
    }
  >;
}

/**
 * 統一的命書文件結構（中介格式）
 * 前台 viewer 與後台一鍵輸出、預覽／下載皆以此為單一來源。
 */
export interface LifeBookDocument {
  meta: LifeBookMeta;
  chart_json: Record<string, unknown> | null;
  weight_analysis: WeightAnalysis | null;
  sections: Record<string, LifeBookUserSection>;
  expert?: LifeBookExpertBlock | null;
}

/**
 * Viewer 狀態：即「使用者視角」的 document，不含 expert。
 * 可從 LifeBookDocument 直接當 state 傳入（viewer 忽略 expert）。
 */
export type LifeBookViewerState = Omit<LifeBookDocument, "expert">;

/** API generate 回傳格式 */
export interface LifeBookApiResponse {
  ok: boolean;
  sections: Record<string, SectionPayload>;
}
