/**
 * 專家後台專用 bundle 入口
 * 僅載入計算模組 + API + 經緯度，供 expert-admin.html 使用
 * 產出：dist/expert-admin.js
 * 執行：npm run build:expert-admin
 *
 * 注意：constants.js 使用 ES import，必須經由 Vite 打包，無法以 classic script 單獨載入
 */

import "./config.js";
import "./calc/constants.js";
import "./calc/helpers.js";
import "./calc/ziweiPipeline.js";
import "./calc/ziweiOutput.js";
import "./calc/baziCore.js";
import "./calc/fourTransformations.js";
import "./calc/overlapAnalysis.js";
import "./calc/luckIndex.js";
import "./calc/healthAnalysis.js";
import "./calc/monthlyDetailedAnalysis.js";
import "./calc/aiPromptGenerator.js";
import "./calc/tactics.js";
import "./calc/adminExport.js";
import "./calc/consultationScriptEngine.js";
import "./calc/lifeBookEngine.js";
import "./calc/lifeBookPalaceConstants.js";
import "./calc.js";
import "./ui/services/api-service.js";
import "./ui/components/geolocation-calibration.js";
