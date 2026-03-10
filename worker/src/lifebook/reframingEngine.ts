/**
 * 顧問式改寫引擎：命理語 → 顧問語，供 s00／s03／未來 Q&A 使用。
 * 不替代命理語言，只提供可共用的翻譯詞條。
 */

import type { ReframedPhrase } from "./diagnosticTypes.js";

export interface ReframeDictionaryEntry {
  key: string;
  rawLabel: string;
  professionalLabel: string;
  narrative: string;
}

const REFRAME_DICTIONARY: ReframeDictionaryEntry[] = [
  { key: "財帛宮忌", rawLabel: "財帛宮化忌", professionalLabel: "財務防火牆漏洞", narrative: "資源與回報的焦慮容易顯化在實際決策上，建議先設防火牆再擴張。" },
  { key: "財帛宮祿忌並見", rawLabel: "財帛宮祿忌並見", professionalLabel: "回報與焦慮綁定", narrative: "機會與壓力同時落在資源宮，容易一邊得到一邊焦慮，需要區分紅利與成本。" },
  { key: "財帛宮權忌", rawLabel: "財帛宮權忌", professionalLabel: "資源配置失衡", narrative: "責任與壓力都在資源宮，容易過度承擔或配置失衡，建議先分配再加碼。" },
  { key: "田宅宮忌", rawLabel: "田宅宮化忌", professionalLabel: "根基焦慮", narrative: "根基與安全感容易成為隱性壓力源，先穩住再對外擴張。" },
  { key: "田宅宮權忌", rawLabel: "田宅宮權忌", professionalLabel: "安全感成本過高", narrative: "為穩而扛的責任與壓力都大，需要區分什麼該守、什麼可以放。" },
  { key: "官祿宮權", rawLabel: "官祿宮化權", professionalLabel: "垂直命令系統", narrative: "角色與責任感強，容易什麼都自己扛，建議建立分工與授權。" },
  { key: "官祿宮權忌", rawLabel: "官祿宮權忌", professionalLabel: "角色壓力過載", narrative: "事業與角色同時承受壓力與責任，需要設停損與分工。" },
  { key: "官祿宮忌入夫妻宮", rawLabel: "官祿忌入夫妻", professionalLabel: "職場壓力外溢到關係", narrative: "工作與角色的壓力往往會在伴侶與合夥關係中被看見，先處理角色邊界。" },
  { key: "官祿宮忌入福德宮", rawLabel: "官祿忌入福德", professionalLabel: "角色消耗內在能量", narrative: "責任與角色會消耗內在恢復力，需要先劃清界線再扛。" },
  { key: "夫妻宮受壓", rawLabel: "夫妻宮受壓", professionalLabel: "橫向合作耐心下降", narrative: "一對一關係容易因壓力而失去耐心，先穩住自己再談合作。" },
  { key: "僕役宮祿忌並見", rawLabel: "僕役宮祿忌並見", professionalLabel: "人脈紅利與人際成本並存", narrative: "人際既有機會也有負擔，需要區分哪些是資源、哪些是消耗。" },
  { key: "兄弟宮忌", rawLabel: "兄弟宮化忌", professionalLabel: "平行關係摩擦升高", narrative: "同儕與手足關係容易出現摩擦，先分工再合作。" },
  { key: "福德宮忌", rawLabel: "福德宮化忌", professionalLabel: "內在耗能", narrative: "內在恢復與情緒容易耗損，需要先補能再接更多事。" },
  { key: "福德宮祿忌並見", rawLabel: "福德宮祿忌並見", professionalLabel: "情緒紅利與精神成本並存", narrative: "內在有得到也有消耗，需要區分什麼在補你、什麼在耗你。" },
  { key: "疾厄宮忌", rawLabel: "疾厄宮化忌", professionalLabel: "修復系統負載", narrative: "身體與壓力容易累積，先辨認自己累了再決定要不要撐。" },
  { key: "田宅宮忌入子女宮", rawLabel: "田宅忌入子女", professionalLabel: "安全感焦慮轉成創造壓力", narrative: "根基的不安容易在創造與產出時顯化，先穩住底層再求產出。" },
  { key: "命宮忌", rawLabel: "命宮化忌", professionalLabel: "自我定位壓力", narrative: "自我與方向感容易承受壓力，先站穩自己是誰再回應世界。" },
  { key: "遷移宮忌", rawLabel: "遷移宮化忌", professionalLabel: "對外舞台壓力", narrative: "對外表現與變動容易帶來壓力，先知道自己站在哪裡再走出去。" },
  { key: "父母宮忌", rawLabel: "父母宮化忌", professionalLabel: "規範與期待壓力", narrative: "權威與期待容易成為隱性壓力，先分清楚哪些值得承接。" },
  { key: "子女宮忌", rawLabel: "子女宮化忌", professionalLabel: "創造與產出壓力", narrative: "創造與傳承容易伴隨壓力，先讓產出有呼吸空間再求完美。" },
];

/**
 * 依 key 回傳單一顧問式改寫詞條；無則 null。
 */
export function reframeDiagnosticKey(key: string): ReframedPhrase | null {
  const k = (key ?? "").trim();
  if (!k) return null;
  const entry = REFRAME_DICTIONARY.find(
    (e) => e.key === k || e.key.replace(/\s/g, "") === k.replace(/\s/g, "")
  );
  if (!entry) return null;
  return {
    key: entry.key,
    rawLabel: entry.rawLabel,
    professionalLabel: entry.professionalLabel,
    narrative: entry.narrative,
  };
}

/**
 * 依 key 陣列回傳對應的顧問式改寫詞條（有則納入，無則略過）。
 */
export function buildReframedNarrative(keys: string[]): ReframedPhrase[] {
  if (!Array.isArray(keys)) return [];
  const out: ReframedPhrase[] = [];
  const seen = new Set<string>();
  for (const k of keys) {
    const r = reframeDiagnosticKey(k);
    if (r && !seen.has(r.key)) {
      seen.add(r.key);
      out.push(r);
    }
  }
  return out;
}
