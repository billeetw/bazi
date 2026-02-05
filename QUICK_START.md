# UI 模块化快速参考

## 📁 文件结构

```
js/ui/
├── components/          # UI 组件 (8个)
│   ├── bazi-pillars.js
│   ├── birth-time-identifier.js
│   ├── liuyue-month.js
│   ├── palace-detail.js
│   ├── palace-scores.js
│   ├── wuxing-meaning.js
│   ├── wuxing-panel.js
│   └── ziwei-grid.js
├── constants/           # 常量 (1个)
│   └── ceremony-constants.js
├── services/            # 服务 (7个)
│   ├── api-service.js
│   ├── calculation-flow.js
│   ├── data-renderer.js
│   ├── event-bindings.js
│   ├── form-init.js
│   ├── navigation.js
│   └── sound-service.js
├── utils/               # 工具 (3个)
│   ├── dom-helpers.js
│   ├── render-helpers.js
│   └── strategy-tags.js
└── ui.js                # 主文件（协调器）
```

## 🔗 模块访问

### 组件
```javascript
window.UiComponents.WuxingMeaning.renderWuxingMeaningBox()
window.UiComponents.BaziPillars.renderPillars()
window.UiComponents.ZiweiGrid.renderZiwei()
window.UiComponents.PalaceScores.renderZiweiScores()
window.UiComponents.PalaceDetail.selectPalace()
window.UiComponents.LiuyueMonth.renderLiuyue()
window.UiComponents.WuxingPanel.openWuxingMeaningLikePalace()
window.UiComponents.BirthTimeIdentifier.initIdentifyBirthTime()
```

### 服务
```javascript
window.UiServices.ApiService.loadDbContent()
window.UiServices.ApiService.computeAll()
window.UiServices.Navigation.syncNavChipActive()
window.UiServices.FormInit.initSelectors()
window.UiServices.SoundService.playSyncSound()
window.UiServices.CalculationFlow.validateInputs()
window.UiServices.EventBindings.bindLaunchButton()
window.UiServices.DataRenderer.renderBaziData()
```

### 工具
```javascript
window.UiDomHelpers.animateValue()
window.UiDomHelpers.getCurrentAge()
window.UiRenderHelpers.renderBar()
window.UiRenderHelpers.renderRadarChart()
window.UiUtils.StrategyTags.getMonthStrategyTag()
```

### 常量
```javascript
window.UiConstants.Ceremony.CEREMONY_PERSONALITY_KEYS
```

## 🚀 快速测试

```bash
# 运行模块完整性测试
node test-modules.cjs

# 语法检查所有模块
find js/ui -name "*.js" -exec node -c {} \;
```

## 📊 统计数据

- **主文件**: 836 行（减少 65.4%）
- **总模块**: 19 个文件
- **组件**: 8 个
- **服务**: 7 个
- **工具**: 3 个
- **常量**: 1 个

