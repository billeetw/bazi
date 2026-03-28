/**
 * 客戶端 chartJson.sihuaLayers（wire）與 worker BuiltSiHuaLayers 的比對／除錯。
 * Phase 2：正式管線內不自動記錄；僅在 LIFEBOOK_CLIENT_SIHUA_DIFF_LOG=1 時由 buildSiHuaLayers 觸發，
 * 或由 compare 工具／debug endpoint 直接呼叫。
 */

import type { BuiltSiHuaLayer, BuiltSiHuaLayers, BuiltSiHuaStar } from "./builtSiHuaTypes.js";
import { getNodeProcessEnv } from "./nodeEnv.js";
import { PALACES, STAR_ID_TO_NAME } from "./schema.js";
import { toPalaceCanonical } from "./canonicalKeys.js";

/** 標記客戶端欄位已廢止，僅供型別提示；執行期與 T 相同。 */
export type Deprecated<T> = T & { readonly __deprecated?: "ClientSihuaLayers" };

const RING = PALACES.map((p) => p.name);

const STAR_ID_TO_DISPLAY: Record<string, string> = {
  ...(STAR_ID_TO_NAME as Record<string, string>),
  zuoFu: "左輔",
  youBi: "右弼",
  wenChang: "文昌",
  wenQu: "文曲",
  luCun: "祿存",
  tianMa: "天馬",
  tianKui: "天魁",
  tianYue: "天鉞",
  qingYang: "擎羊",
  tuoLuo: "陀羅",
  huoXing: "火星",
  lingXing: "鈴星",
  diKong: "地空",
  diJie: "地劫",
};

function normPalaceWire(id: string): string {
  if (!id) return "";
  const lower = id.replace(/宮$/, "").toLowerCase();
  const map: Record<string, string> = {
    ming: "命宮",
    xiongdi: "兄弟宮",
    xiongDi: "兄弟宮",
    fupo: "夫妻宮",
    fuPo: "夫妻宮",
    ziNv: "子女宮",
    zinv: "子女宮",
    cai: "財帛宮",
    jiE: "疾厄宮",
    jie: "疾厄宮",
    qianyi: "遷移宮",
    qianYi: "遷移宮",
    puyi: "僕役宮",
    puYi: "僕役宮",
    guanglu: "官祿宮",
    guanLu: "官祿宮",
    tianzhai: "田宅宮",
    tianZhai: "田宅宮",
    fude: "福德宮",
    fuDe: "福德宮",
    fumu: "父母宮",
    fuMu: "父母宮",
  };
  const fromMap = map[lower];
  if (fromMap) return fromMap.endsWith("宮") ? fromMap : fromMap + "宮";
  return id.endsWith("宮") ? id : id + "宮";
}

function getOppositePalaceName(palaceName: string): string {
  if (!palaceName || !RING.length) return "";
  const key = palaceName.replace(/宮$/, "") === "命" ? "命宮" : palaceName;
  const idx = key === "命宮" ? 0 : RING.findIndex((p) => p === key || (p !== "命宮" && p + "宮" === key));
  if (idx < 0) return "";
  const oppIdx = (idx + 6) % 12;
  const opp = RING[oppIdx];
  return opp ? (opp.endsWith("宮") ? opp : opp === "命宮" ? "命宮" : opp + "宮") : "";
}

const SLOT_KEYS = ["lu", "quan", "ke", "ji"] as const;
export type SiHuaSlotKey = (typeof SLOT_KEYS)[number];

export interface SiHuaSlotSnapshot {
  starName: string;
  /** 飛入之「目標宮」（與 client.toPalace / worker 對宮飛入一致） */
  toPalace: string;
}

export type LayerSlotMap = Partial<Record<SiHuaSlotKey, SiHuaSlotSnapshot>>;

export interface LayerDiffDetail {
  slot: SiHuaSlotKey;
  client: SiHuaSlotSnapshot | null;
  worker: SiHuaSlotSnapshot | null;
  match: boolean;
}

export interface NamedLayerDiff {
  layerKey: "benming" | "decadal" | "yearly";
  /** 客戶端對應區塊是否有 transforms */
  clientPresent: boolean;
  workerPresent: boolean;
  matches: boolean;
  slotDiffs: LayerDiffDetail[];
}

export interface ClientSihuaLayersDiffReport {
  hasClientSihuaLayers: boolean;
  mismatchCount: number;
  layers: NamedLayerDiff[];
}

/** @deprecated 改用 ClientSihuaLayersDiffReport */
export type SihuaLayersDiffReport = ClientSihuaLayersDiffReport;

/** @deprecated 與 BuiltSiHuaLayers 同形；請用 BuiltSiHuaLayers */
export type WorkerSiHuaLayersShape = BuiltSiHuaLayers;

function workerStarToSnapshot(star: BuiltSiHuaStar | null | undefined): SiHuaSlotSnapshot | null {
  if (!star?.starName?.trim()) return null;
  const from = (star.palaceName ?? star.palaceKey ?? "").trim();
  const toRaw = from ? getOppositePalaceName(from) : "";
  const toPalace = toRaw ? toPalaceCanonical(toRaw) : "";
  return { starName: star.starName.trim(), toPalace };
}

function workerLayerToSlotMap(layer: BuiltSiHuaLayer | undefined): LayerSlotMap {
  if (!layer) return {};
  const m: LayerSlotMap = {};
  for (const k of SLOT_KEYS) {
    const snap = workerStarToSnapshot(layer[k] ?? null);
    if (snap) m[k] = snap;
  }
  return m;
}

/** 客戶端 wire 層（chartJson.sihuaLayers）單筆 transform */
interface WireTransform {
  starId: string;
  type: SiHuaSlotKey;
  toPalace: string;
}

function clientTransformsToSlotMap(transforms: WireTransform[] | undefined): LayerSlotMap {
  if (!Array.isArray(transforms)) return {};
  const m: LayerSlotMap = {};
  for (const t of transforms) {
    if (!SLOT_KEYS.includes(t.type as SiHuaSlotKey)) continue;
    const starName = (STAR_ID_TO_DISPLAY[t.starId] ?? t.starId).trim();
    const toPalace = toPalaceCanonical(normPalaceWire(t.toPalace ?? ""));
    m[t.type as SiHuaSlotKey] = { starName, toPalace };
  }
  return m;
}

function compareSlotMaps(client: LayerSlotMap, worker: LayerSlotMap): LayerDiffDetail[] {
  const details: LayerDiffDetail[] = [];
  const keys = new Set([...Object.keys(client), ...Object.keys(worker)] as SiHuaSlotKey[]);
  for (const slot of keys) {
    const c = client[slot] ?? null;
    const w = worker[slot] ?? null;
    const match =
      (!c && !w) ||
      Boolean(
        c &&
          w &&
          c.starName === w.starName &&
          c.toPalace.replace(/宮$/, "") === w.toPalace.replace(/宮$/, "")
      );
    details.push({ slot, client: c, worker: w, match });
  }
  return details;
}

/** 是否帶有客戶端 sihuaLayers（任一有 transforms 即視為有） */
export function hasClientSihuaLayers(chartJson: Record<string, unknown> | undefined): boolean {
  if (!chartJson) return false;
  const raw = chartJson.sihuaLayers as
    | {
        benMing?: { transforms?: unknown[] };
        daXianCurrent?: { transforms?: unknown[] };
        liuNianCurrent?: { transforms?: unknown[] };
      }
    | undefined;
  if (!raw) return false;
  const n = (a: unknown[] | undefined) => (Array.isArray(a) ? a.length : 0);
  return n(raw.benMing?.transforms) + n(raw.daXianCurrent?.transforms) + n(raw.liuNianCurrent?.transforms) > 0;
}

/**
 * Phase 2：設為 `"1"` 時，buildSiHuaLayers 會在結尾呼叫 maybeLogClientSihuaLayersDiff（僅當請求帶有 client sihuaLayers）。
 * 比對工具可直接呼叫 compareClientSihuaLayersToWorker，無需此變數。
 */
export function isClientSihuaLayersDiffLogEnabled(): boolean {
  return getNodeProcessEnv("LIFEBOOK_CLIENT_SIHUA_DIFF_LOG") === "1";
}

/**
 * 計算路徑不應讀取 client `sihuaLayers` wire。預設在 **未** 開啟 diff log 時於 `buildSiHuaLayers` 內淺拷貝移除該鍵，降低誤用與下游日誌外洩面。
 * - 設 `LIFEBOOK_CLIENT_SIHUA_DIFF_LOG=1` 時保留 wire（供 `maybeLogClientSihuaLayersDiff`）。
 * - 設 `LIFEBOOK_KEEP_CLIENT_SIHUA_WIRE=1` 時一律保留（相容舊除錯／外層仍讀取 chart 快照的場景）。
 */
export function isDeprecatedClientSihuaWireOmittedForCompute(): boolean {
  if (getNodeProcessEnv("LIFEBOOK_KEEP_CLIENT_SIHUA_WIRE") === "1") return false;
  if (isClientSihuaLayersDiffLogEnabled()) return false;
  return true;
}

/** 淺拷貝並省略 `sihuaLayers`（若上述 gate 為 true）；否則回傳同一參照。 */
export function omitClientSihuaWireForCompute(chartJson: Record<string, unknown>): Record<string, unknown> {
  if (!isDeprecatedClientSihuaWireOmittedForCompute()) return chartJson;
  if (!Object.prototype.hasOwnProperty.call(chartJson, "sihuaLayers")) return chartJson;
  const { sihuaLayers: _omit, ...rest } = chartJson;
  return rest;
}

/**
 * 比對客戶端 sihuaLayers 與 worker 已算出的 BuiltSiHuaLayers（祿權科忌 × 星名 × 飛入宮）。
 */
export function compareClientSihuaLayersToWorker(
  chartJson: Record<string, unknown>,
  workerLayers: BuiltSiHuaLayers
): ClientSihuaLayersDiffReport {
  const raw = chartJson.sihuaLayers as
    | {
        benMing?: { transforms?: WireTransform[] };
        daXianCurrent?: { transforms?: WireTransform[] };
        liuNianCurrent?: { transforms?: WireTransform[] };
      }
    | undefined;

  const pairs: Array<{
    layerKey: NamedLayerDiff["layerKey"];
    clientTransforms: WireTransform[] | undefined;
    workerLayer: BuiltSiHuaLayer | undefined;
  }> = [
    { layerKey: "benming", clientTransforms: raw?.benMing?.transforms, workerLayer: workerLayers.benming },
    { layerKey: "decadal", clientTransforms: raw?.daXianCurrent?.transforms, workerLayer: workerLayers.decadal },
    { layerKey: "yearly", clientTransforms: raw?.liuNianCurrent?.transforms, workerLayer: workerLayers.yearly },
  ];

  const layers: NamedLayerDiff[] = [];
  let mismatchCount = 0;

  for (const { layerKey, clientTransforms, workerLayer } of pairs) {
    const workerMap = workerLayerToSlotMap(workerLayer);
    const workerPresent = Object.keys(workerMap).length > 0;
    const clientHasTransforms = Array.isArray(clientTransforms) && clientTransforms.length > 0;

    if (!clientHasTransforms) {
      layers.push({
        layerKey,
        clientPresent: false,
        workerPresent,
        matches: true,
        slotDiffs: [],
      });
      continue;
    }

    const clientMap = clientTransformsToSlotMap(clientTransforms);
    const slotDiffs = compareSlotMaps(clientMap, workerMap);
    const matches = slotDiffs.every((d) => d.match);
    if (!matches) mismatchCount += slotDiffs.filter((d) => !d.match).length;
    layers.push({
      layerKey,
      clientPresent: true,
      workerPresent,
      matches,
      slotDiffs,
    });
  }

  return {
    hasClientSihuaLayers: hasClientSihuaLayers(chartJson),
    mismatchCount,
    layers,
  };
}

/**
 * 將 client vs worker 差異寫入 console（由 buildSiHuaLayers 在旗標開啟時呼叫，或除錯端點手動呼叫）。
 * - 有偏差：`console.warn`
 * - 無偏差：僅在 `LIFEBOOK_CLIENT_SIHUA_DIFF_VERBOSE=1` 時 `console.info`
 */
export function maybeLogClientSihuaLayersDiff(
  chartJson: Record<string, unknown> | undefined,
  workerLayers: BuiltSiHuaLayers
): void {
  if (!chartJson || !hasClientSihuaLayers(chartJson)) return;
  const diff = compareClientSihuaLayersToWorker(chartJson, workerLayers);
  const payload = {
    tag: "lifebook/sihua-diff",
    mismatchCount: diff.mismatchCount,
    layers: diff.layers.map((L) => ({
      layer: L.layerKey,
      clientPresent: L.clientPresent,
      workerPresent: L.workerPresent,
      matches: L.matches,
      mismatches: L.slotDiffs.filter((d) => !d.match).map((d) => ({
        slot: d.slot,
        client: d.client,
        worker: d.worker,
      })),
    })),
  };
  const verbose = getNodeProcessEnv("LIFEBOOK_CLIENT_SIHUA_DIFF_VERBOSE") === "1";
  if (diff.mismatchCount > 0) {
    console.warn(JSON.stringify(payload));
  } else if (verbose) {
    console.info(JSON.stringify({ ...payload, note: "client matches worker snapshot" }));
  }
}
