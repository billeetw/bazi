/**
 * 占卦頁專用 bundle 入口
 * 產出：dist/divination.js
 * 執行：npm run build:divination
 *
 * 載入順序：auth → 問題解析層 → 占卦計算模組 → divination-app
 */

import "./ui/services/auth-service.js";
import { analyzeQuestion, generateCoreResponse } from "./calc/divinationQuestionAnalyzer.ts";
window.analyzeQuestion = analyzeQuestion;
window.generateCoreResponse = generateCoreResponse;
import "./calc/transitionEngine.js";
import "./calc/buildCoreSummary.js";
import "./calc/dayanDivination.js";
import "./calc/divinationWuxing.js";
import "./calc/divinationScore.js";
import "./calc/divinationReminders.js";
import "./calc/divinationInterpretation.js";
import "./calc/divinationInsight.js";
import "./calc/scenarioEngine.js";
import "./divination-app.js";
