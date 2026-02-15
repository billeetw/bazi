# 五行生剋靜態 KB

本目錄為五行生剋管線（`js/calc/wuxingFlowPipeline.js`）的靜態知識庫。

| 檔案 | 說明 |
|------|------|
| `elements.json` | 五行 id/zh、相生邊（gen_edges）、相剋邊（ctl_edges） |
| `stems.json` | 十天干 → 五行 id |
| `branches.json` | 十二地支 id/zh、主氣、藏干比例 |
| `month_branches.json` | 月支 → 當令五行、季節乘數（五元素） |
| `flow_descriptions.json` | 5 條相生、5 條相剋的語意描述（positive / stress） |

管線會從四柱（年/月/日/時 干+支）算出 `v_raw`、`v_season`、相生流量／瓶頸、相剋壓力，並組出三層報告與病例欄位。使用方式見 `docs/wuxing-flow-control-plan.md` 與 `js/calc/wuxingFlowPipeline.js` 註解。
