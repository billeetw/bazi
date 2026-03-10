/**
 * 亮度敘事層：廟／旺／利／平／陷 → 命書式一句，不輸出獨立【亮度】區塊。
 * 僅說明此主星目前較成熟／活躍／可塑／中性／敏感，不重複星曜性格本身。
 */

export type BrightnessLevel = "廟" | "旺" | "利" | "平" | "陷";

const BRIGHTNESS_TEMPLATES: Record<BrightnessLevel, string[]> = {
  廟: [
    "這顆主星落在廟地，代表它的核心特質較成熟，也較容易自然發揮為優勢。",
    "星曜落在廟地，通常表示這份力量穩定、得位，能以比較完整的方式表現出來。",
    "這樣的亮度代表你比較容易用成熟的方式活出這顆星，而不是被它牽著走。",
  ],
  旺: [
    "這顆主星落在旺地，代表它的力量明顯、反應直接，通常較容易被外界看見。",
    "星曜在旺地，表示這份特質活躍且有存在感，往往會成為你很鮮明的一部分。",
    "這樣的亮度讓這顆星比較容易表現在外，也更容易成為你人生裡的重要主軸。",
  ],
  利: [
    "這顆主星落在利地，代表它具備發揮空間，但仍需要情境配合與後天練習。",
    "星曜在利地，通常表示這份特質可用、可長，但不一定會自動成熟。",
    "這樣的亮度說明你有這份能力，只是更需要透過經驗把它穩定下來。",
  ],
  平: [
    "這顆主星落在平地，代表它的表現較中性，優勢與挑戰都需要靠後天整合。",
    "星曜在平地，通常不會自動放大優點，也不會特別壓低，需要看你怎麼使用它。",
    "這樣的亮度比較像原始素材：能否成為力量，取決於你怎麼練習與安排它。",
  ],
  陷: [
    "這顆主星落在陷地，代表它的核心特質較敏感，優點仍在，但更容易在壓力下失衡。",
    "星曜在陷地，表示這份特質需要更多後天修正，否則容易先表現為盲點或內耗。",
    "這樣的亮度不是沒有能力，而是這顆星比較容易先以不穩定的方式被感受到。",
  ],
};

function pickBySeed<T>(arr: T[], seed?: number): T {
  if (!arr.length) throw new Error("Empty template array");
  if (seed == null || !Number.isFinite(seed)) return arr[0];
  const idx = Math.abs(Math.floor(seed)) % arr.length;
  return arr[idx];
}

function normalizeBrightness(brightness?: string | null): BrightnessLevel | null {
  const b = (brightness ?? "").trim();
  if (b === "廟" || b === "旺" || b === "利" || b === "平" || b === "陷") return b;
  return null;
}

/**
 * 依亮度產出一句命書敘事，不重複主星人格。空亮度或非法值回傳空字串。
 */
export function buildBrightnessNarrative(
  starName: string,
  brightness?: string | null,
  seed?: number
): string {
  const level = normalizeBrightness(brightness);
  if (!starName?.trim() || !level) return "";
  return pickBySeed(BRIGHTNESS_TEMPLATES[level], seed);
}
