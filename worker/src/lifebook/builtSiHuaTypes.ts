/**
 * Worker 權威四化「顯示層」型別（normalizeChart + mutagenStars 推導後之結構）。
 * 與客戶端 wire `ClientSihuaLayers`（chartJson.sihuaLayers）分開命名，避免混用。
 */

/** 單一化星：星名＋落宮（自化／飛入脈絡用） */
export type BuiltSiHuaStar = {
  starName: string;
  palaceKey: string;
  palaceName: string;
  transformType: "lu" | "quan" | "ke" | "ji";
};

/** 一層四化：祿／權／科／忌 各一筆（可為 null） */
export type BuiltSiHuaLayer = {
  lu?: BuiltSiHuaStar | null;
  quan?: BuiltSiHuaStar | null;
  ke?: BuiltSiHuaStar | null;
  ji?: BuiltSiHuaStar | null;
};

/** 本命／大限／流年 三層（worker 產物） */
export type BuiltSiHuaLayers = {
  benming?: BuiltSiHuaLayer;
  decadal?: BuiltSiHuaLayer;
  yearly?: BuiltSiHuaLayer;
};
