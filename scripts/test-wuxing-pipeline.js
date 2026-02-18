/**
 * 五行 pipeline 測試：驗證已知四柱的 v_raw、v_season 計算
 * 執行：node scripts/test-wuxing-pipeline.js
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// 載入 pipeline（會掛到 globalThis）
await import("../js/calc/wuxingFlowPipeline.js");
const { runPipeline } = globalThis.WuxingFlowPipeline;

// 載入 KB
function loadKBFromDisk() {
  const dataDir = join(root, "data/wuxing");
  const elements = JSON.parse(readFileSync(join(dataDir, "elements.json"), "utf8"));
  const stems = JSON.parse(readFileSync(join(dataDir, "stems.json"), "utf8"));
  const branches = JSON.parse(readFileSync(join(dataDir, "branches.json"), "utf8"));
  const monthBranches = JSON.parse(readFileSync(join(dataDir, "month_branches.json"), "utf8"));
  const flowDesc = JSON.parse(readFileSync(join(dataDir, "flow_descriptions.json"), "utf8"));
  return {
    elements: elements.elements || [],
    gen_edges: elements.gen_edges || [],
    ctl_edges: elements.ctl_edges || [],
    stems: stems.stems || [],
    branches: branches.branches || [],
    month_branches: monthBranches.month_branches || [],
    flow_descriptions: flowDesc,
  };
}

const kb = loadKBFromDisk();

// 測試案例：甲子年 丙寅月 戊辰日 壬子時
// 天干：甲(木) 丙(火) 戊(土) 壬(水) -> 木1 火1 土1 水1
// 地支藏干：子癸 寅甲丙戊 辰戊乙癸 子癸 -> 需依權重加總
const pillars = {
  year: { stem: "甲", branch: "子" },
  month: { stem: "丙", branch: "寅" },
  day: { stem: "戊", branch: "辰" },
  hour: { stem: "壬", branch: "子" },
};

const out = runPipeline(pillars, kb, { stem_w: 1.0, branch_w: 1.0 });

const v = out.v_raw;
const s = out.v_season;
const toZh = { wood: "木", fire: "火", earth: "土", metal: "金", water: "水" };

console.log("【五行 pipeline 測試】");
console.log("四柱：甲子 丙寅 戊辰 壬子");
console.log("v_raw:", Object.fromEntries(Object.entries(toZh).map(([k, zh]) => [zh, Math.round(v[k] * 100) / 100])));
console.log("v_season (寅月):", Object.fromEntries(Object.entries(toZh).map(([k, zh]) => [zh, Math.round(s[k] * 100) / 100])));

// 斷言：v_raw 不應全 0，且木/火/土/水應有貢獻（金可能為 0）
const sumRaw = Object.values(v).reduce((a, b) => a + b, 0);
const sumSeason = Object.values(s).reduce((a, b) => a + b, 0);

if (sumRaw <= 0) throw new Error("v_raw 全為 0");
if (sumSeason <= 0) throw new Error("v_season 全為 0");
if (!out.report || !out.report.momentumText) throw new Error("report 缺 momentumText");

console.log("\n✅ 測試通過");
process.exit(0);
