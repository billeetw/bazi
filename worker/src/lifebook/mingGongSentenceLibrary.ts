/**
 * 命宮專用句庫：宮位核心定義、輔星整合（四種情況）、失衡句庫。
 * 供 s02 命宮敘事型模板使用，避免泛用模板句。
 */

/** 命宮 palaceCoreDefinition：6 句輪替，用於「上場方式」開場 */
export const MING_GONG_CORE = [
  "命宮掌管的是你的自我定位與人生方向。這一宮描述的不是事件，而是你最自然的行動節奏與人格氣質。",
  "命宮反映的是：當世界向你走來時，你會用什麼樣的姿態回應。",
  "命宮像是人生的操作系統，它決定你面對壓力、選擇與關係時最自然的反應模式。",
  "很多外在劇情看似偶然，其實都和你怎麼理解自己有關。",
  "命宮不只是個性描述，更是你在人生舞台上的出場方式。",
  "這一宮講的不是你做了什麼，而是你總是用什麼方式活出自己。",
];

/** 命宮失衡句庫：用於「最容易失衡的方式」，無 content.palaceRiskSummary 時可選一句 */
export const MING_GONG_IMBALANCE = [
  "命宮的盲點通常不是能力不足，而是太習慣用同一種方式面對所有事情。",
  "當你過度依賴主星慣性時，可能會把「這就是我」誤認為「我只能這樣」。",
  "如果長期忽略輔星帶來的補強力量，原本可以緩衝的部分就會消失。",
  "當外在壓力增加時，你可能會把情緒張力內化成自我懷疑。",
  "若再加上四化忌的牽動，你就更容易在自我定位上出現失衡。",
];

/**
 * 命宮輔星整合句（四種情況）：依有輔/有煞回傳一句，已代入 assistantSummary / shaSummary。
 */
export function getMingGongAssistantNarrative(
  hasAssistant: boolean,
  hasSha: boolean,
  assistantSummary: string,
  shaSummary: string
): string {
  if (hasAssistant && hasSha) {
    return `輔星 ${assistantSummary} 為這個命宮帶來支持與補強，而煞星 ${shaSummary} 則讓某些議題更容易被放大。`;
  }
  if (hasAssistant) {
    return `輔星為 ${assistantSummary}，這些星曜會讓你的氣質更柔軟，也讓你在人際互動中更容易獲得信任與支持。`;
  }
  if (hasSha) {
    return `煞星為 ${shaSummary}，這代表你的命宮在某些情境下會承受較高壓力，也可能讓你對某些議題特別敏感。`;
  }
  return "此宮沒有明顯輔星或煞星干擾，因此主星的氣質會表現得較為純粹。";
}

/** 從句庫依種子取一句（穩定輪替） */
export function pickMingGongCore(seed: number): string {
  return MING_GONG_CORE[Math.abs(seed) % MING_GONG_CORE.length];
}

export function pickMingGongImbalance(seed: number): string {
  return MING_GONG_IMBALANCE[Math.abs(seed) % MING_GONG_IMBALANCE.length];
}
