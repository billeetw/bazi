/**
 * 命書 HTML 渲染器：由 LifeBookDocument 產出單一 HTML 字串
 * 與 js/calc/lifeBookEngine.renderLifeBookDocumentToHtml 結構一致，供前台匯出與後台一鍵下載共用。
 */

import type { LifeBookDocument, LifeBookUserSection } from "../types";
import { MODULE_MAP } from "../constants";

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sectionToHtmlParagraphs(text: string): string {
  if (!text || !text.trim()) return "";
  return text
    .split(/\n+/)
    .map((p) => `<p>${escapeHtml(p.trim())}</p>`)
    .join("\n");
}

function renderSectionToHtml(section: LifeBookUserSection): string {
  let html = `  <h2>${escapeHtml(section.title || section.section_key)}</h2>`;
  if (section.star_palace_quotes && Object.keys(section.star_palace_quotes).length > 0) {
    html += '\n  <p><strong>【星曜宮位評語（會直接顯示給當事人）】</strong></p>';
    for (const [k, v] of Object.entries(section.star_palace_quotes)) {
      html += `\n  <p><strong>${escapeHtml(k)}</strong>：${(v || "").replace(/\n/g, "</p><p>")}</p>`;
    }
    html += '\n  <p><strong>【綜合分析】</strong></p>';
  }
  html += `\n  ${sectionToHtmlParagraphs(section.structure_analysis ?? "")}`;
  html += `\n  ${sectionToHtmlParagraphs(section.behavior_pattern ?? "")}`;
  html += `\n  ${sectionToHtmlParagraphs(section.blind_spots ?? "")}`;
  html += `\n  ${sectionToHtmlParagraphs(section.strategic_advice ?? "")}`;
  return html;
}

/**
 * 由 LifeBookDocument 產出完整 HTML 字串（權重摘要 + 模組分組 + 每章星曜評語 + 四欄）
 */
export function renderLifeBookDocumentToHtml(doc: LifeBookDocument): string {
  const w = doc.weight_analysis || {};
  const birthInfo = (doc.chart_json as { birthInfo?: { year?: number; month?: number; day?: number } })?.birthInfo;
  const year = birthInfo?.year ?? "";
  const month = birthInfo?.month ?? "";
  const day = birthInfo?.day ?? "";

  let body = `
  <div class="cover">
    <h1>人生說明書</h1>
    <p class="meta">個人命書 · ${year}年${month}月${day}日</p>
  </div>

  <h2>權重摘要</h2>
  <p><strong>優先關注宮位：</strong>${(w.top_focus_palaces || []).join("、") || "—"}</p>
  <p><strong>風險宮位：</strong>${(w.risk_palaces || []).join("、") || "—"}</p>
  <p><strong>相對穩定宮位：</strong>${(w.stable_palaces || []).join("、") || "—"}</p>
`;

  for (const [modTitle, keys] of Object.entries(MODULE_MAP)) {
    body += `\n  <div class="module-title">${escapeHtml(modTitle)}</div>`;
    for (const key of keys) {
      const section = doc.sections[key];
      if (!section) continue;
      body += "\n" + renderSectionToHtml(section);
    }
  }

  body += `
  <h2>總結</h2>
  <p>以上內容依命盤結構化數據生成，供諮詢參考使用。</p>
`;

  const title = doc.meta?.client_name ? `${escapeHtml(doc.meta.client_name)} 的命書` : "人生說明書 · 個人命書";
  return wrapWithLayout({ title, body });
}

function wrapWithLayout({ title, body }: { title: string; body: string }): string {
  return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { font-family: 'Noto Sans TC', system-ui, sans-serif; line-height: 1.7; color: #1e293b; max-width: 700px; margin: 0 auto; padding: 2rem; }
    h1 { font-size: 1.5rem; color: #0f172a; margin-bottom: 0.5rem; }
    h2 { font-size: 1.15rem; color: #334155; margin-top: 2rem; margin-bottom: 1rem; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.5rem; }
    p { margin: 0.75rem 0; }
    .cover { text-align: center; padding: 4rem 0; }
    .meta { color: #64748b; font-size: 0.9rem; }
    .module-title { font-size: 1rem; color: #475569; margin-top: 2.5rem; margin-bottom: 0.75rem; }
  </style>
</head>
<body>
${body}
</body>
</html>`;
}
