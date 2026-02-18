/**
 * Build dbContent from ui_copy_texts rows.
 * copy_key format: palace.{key} | star.{key} | tenGod.{key} | wuxing.{key}
 * - palace.命宮 -> palaces["命宮"]
 * - star.紫微 / star.emperor -> stars["紫微"] / stars["emperor"]
 * - tenGod.比肩 -> tenGods["比肩"]
 * - wuxing.木 -> wuxing["木"] (content: JSON {headline, content})
 */
export interface DbContent {
  palaces: Record<string, string>;
  stars: Record<string, string>;
  tenGods: Record<string, string>;
  wuxing: Record<string, { headline: string; content: string }>;
}

export function buildContentFromRows(
  rows: Array<{ copy_key: string; content: string }>
): DbContent {
  const out: DbContent = {
    palaces: {},
    stars: {},
    tenGods: {},
    wuxing: {},
  };

  for (const row of rows) {
    const { copy_key, content } = row;
    if (!copy_key || content == null) continue;

    const dot = copy_key.indexOf(".");
    if (dot <= 0) continue;

    const prefix = copy_key.slice(0, dot);
    const key = copy_key.slice(dot + 1);

    if (prefix === "palace") {
      out.palaces[key] = String(content);
    } else if (prefix === "star") {
      out.stars[key] = String(content);
    } else if (prefix === "tenGod") {
      out.tenGods[key] = String(content);
    } else if (prefix === "wuxing") {
      try {
        const parsed = JSON.parse(content) as { headline?: string; content?: string };
        out.wuxing[key] = {
          headline: String(parsed?.headline ?? ""),
          content: String(parsed?.content ?? ""),
        };
      } catch {
        out.wuxing[key] = { headline: "", content: String(content) };
      }
    }
  }

  return out;
}

export function mergeContent(
  base: DbContent,
  overlay: DbContent
): DbContent {
  return {
    palaces: { ...base.palaces, ...overlay.palaces },
    stars: { ...base.stars, ...overlay.stars },
    tenGods: { ...base.tenGods, ...overlay.tenGods },
    wuxing: { ...base.wuxing, ...overlay.wuxing },
  };
}
