/**
 * 命宮主星矩陣（14 主星）：每顆星 opening / strength / tension / mature，供 s02 命宮人格＋主星性格使用。
 * 優先順序：四化矩陣 > 本矩陣 > 命宮句庫 MING_GONG_CORE。
 */

export interface MingGongStarInsight {
  opening: string;
  strength: string;
  tension: string;
  mature: string;
}

export const MING_GONG_STAR_MATRIX: Record<string, MingGongStarInsight> = {
  紫微: {
    opening: "你的人生很少只是順著環境走，很多時候自然會被推到需要定方向的位置。",
    strength: "你身上有一種能把事情整合起來的氣場，別人很容易把期待放在你身上。",
    tension: "若太早把責任全部攬起來，壓力會變得很重。",
    mature: "成熟的紫微命宮，不是掌控一切，而是知道什麼該主導、什麼該分出去。",
  },
  天機: {
    opening: "你上場時通常先靠理解，而不是靠衝勁。",
    strength: "觀察敏銳、理解速度快，是你最自然的優勢。",
    tension: "當想法太多時，反而容易拖慢行動。",
    mature: "成熟的天機命宮，是讓思考成為推進力，而不是拖延理由。",
  },
  太陽: {
    opening: "你的存在感通常很明顯，很難完全隱身在人群之中。",
    strength: "你很擅長帶動氣氛與方向，別人容易跟著你的節奏前進。",
    tension: "若過度付出，容易忽略自己的能量消耗。",
    mature: "成熟的太陽命宮，是照亮別人，也照顧自己。",
  },
  武曲: {
    opening: "你的人生往往與成果與資源有很深的連動。",
    strength: "務實、直接、能承擔壓力，是你最大的能力。",
    tension: "若把成果當作唯一標準，容易讓自己長期緊繃。",
    mature: "成熟的武曲命宮，是把資源變成長期結構。",
  },
  天同: {
    opening: "你上場時帶著一種溫和、柔軟的氣質，很容易讓人放下戒心。",
    strength: "你擅長察覺氣氛，也很容易成為讓別人放鬆的人。",
    tension: "若過度追求舒服與和諧，容易延後真正需要面對的問題。",
    mature: "成熟的天同命宮，是在溫柔中建立界線。",
  },
  廉貞: {
    opening: "你的人生常帶著某種突破與轉變的力量。",
    strength: "你對權力、慾望與界線的感知非常敏銳。",
    tension: "情緒或慾望若壓抑太久，容易出現劇烈反應。",
    mature: "成熟的廉貞命宮，是把衝動變成策略。",
  },
  天府: {
    opening: "你的人生氣質通常偏穩定與厚實。",
    strength: "別人很容易把重要事情交給你處理。",
    tension: "過度穩定有時會讓你錯過需要冒險的時刻。",
    mature: "成熟的天府命宮，是在穩定中創造空間。",
  },
  太陰: {
    opening: "你帶著細膩的感受力上場，很多事情還沒發生你就先感覺到了。",
    strength: "直覺與情緒理解能力，是你判斷世界的重要工具。",
    tension: "若情緒累積太久，容易變成內耗。",
    mature: "成熟的太陰命宮，是讓感受變成智慧。",
  },
  貪狼: {
    opening: "你的人生常帶著探索與嘗試的節奏。",
    strength: "適應力強、願意嘗試，是你的最大優勢。",
    tension: "若方向不清，容易在不同機會之間分散。",
    mature: "成熟的貪狼命宮，是把多元經驗整合成能力。",
  },
  巨門: {
    opening: "你上場時常帶著觀察與思辨。",
    strength: "你很擅長看見問題的矛盾與核心。",
    tension: "若過度懷疑，容易陷入批判循環。",
    mature: "成熟的巨門命宮，是讓洞察帶來理解。",
  },
  天相: {
    opening: "你的人生節奏常與秩序與平衡有關。",
    strength: "你擅長在不同立場之間找到平衡。",
    tension: "若過度顧全局面，容易忽略自己的需求。",
    mature: "成熟的天相命宮，是在平衡中保留立場。",
  },
  天梁: {
    opening: "你的人生常帶著守護或指引的角色。",
    strength: "很多人會在困難時向你尋求建議。",
    tension: "若過度承擔別人的問題，容易耗損自己。",
    mature: "成熟的天梁命宮，是幫助別人但不背負全部。",
  },
  七殺: {
    opening: "你的人生節奏通常比較強烈。",
    strength: "在變動環境中，你反而能快速適應。",
    tension: "過度衝刺時，容易忽略長期穩定。",
    mature: "成熟的七殺命宮，是把衝勁變成戰略。",
  },
  破軍: {
    opening: "你的人生往往會經歷幾次重要重啟。",
    strength: "你不怕打破舊結構。",
    tension: "若缺乏方向，變動會過於頻繁。",
    mature: "成熟的破軍命宮，是在破壞後建立新秩序。",
  },
};

export function getMingGongStarInsight(starName: string): MingGongStarInsight | null {
  const key = starName.replace(/\s/g, "");
  return MING_GONG_STAR_MATRIX[key] ?? MING_GONG_STAR_MATRIX[starName] ?? null;
}
