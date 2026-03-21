/**
 * S18 專用：12 宮短句對照表。
 * 用於重點說明時把宮位翻成人話，格式「短句1／短句2／短句3」；一眼看懂，不寫長句。
 * 盤點依據：docs/lifebook-s18-semantic-inventory.md
 */

/** 12 宮 S18 短句（3 個短語，／ 分隔） */
export const PALACE_SHORT_LABEL_MAP: Record<string, string> = {
  命宮: "自己／狀態／選擇",
  兄弟宮: "同儕／合作／平行關係",
  夫妻宮: "感情／伴侶／一對一關係",
  子女宮: "子女／創作／延伸成果",
  財帛宮: "收入／現金流／資源調度",
  疾厄宮: "壓力／身心／內在負荷",
  遷移宮: "外部／環境／對外發展",
  僕役宮: "人際／客戶／團隊",
  官祿宮: "工作／責任／角色",
  田宅宮: "資產／基礎／留存能力",
  福德宮: "心態／精神／內在狀態",
  父母宮: "制度／長輩／支持系統",
};

/**
 * 取得宮位 S18 短句；若無則回傳原宮名。
 * 用於 S18 重點說明：優先把宮位翻成人話，再括號標宮名，例如「工作／責任／角色（官祿宮）」。
 */
export function getPalaceShortLabel(palaceName: string): string {
  const s = (palaceName ?? "").trim();
  if (!s) return "";
  const withSuffix = s.endsWith("宮") ? s : s + "宮";
  return PALACE_SHORT_LABEL_MAP[withSuffix] ?? palaceName;
}
