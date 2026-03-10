/**
 * 主應用程式 bundle 入口
 * 依賴順序載入，由 Vite 打包成單一 dist/app.js
 * 勿修改載入順序
 */

// 階段1：工具、配置、狀態
import "./utils.js";
import "./config.js";
import "./i18n.js";
import "./astro-locale.js";
import "./debug-overlay.js";
import "./state.js";

// 階段2：calc 模組
import "./calc/constants.js";
import "./calc/helpers.js";
import "./calc/wuxingFlowPipeline.js";
import "./calc/ziweiPipeline.js";
import "./calc/ziweiOutput.js";
import "./calc/baziCore.js";
import "./calc/fourTransformations.js";
import "./calc/overlapAnalysis.js";
import "./calc/bodyPalaceEngine.js";
import "./calc/strategicLinkEngine.js";
import "./calc/luckIndex.js";
import "./calc/healthAnalysis.js";
import "./calc/monthlyDetailedAnalysis.js";
import "./calc/aiPromptGenerator.js";
import "./calc/tactics.js";
import "./ui/components/strategic-panel.js";
import "./strategyConfig.js";
import "./calc.js";
// identifyBirthTime.js 改為動態載入（點擊「點我推算」時才載入）

// UI 常量、工具、服務、組件
import "./ui/constants/ceremony-constants.js";
import "./ui/utils/dom-helpers.js";
import "./ui/utils/lamp-image.js";
import "./ui/utils/liuyue-share-card.js";
import "./ui/utils/render-helpers.js";
import "./ui/utils/content-utils.js";
import "./ui/utils/strategy-tags.js";
import "./ui/utils/wuxing-one-liner.js";
import "./ui/utils/yinyang-advanced.js";
import "./ui/utils/liuyue-strategy.js";
import "./ui/utils/mobile-helpers.js";
import "./ui/services/api-service.js";
import "./ui/services/scroll.js";
import "./ui/services/navigation.js";
import "./ui/services/section-collapse.js";
import "./ui/services/form-init.js";
import "./ui/services/sound-service.js";
import "./ui/services/auth-service.js";
import "./ui/services/my-charts-service.js";
import "./ui/services/calculation-flow.js";
import "./ui/services/toast.js";
import "./ui/services/event-bindings.js";
import "./ui/services/data-renderer.js";
import "./ui/services/user-identity.js";
import "./ui/services/feedback-service.js";
import "./ui/components/wuxing-panel.js";
import "./ui/components/birth-time-identifier.js";
import "./ui/components/wuxing-meaning.js";
import "./ui/components/bazi-pillars.js";
import "./ui/components/ziwei-grid.js";
import "./ui/components/palace-scores.js";
import "./ui/components/palace-detail.js";
import "./ui/components/launch-effect.js";
import "./ui/components/ambient-sound.js";
import "./ui/components/liuyue-month.js";
import "./ui/components/taisui-card.js";
import "./ui/components/divination-entrance.js";
import "./ui/components/feedback-widget.js";
import "./ui/components/feedback-history.js";
import "./ui/components/feedback-integration.js";
import "./ui/components/share-buttons.js";
// expert-questionnaire、geolocation-calibration 僅用於 expert-admin.html，主站不載入
import "./ui.js";
