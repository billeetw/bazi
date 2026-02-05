# UI 模块依赖关系图

## 模块加载顺序

```
index.html
  │
  ├─ 常量模块
  │   └─ ceremony-constants.js
  │
  ├─ 工具模块
  │   ├─ dom-helpers.js
  │   ├─ render-helpers.js (依赖: window.Calc, window.UiDomHelpers)
  │   └─ strategy-tags.js
  │
  ├─ 服务模块
  │   ├─ api-service.js
  │   ├─ navigation.js
  │   ├─ form-init.js (依赖: window.Calc)
  │   ├─ sound-service.js
  │   └─ calculation-flow.js (依赖: window.Calc, window.UiRenderHelpers, window.UiDomHelpers, window.UiComponents)
  │
  ├─ 组件模块
  │   ├─ wuxing-panel.js (依赖: window.UiDomHelpers)
  │   ├─ wuxing-meaning.js
  │   ├─ bazi-pillars.js (依赖: window.Calc)
  │   ├─ ziwei-grid.js (依赖: window.Calc, window.UiRenderHelpers, window.UiDomHelpers)
  │   ├─ palace-scores.js (依赖: window.Calc, window.UiRenderHelpers, window.UiDomHelpers, window.StrategyConfig, window.PALACE_DESCRIPTIONS)
  │   ├─ palace-detail.js (依赖: window.Calc, window.UiRenderHelpers, window.UiDomHelpers, window.StrategyConfig)
  │   └─ liuyue-month.js (依赖: window.Calc, window.UiRenderHelpers, window.Utils)
  │
  └─ 主文件
      └─ ui.js (协调器，依赖所有模块)
```

## 依赖关系说明

### 核心依赖
- **window.Calc**: 核心计算逻辑（来自 calc.js）
- **window.StrategyConfig**: 策略配置（来自 strategyConfig.js）
- **window.Utils**: 工具函数（来自 utils.js）
- **window.IdentifyBirthTime**: 出生时间识别（来自 identifyBirthTime.js）

### UI 模块依赖
- **window.UiDomHelpers**: DOM 操作工具
- **window.UiRenderHelpers**: 渲染辅助工具（依赖 window.Calc）
- **window.UiComponents**: UI 组件集合
- **window.UiServices**: UI 服务集合
- **window.UiUtils**: UI 工具集合
- **window.UiConstants**: UI 常量集合

### 全局状态
- **window.PALACE_DESCRIPTIONS**: 宫位描述（由 ui.js 定义）
- **window.ziweiScores**: 紫微分数（运行时设置）
- **window.BaziApp?.State**: 应用状态（如果存在）

## 模块导出位置

- `window.UiComponents.*` - 所有 UI 组件
- `window.UiServices.*` - 所有 UI 服务
- `window.UiUtils.*` - 所有 UI 工具
- `window.UiConstants.*` - 所有 UI 常量

