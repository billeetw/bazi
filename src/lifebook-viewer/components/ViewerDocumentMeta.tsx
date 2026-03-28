import type { LifeBookDocument } from "../types";

type Meta = LifeBookDocument["meta"];

export interface ViewerDocumentMetaProps {
  meta: Meta | null | undefined;
  /** 無命盤／權重時顯示舊格式提示 */
  showLegacyFormatNote: boolean;
}

/**
 * 命盤 metadata：非首屏，置於底部可展開「命盤資訊」。
 */
export function ViewerDocumentMeta({ meta, showLegacyFormatNote }: ViewerDocumentMetaProps) {
  const hasAny =
    meta?.client_name ||
    meta?.birth_info ||
    meta?.generator_version != null ||
    meta?.schema_version != null ||
    meta?.output_mode ||
    showLegacyFormatNote;

  if (!hasAny) return null;

  return (
    <footer className="mt-12 pt-6 border-t border-slate-700/40" aria-label="命盤資訊">
      <details className="group rounded-xl border border-slate-700/50 bg-slate-800/15 px-4 py-3">
        <summary className="cursor-pointer list-none text-sm text-slate-400 marker:content-none flex items-center justify-between gap-2">
          <span>命盤資訊</span>
          <span className="text-slate-600 text-xs group-open:rotate-180 transition">▼</span>
        </summary>
        <div className="mt-4 space-y-2 text-xs text-slate-500">
          {meta?.client_name ? <p>命書對象：{meta.client_name}</p> : null}
          {meta?.birth_info ? <p>出生：{meta.birth_info}</p> : null}
          {showLegacyFormatNote ? <p>此命書為舊格式，無命盤或權重資料。</p> : null}
          {(meta?.generator_version != null || meta?.schema_version != null || meta?.output_mode) ? (
            <p>
              {meta?.output_mode === "technical" && (
                <span className="text-amber-400/90 mr-2">資料庫技術版（與專家後台同源）</span>
              )}
              模型：{meta.generator_version ?? "(未知模型版本)"}
              {meta.schema_version != null && ` · schema ${meta.schema_version}`}
            </p>
          ) : null}
        </div>
      </details>
    </footer>
  );
}
