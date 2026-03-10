/**
 * 星曜／宮位／四化語義字典：供四化敘事轉成「人話」，避免直接輸出「{starName} 議題」「當 {starName} 被觸發」。
 * 命書風格，不當字典解釋書。
 */

export interface StarSemantic {
  core: string;
  plain: string;
  themes: string[];
  risk: string;
  advice: string;
}

export interface PalaceSemantic {
  core: string;
  plain: string;
  /** Flow 等括號內短版，如：穩定感、歸屬與生活根基 */
  short?: string;
}

export interface TransformSemantic {
  label: string;
  core: string;
  plain: string;
  advice: string;
}

export const STAR_SEMANTIC_DICTIONARY: Record<string, StarSemantic> = {
  紫微: {
    core: "領導、主導權與中心角色",
    plain: "你在意自己是否有位置、有影響力、能不能掌握局面。",
    themes: ["領導", "權威", "決策", "位置感", "掌控感"],
    risk: "容易把壓力變成責任全扛，或太在意自己是否被看見。",
    advice: "先確認自己真正要掌握的是方向、資源還是責任，不要什麼都一起扛。",
  },
  天機: {
    core: "思考、策略、變化與判斷",
    plain: "你會一直思考怎麼做比較好，也很在意選擇與變動。",
    themes: ["思考", "判斷", "策略", "規劃", "變化"],
    risk: "容易想太多、改太快，或一直優化卻遲遲不落地。",
    advice: "先定一個可執行的版本，再邊做邊調整。",
  },
  太陽: {
    core: "行動、表現、責任與外在成就",
    plain: "你會把很多事往外扛，也在意自己是否有貢獻、有表現。",
    themes: ["責任", "表現", "成就", "外在形象", "付出"],
    risk: "容易因為責任感過強而透支，或把自我價值綁在表現上。",
    advice: "先分清楚哪些責任是你的，哪些只是你習慣多扛。",
  },
  武曲: {
    core: "資源管理、成果、金錢與現實回報",
    plain: "你很在意事情有沒有結果、資源怎麼配置、投入值不值得。",
    themes: ["金錢", "資源", "成果", "效率", "責任分配"],
    risk: "容易只看結果與得失，忽略感受與關係成本。",
    advice: "先做資源配置與風險設計，再決定要不要加碼投入。",
  },
  天同: {
    core: "情緒、安全感與舒適節奏",
    plain: "你很在意事情做起來舒不舒服、關係穩不穩、內在安不安全。",
    themes: ["情緒", "安全感", "舒服", "人際溫度", "生活節奏"],
    risk: "容易因為想維持和諧而延後面對現實，或在安穩與改變之間拉扯。",
    advice: "先穩住情緒與節奏，再做決定，不要被當下感受推著走。",
  },
  廉貞: {
    core: "慾望、權力、界線與突破",
    plain: "你會特別在意想要什麼、界線在哪裡、怎麼突破限制。",
    themes: ["慾望", "界線", "權力", "吸引力", "突破"],
    risk: "容易在想要與克制之間拉扯，或因為太想突破而把自己逼太緊。",
    advice: "先說清楚自己真正要的是什麼，再決定要不要硬闖。",
  },
  天府: {
    core: "穩定、承接、累積與資源保存",
    plain: "你重視穩定與安全，也擅長把東西留住、養大、做長期安排。",
    themes: ["穩定", "累積", "保存", "承接", "長期配置"],
    risk: "容易太保守，或為了穩而延後必要的改變。",
    advice: "保留穩定優勢，但要區分什麼該守、什麼該動。",
  },
  太陰: {
    core: "感受、內在需求、情感與細膩觀察",
    plain: "你很看重內在感受，也容易先從情緒與氛圍感知世界。",
    themes: ["情感", "內在需求", "安全需求", "關係感受", "細膩"],
    risk: "容易受氛圍影響，或把很多話放在心裡不說。",
    advice: "先辨認真正的需求，再決定要不要迎合眼前的氣氛。",
  },
  貪狼: {
    core: "機會、慾望、社交與擴張",
    plain: "你對機會很敏感，也常被新鮮感、人際互動或想要更多的感覺推動。",
    themes: ["機會", "社交", "慾望", "擴張", "吸引"],
    risk: "容易分心、貪多，或明明知道太多卻很難收斂。",
    advice: "先選主線，再決定哪些機會值得追，不要全部都想要。",
  },
  巨門: {
    core: "觀點、溝通、辯證與理解真相",
    plain: "你很在意事情到底是不是這樣，也容易從溝通、資訊與觀點差異中看見問題。",
    themes: ["溝通", "辯論", "資訊", "觀點", "真相"],
    risk: "容易把求真變成求勝，或在誤解與爭論裡消耗自己。",
    advice: "先釐清事實，再處理情緒；先求共識，再求正確。",
  },
  天相: {
    core: "平衡、秩序、協調與制度感",
    plain: "你很在意公平不公平、規則穩不穩、事情有沒有被安排好。",
    themes: ["平衡", "協調", "秩序", "制度", "公平"],
    risk: "容易為了顧全局而壓抑自己，或過度依賴規則感。",
    advice: "先確認你是在維持平衡，還是在犧牲自己換平衡。",
  },
  天梁: {
    core: "保護、價值感、道德判斷與承擔",
    plain: "你很容易去照顧、保護或支撐別人，也在意事情對不對、值不值得。",
    themes: ["保護", "照顧", "價值感", "道德", "承擔"],
    risk: "容易把自己放在拯救者位置，最後變成過度負責。",
    advice: "先分清楚什麼是你的責任，什麼只是你的善意。",
  },
  七殺: {
    core: "果斷、破局、壓力下的決斷與重建",
    plain: "你遇到事情時，很可能會直接切進重點，必要時寧可重來。",
    themes: ["決斷", "破局", "壓力處理", "重建", "果敢"],
    risk: "容易太快切斷、太快進場，讓自己一直處在高壓模式。",
    advice: "保留決斷力，但先確認這次真的需要破而後立。",
  },
  破軍: {
    core: "變革、拆解、重新開始與推翻舊框架",
    plain: "你的人生很容易走向改變、更新、打掉重來，不太適合長期停在舊模式。",
    themes: ["變革", "重來", "更新", "拆解", "新局"],
    risk: "容易為了突破而破壞過多，或還沒站穩就急著翻新。",
    advice: "把改變當策略，不要把破壞當答案。",
  },
};

export const PALACE_SEMANTIC_DICTIONARY: Record<string, PalaceSemantic> = {
  命宮: { core: "自我定位與人生方向", plain: "你是怎麼看待自己、怎麼活出自己的。", short: "自我定位與人生方向" },
  兄弟宮: { core: "同儕、手足與合作關係", plain: "你怎麼與同輩互動、協作與分工。", short: "同儕、手足與合作" },
  夫妻宮: { core: "親密關係與合作關係", plain: "你在一對一關係裡如何投入、期待與磨合。", short: "親密關係與一對一合作" },
  子女宮: { core: "創造、延伸成果與內在產出", plain: "你創造出來的東西，以及你如何對待延伸出去的成果。", short: "創造與延伸成果" },
  財帛宮: { core: "資源、收入、交換與現實配置", plain: "你怎麼賺、怎麼花、怎麼衡量投入與回報。", short: "金錢、資源配置與投入回報" },
  疾厄宮: { core: "身心壓力、修復與耗損", plain: "你在壓力下怎麼撐、怎麼累、怎麼修復自己。", short: "身心壓力與修復" },
  遷移宮: { core: "外部環境、移動與與世界互動", plain: "你離開熟悉場域後，怎麼面對外界與變化。", short: "外部環境與移動" },
  僕役宮: { core: "團隊、人脈與人際系統", plain: "你怎麼在群體、人脈與合作網絡裡運作。", short: "團隊、人脈與人際" },
  官祿宮: { core: "事業、角色、責任與社會位置", plain: "你怎麼做事、扛責任、建立成績與定位。", short: "事業、角色與責任" },
  田宅宮: { core: "安全感、根基、居所與可安放之處", plain: "你怎麼建立穩定感、歸屬感與生活根基。", short: "穩定感、歸屬與生活根基" },
  福德宮: { core: "內在狀態、精神能量與情緒底盤", plain: "你怎麼休息、怎麼感受、怎麼與自己相處。", short: "情緒、內在狀態與精神能量" },
  父母宮: { core: "權威、支持來源與價值框架", plain: "你如何面對規範、期待、權威與支撐系統。", short: "權威、支持與價值框架" },
};

export const TRANSFORM_SEMANTIC_DICTIONARY: Record<string, TransformSemantic> = {
  lu: { label: "祿", core: "資源與機會的流動", plain: "這裡比較容易出現可利用的資源、機會與回報。", advice: "先看怎麼累積，而不是只看眼前好處。" },
  quan: { label: "權", core: "責任、主導與推動力", plain: "這裡容易出現需要你主動決定、主動扛起的情況。", advice: "先定規則與分工，再往前推。" },
  ke: { label: "科", core: "修正、理解與方法", plain: "這裡適合靠學習、方法與系統優化來改善。", advice: "先找對方法，再加大努力。" },
  ji: { label: "忌", core: "壓力、卡點與修正點", plain: "這裡比較容易出現卡住、反覆、焦慮或需要修正的感覺。", advice: "先穩住節奏與界線，再處理問題本身。" },
};

/** 星名正規化：支援簡稱或含宮字尾比對 */
function normStarKey(name: string): string {
  const s = (name ?? "").trim();
  if (!s) return "";
  return s.replace(/^星$/, "").trim() || "";
}

/**
 * 取得星曜語義，供敘事替換使用。若無對應則回傳原星名與空語義。
 */
export function getStarSemantic(starName: string): StarSemantic | null {
  const key = normStarKey(starName);
  if (!key) return null;
  const exact = STAR_SEMANTIC_DICTIONARY[key];
  if (exact) return exact;
  for (const [k, v] of Object.entries(STAR_SEMANTIC_DICTIONARY)) {
    if (key === k || key.includes(k) || k.includes(key)) return v;
  }
  return null;
}

/**
 * 用於「X代表『…』」與「當與『…』相關的事情被引動時」的語義片段。
 * coreForQuote: 放進『』的核心句；themesPhrase: 主題列（themes 前幾項拼接，人話用）。
 */
export function getStarSemanticPhrases(starName: string): { coreForQuote: string; themesPhrase: string; name: string } {
  const sem = getStarSemantic(starName);
  const name = (starName ?? "").trim() || "該星";
  if (!sem) return { coreForQuote: "該星所象徵的領域", themesPhrase: "該星相關", name };
  const themesPhrase = sem.themes.length > 0
    ? sem.themes.slice(0, 4).join("、")
    : sem.core;
  return { coreForQuote: sem.core, themesPhrase, name };
}

/**
 * 用於「遇到 X 類議題」→「當涉及『themes』相關的事情時」的替換。
 * 回傳可放進句子的片段，避免直接寫「{starName} 議題」。
 */
export function getStarThemesSentenceLead(starName: string): string {
  const sem = getStarSemantic(starName);
  if (!sem) return (starName || "該星") + " 相關";
  const themes = sem.themes.slice(0, 3).join("、");
  return themes ? `與「${themes}」相關的事情` : `與「${sem.core}」相關的事情`;
}

/** 宮位語義，key 支援「XX宮」或「XX」 */
export function getPalaceSemantic(palaceName: string): PalaceSemantic | null {
  const s = (palaceName ?? "").trim();
  if (!s) return null;
  const withSuffix = s.endsWith("宮") ? s : s + "宮";
  return PALACE_SEMANTIC_DICTIONARY[withSuffix] ?? PALACE_SEMANTIC_DICTIONARY[s] ?? null;
}

/** 四化語義，key: lu | quan | ke | ji */
export function getTransformSemantic(transformKey: string): TransformSemantic | null {
  const k = (transformKey ?? "").trim().toLowerCase();
  if (k === "lu" || k === "quan" || k === "ke" || k === "ji") return TRANSFORM_SEMANTIC_DICTIONARY[k];
  return null;
}
