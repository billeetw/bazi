export interface ElementScores {
  wood: 0 | 1 | 2 | 3;
  fire: 0 | 1 | 2 | 3;
  earth: 0 | 1 | 2 | 3;
  metal: 0 | 1 | 2 | 3;
  water: 0 | 1 | 2 | 3;
}

export type EnergyLevel = 0 | 1 | 2 | 3;

const ENERGY_LABEL: Record<EnergyLevel, string> = {
  0: "微弱",
  1: "平穩",
  2: "強健",
  3: "過旺",
};

type ElementKey = keyof ElementScores;

const ELEMENT_ZH: Record<ElementKey, string> = {
  wood: "木",
  fire: "火",
  earth: "土",
  metal: "金",
  water: "水",
};

// 相生：木→火→土→金→水→木
const GENERATES_TO: Record<ElementKey, ElementKey> = {
  wood: "fire",
  fire: "earth",
  earth: "metal",
  metal: "water",
  water: "wood",
};

// 相剋：木剋土、土剋水、水剋火、火剋金、金剋木
const OVERCOMES_TO: Record<ElementKey, ElementKey> = {
  wood: "earth",
  earth: "water",
  water: "fire",
  fire: "metal",
  metal: "wood",
};

type EnergyBand = "low" | "healthy" | "excess";

const ELEMENT_CORE_MEANING: Record<
  ElementKey,
  { core: string; low01: string; level2: string; level3: string; remedy: string }
> = {
  wood: {
    core: "執行、生長",
    low01: "猶豫不決、停滯",
    level2: "條理分明、穩定成長",
    level3: "盲目擴張、焦慮",
    remedy: "缺乏「動手做」的勇氣，你需要的是直接啟動，而不是持續規劃。",
  },
  fire: {
    core: "傳播、名聲",
    low01: "默默無聞、冷淡",
    level2: "熱情、影響力強",
    level3: "虛火上升、易碎",
    remedy: "你的好只有你自己知道，缺乏「傳播力」將讓你陷入孤軍奮戰。",
  },
  earth: {
    core: "信用、整合",
    low01: "缺乏根基、動盪",
    level2: "穩重、資源豐厚",
    level3: "頑固死板、阻礙",
    remedy: "所有的成就都像在沙灘上蓋房子，你需要的是「資產化」與「穩定性」。",
  },
  metal: {
    core: "決斷、規則",
    low01: "界線模糊、軟弱",
    level2: "效率、紀律、果斷",
    level3: "冷酷無情、偏激",
    remedy: "你太好說話了，缺乏「拒絕力」是你目前能量耗損的核心原因。",
  },
  water: {
    core: "智慧、流動",
    low01: "思考枯竭、封閉",
    level2: "洞察力、靈活應變",
    level3: "憂慮多思、漂浮",
    remedy: "正在用體力對抗智力，缺乏「深度思考」會讓你陷入低效率的勤奮。",
  },
};

function clampEnergyLevel(v: number): EnergyLevel {
  const n = Number(v);
  if (!Number.isFinite(n)) return 0;
  const i = Math.round(n);
  if (i <= 0) return 0;
  if (i === 1) return 1;
  if (i === 2) return 2;
  return 3;
}

/** 將分數轉化為能量等級：0(微弱), 1(平穩), 2(強健), 3(過旺)。 */
export function getEnergyLevel(score: number): EnergyLevel {
  return clampEnergyLevel(score);
}

function labelOf(level: EnergyLevel): string {
  return ENERGY_LABEL[level];
}

function bandOf(level: EnergyLevel): EnergyBand {
  if (level <= 1) return "low";
  if (level === 2) return "healthy";
  return "excess";
}

function meaningText(el: ElementKey, level: EnergyLevel): string {
  const m = ELEMENT_CORE_MEANING[el];
  if (level <= 1) return `Level 0-1（低能量）：${m.low01}`;
  if (level === 2) return `Level 2（強健）：${m.level2}`;
  return `Level 3（過旺）：${m.level3}`;
}

function parentOf(el: ElementKey): ElementKey {
  // 找到「誰生我」：母 = 其相生路徑中的上一個
  // 也就是：若 A 生 B，則 B 的母為 A
  const entries = Object.entries(GENERATES_TO) as Array<[ElementKey, ElementKey]>;
  const found = entries.find(([, child]) => child === el);
  return found ? found[0] : "wood";
}

function generationCycleFrom(start: ElementKey): ElementKey[] {
  const out: ElementKey[] = [start];
  while (out.length < 5) {
    out.push(GENERATES_TO[out[out.length - 1]]);
  }
  return out;
}

function strongestAndWeakest(scores: ElementScores): { strongest: ElementKey; weakest: ElementKey } {
  const keys: ElementKey[] = ["wood", "fire", "earth", "metal", "water"];
  let strongest: ElementKey = keys[0];
  let weakest: ElementKey = keys[0];
  keys.forEach((k) => {
    if (scores[k] > scores[strongest]) strongest = k;
    if (scores[k] < scores[weakest]) weakest = k;
  });
  return { strongest, weakest };
}

function relationBadge(a: EnergyLevel, b: EnergyLevel): string {
  // 用於母子/剋制的「能量對比」粗分類
  // 強弱：0-1 視為弱，2-3 視為強
  const A = a >= 2 ? "強" : "弱";
  const B = b >= 2 ? "強" : "弱";
  return `${A}${B}`; // e.g. "強弱" / "弱強" / "強強" / "弱弱"
}

type PairKey = `${ElementKey}->${ElementKey}`;

const GENERATION_POST_STYLE: Record<PairKey, { headline: string; text: string }> = {
  "wood->fire": {
    headline: "策略引燃市場",
    text: "你的執行力（木）正精準轉化為市場名聲（火），品牌能量正處於上升期。",
  },
  "fire->earth": {
    headline: "流量沉澱資產",
    text: "目前的高關注度（火）應迅速轉化為品牌信用與基礎建設（土），避免熱度流失。",
  },
  "earth->metal": {
    headline: "資源轉化效率",
    text: "厚實的根基（土）是為了萃取更高效率的 SOP 與規則（金），讓組織自動運轉。",
  },
  "metal->water": {
    headline: "決斷催生智慧",
    text: "你的紀律與邊界（金）正在為深度的思考與策略（水）提供乾淨的環境。",
  },
  "water->wood": {
    headline: "智謀驅動執行",
    text: "充沛的智慧（水）正高效轉化為具體的執行管道（木），這是最強的變現路徑。",
  },
};

const OVERCOMING_POST_STYLE: Record<PairKey, { headline: string; text: string }> = {
  "wood->earth": {
    headline: "擴張動搖根基",
    text: "過度的擴張慾望（木）正在損害你的信用與穩定性（土），請注意步調。",
  },
  "earth->water": {
    headline: "體制限制創意",
    text: "僵化的制度或過度追求穩健（土），正在扼殺你原本靈活的智慧流動（水）。",
  },
  "water->fire": {
    headline: "理性壓制熱情",
    text: "絕對的冷靜理性（水）雖然能避險，但也可能讓你的事業缺乏感性紅利（火）。",
  },
  "fire->metal": {
    headline: "情緒破壞規則",
    text: "突發的情緒衝動或追求曝光（火），正在挑戰你辛苦建立的決斷邊界（金）。",
  },
  "metal->wood": {
    headline: "規則扼殺執行",
    text: "嚴苛的管理與自我設限（金），正在剪除你應有的執行活力與成長空間（木）。",
  },
};

function pairKey(a: ElementKey, b: ElementKey): PairKey {
  return `${a}->${b}`;
}

export type FiveElementsDiagnosis = {
  title: string; // 定調
  generation: string; // 相生路徑
  overcoming: string; // 相剋制衡
  weakness: string; // 短板分析
};

/**
 * 五行診斷主函式：
 * - title：一句話定調
 * - generation：相生「母子互動」與能量流向
 * - overcoming：相剋「制衡狀態」與壓力來源
 * - weakness：短板（最弱五行）與補位方向
 */
export function generateDiagnosis(input: ElementScores): FiveElementsDiagnosis {
  const scores: ElementScores = {
    wood: clampEnergyLevel(input.wood),
    fire: clampEnergyLevel(input.fire),
    earth: clampEnergyLevel(input.earth),
    metal: clampEnergyLevel(input.metal),
    water: clampEnergyLevel(input.water),
  };

  const keys: ElementKey[] = ["wood", "fire", "earth", "metal", "water"];
  const levels = keys.map((k) => scores[k]);
  const max = Math.max(...levels);
  const min = Math.min(...levels);

  const { strongest, weakest } = strongestAndWeakest(scores);

  const strongestTxt = `${ELEMENT_ZH[strongest]}（${labelOf(scores[strongest])}）`;
  const weakestTxt = `${ELEMENT_ZH[weakest]}（${labelOf(scores[weakest])}）`;

  // ===== title（定調）=====
  let title = "";
  if (max - min <= 1) {
    title = `五行能量整體偏均衡：以${strongestTxt}帶動、${weakestTxt}需補位。`;
  } else if (max === 3 && min === 0) {
    title = `能量呈兩極：${strongestTxt}過度主導，${weakestTxt}成為瓶頸。`;
  } else if (max === 3) {
    title = `存在過旺能量：${strongestTxt}主導節奏，需注意失衡帶來的代價。`;
  } else if (min === 0) {
    title = `存在明顯短板：${weakestTxt}偏弱，容易拖慢整體推進。`;
  } else {
    title = `能量分布不均：${strongestTxt}偏強、${weakestTxt}偏弱，建議先補短板再談放大優勢。`;
  }

  // ===== generation（相生路徑 + 母子互動）=====
  const elementMeaningLines = keys.map((k) => {
    const m = ELEMENT_CORE_MEANING[k];
    return `- 【${ELEMENT_ZH[k]}｜${m.core}】${meaningText(k, scores[k])}`;
  });

  const genPath = generationCycleFrom(strongest)
    .map((k) => ELEMENT_ZH[k])
    .join("→");

  const motherChildFindings: string[] = [];
  const conversionHighlights: string[] = [];
  (Object.keys(GENERATES_TO) as ElementKey[]).forEach((mother) => {
    const child = GENERATES_TO[mother];
    const m = scores[mother];
    const c = scores[child];
    const badge = relationBadge(m, c);

    const post = GENERATION_POST_STYLE[pairKey(mother, child)];
    const mBand = bandOf(m);
    const cBand = bandOf(c);

    // 先給「深度貼文」的路徑亮點：必須是「母端至少健康」且「子端不至於崩」
    if (post && (mBand === "healthy" || mBand === "excess") && c >= 1) {
      conversionHighlights.push(`【${ELEMENT_ZH[mother]}生${ELEMENT_ZH[child]}｜${post.headline}】${post.text}`);
    }

    if (badge === "強弱") {
      motherChildFindings.push(
        `【母強子弱】${ELEMENT_ZH[mother]}（${labelOf(m)}）生${ELEMENT_ZH[child]}（${labelOf(c)}）：母能量堆積，但轉化/落地到子端不足。`,
      );
    } else if (badge === "弱強") {
      motherChildFindings.push(
        `【母弱子強】${ELEMENT_ZH[mother]}（${labelOf(m)}）生${ELEMENT_ZH[child]}（${labelOf(c)}）：子端耗能快，母端供給跟不上，容易出現「燒乾／透支」。`,
      );
    } else if (badge === "弱弱") {
      motherChildFindings.push(
        `【母弱子弱】${ELEMENT_ZH[mother]}（${labelOf(m)}）→${ELEMENT_ZH[child]}（${labelOf(c)}）：相生鏈條偏弱，推進會斷續，宜先補母端再談擴張。`,
      );
    }
  });

  const generation =
    `元素核心意涵（對照你的能量等級）：\n${elementMeaningLines.join("\n")}\n\n` +
    `能量流向（相生路徑，以最強點為起點）：${genPath}。\n\n` +
    (conversionHighlights.length ? `相生亮點（可視為「能量變現/轉化路徑」）：\n- ${conversionHighlights.join("\n- ")}\n\n` : "") +
    `母子互動診斷：\n- ${motherChildFindings.join("\n- ")}`;

  // ===== overcoming（相剋制衡）=====
  const overcomeFindings: string[] = [];
  const destructiveNotes: string[] = [];
  const constraintNotes: string[] = [];

  (Object.keys(OVERCOMES_TO) as ElementKey[]).forEach((controller) => {
    const target = OVERCOMES_TO[controller];
    const a = scores[controller];
    const b = scores[target];
    const badge = relationBadge(a, b);
    const post = OVERCOMING_POST_STYLE[pairKey(controller, target)];

    if (badge === "強弱") {
      const line =
        post
          ? `【${ELEMENT_ZH[controller]}剋${ELEMENT_ZH[target]}｜${post.headline}】${post.text}`
          : `【強剋弱】${ELEMENT_ZH[controller]}（${labelOf(a)}）剋${ELEMENT_ZH[target]}（${labelOf(b)}）：容易把弱項壓得更難啟動。`;
      destructiveNotes.push(line);
      overcomeFindings.push(
        `【毀滅性破壞】${ELEMENT_ZH[controller]}（${labelOf(a)}）壓制${ELEMENT_ZH[target]}（${labelOf(b)}）：屬於「強剋弱」，建議先止損，避免越補越被剋。`,
      );
    } else if (badge === "弱強") {
      const line =
        post
          ? `【${ELEMENT_ZH[controller]}剋${ELEMENT_ZH[target]}｜${post.headline}】${post.text}`
          : `【制衡不足】${ELEMENT_ZH[controller]}（${labelOf(a)}）剋不動${ELEMENT_ZH[target]}（${labelOf(b)}）：強項缺乏約束容易失控。`;
      constraintNotes.push(line);
      overcomeFindings.push(
        `【制衡不足】${ELEMENT_ZH[controller]}（${labelOf(a)}）壓不住${ELEMENT_ZH[target]}（${labelOf(b)}）：需要補上規則/節奏，讓強項可被管理。`,
      );
    } else if (badge === "強強") {
      overcomeFindings.push(
        `【合理約束】${ELEMENT_ZH[controller]}（${labelOf(a)}）剋${ELEMENT_ZH[target]}（${labelOf(b)}）：屬於「強強對抗」，多半是健康的制衡，能防止走偏。`,
      );
    }
  });

  const overcoming =
    `相剋診斷（判斷是「合理約束」或「毀滅性破壞」）：\n- ${overcomeFindings.join("\n- ")}\n\n` +
    (destructiveNotes.length ? `深度路徑警訊（強剋弱時最明顯）：\n- ${destructiveNotes.join("\n- ")}\n\n` : "") +
    (constraintNotes.length ? `深度路徑提醒（制衡不足時容易出現）：\n- ${constraintNotes.join("\n- ")}\n\n` : "");

  // ===== weakness（短板分析）=====
  const weak = weakest;
  const weakMother = parentOf(weak);
  const weakController = keys.find((k) => OVERCOMES_TO[k] === weak) || "wood";
  const weakChild = GENERATES_TO[weak];

  const weaknessLines: string[] = [];
  weaknessLines.push(
    `短板是【${ELEMENT_ZH[weak]}｜${ELEMENT_CORE_MEANING[weak].core}】：目前屬於「${labelOf(scores[weak])}」等級（${meaningText(weak, scores[weak])}）。`,
  );

  const motherBadge = relationBadge(scores[weakMother], scores[weak]);
  if (motherBadge === "強弱") {
    weaknessLines.push(
      `母端【${ELEMENT_ZH[weakMother]}】不弱但沒能有效生出【${ELEMENT_ZH[weak]}】：優先把母端能量「轉成可執行/可承接」的形式。`,
    );
  } else if (motherBadge === "弱弱") {
    weaknessLines.push(
      `母端【${ELEMENT_ZH[weakMother]}】也偏弱：屬於「上游供應不足」，需要先補母再補子。`,
    );
  } else if (motherBadge === "弱強") {
    weaknessLines.push(
      `雖然【${ELEMENT_ZH[weak]}】不強，但母端更弱：避免直接硬補短板，先修復母端供能，否則容易反覆。`,
    );
  }

  const controlBadge = relationBadge(scores[weakController], scores[weak]);
  if (controlBadge === "強弱") {
    weaknessLines.push(
      `壓力來源之一是【${ELEMENT_ZH[weakController]}】偏強而剋到【${ELEMENT_ZH[weak]}】：短期策略是「先減壓再補」。`,
    );
  }

  // 連動：弱項的子端也會受影響（因為弱生弱/弱生不出）
  if (scores[weak] <= 1 && scores[weakChild] <= 1) {
    weaknessLines.push(
      `連動影響：因【${ELEMENT_ZH[weak]}】偏弱，下一站【${ELEMENT_ZH[weakChild]}】也容易跟著弱，推進感會斷續。`,
    );
  }

  // 你提供的規則：當某一項分數低於 1.0（此引擎為 0-3 整數 → 以 0 視為「缺」）就觸發補救建議
  const missing = keys.filter((k) => scores[k] === 0);
  if (missing.length) {
    weaknessLines.push("");
    weaknessLines.push("補救建議（分數=0 自動觸發，可適度調整）：");
    missing.forEach((k) => {
      weaknessLines.push(`- 缺${ELEMENT_ZH[k]}：${ELEMENT_CORE_MEANING[k].remedy}`);
    });
  }

  const weakness = weaknessLines.join("\n");

  return { title, generation, overcoming, weakness };
}

