/**
 * Lifebook V2：分數權重設定。
 * 供 Score Engine 與 Path Reasoner 使用。
 */

/** 四化基礎分 */
export const TRANSFORM_SCORE: Record<string, number> = {
  祿: 3,
  權: 2,
  科: 1,
  忌: -3,
};

/** 宮位權重（命／財／官等加權） */
export const PALACE_WEIGHT: Record<string, number> = {
  命宮: 1.2,
  財帛宮: 1.4,
  官祿宮: 1.3,
  福德宮: 1.1,
  田宅宮: 1.2,
  僕役宮: 1.0,
  兄弟宮: 0.9,
  疾厄宮: 1.0,
  夫妻宮: 1.0,
  子女宮: 0.9,
  遷移宮: 1.0,
  父母宮: 0.9,
};

/** 時間層權重 */
export const LAYER_WEIGHT: Record<string, number> = {
  natal: 1.0,
  decade: 1.3,
  year: 1.5,
};

/** 疊宮倍率 */
export const STACK_MULTIPLIER: Record<string, number> = {
  double_stack: 1.6,
  triple_stack: 2.1,
  lu_ji_collision: 1.7,
  quan_ji_collision: 1.5,
  self_transform_focus: 1.3,
  path_cluster: 1.8,
};
