# s02 命宮 組裝指令

章節：**命宮**（自我定位與人生方向）  
對應檔案：`worker/content/lifebookSection-zh-TW.json` 的 `s02` 鍵。  
**s02 專用**：解盤式敘事模板（僅命宮使用，其他宮位仍用 12 宮共用模板）。

---

## 一、s02 專用 placeholder 一覽

| 變數 | 說明 | 來源 |
|------|------|------|
| `{mingGongStarOpening}` | 你是帶著什麼狀態上場（主星人格） | getMingGongStarInsight(leadMainStarName).opening |
| `{palaceCoreDefinition}` | 命宮是什麼、管什麼 | pickMingGongCore(seed) |
| `{mainStarsLeadBlock}` | 主星定調：1 星「本宮由 ○○ 定調。」／2 星「本宮由 ○○、○○ 定調。」 | 命宮主星 slice(0,2) |
| `{mainStarsBrightnessNarrative}` | 亮度敘事（廟／旺／利／平／陷一句，不輸出獨立【亮度】區塊） | buildBrightnessNarrative(leadMainStarName, leadMainStarBrightness, seed) |
| `{mingGongStarStrength}` | 主星優勢 | buildMingGongStarNarrative(…, "strength") |
| `{assistantStarsNarrative}` | 優勢與慣性：輔星整合一句 | getMingGongAssistantNarrative(...) |
| `{mingGongSanfangInsight}` | 三方四正如何牽動 | getMingGongSanfangInsight(leadMainStarName, seed) |
| `{mingGongTransformNarrative}` | 四化如何觸發（本命→大限→流年→命宮主星本身四化） | getMingGongTransformNarrativeByPriority + getMingGongTransformMeaning |
| `{sihuaNarrativeBlock}` | 四化區塊：有飛入用原文，無則 fallback 句 | buildSihuaFlowSummary 或 fallback |
| `{mingGongStarTension}` | 最容易失衡 | getMingGongStarInsight(leadMainStarName).tension |
| `{mingGongStarMature}` | 成熟後如何運用 | getMingGongStarInsight(leadMainStarName).mature |

行為／策略欄：`{palaceGlobalLinkHints}`、`{palaceSiHuaHints}`（無舊版「成熟運用：觀察最強…」等殘留）。

---

## 二、s02 structure_analysis 現行模板

```
【你是帶著什麼狀態上場】

{mingGongStarOpening}

{palaceCoreDefinition}

【主星定調】

{mainStarsLeadBlock}

{mainStarsBrightnessNarrative}

{mingGongStarStrength}

【優勢與慣性】

{assistantStarsNarrative}

【三方四正如何牽動】

{mingGongSanfangInsight}

【四化如何觸發】

{mingGongTransformNarrative}

{sihuaNarrativeBlock}

【最容易失衡】

{mingGongStarTension}

【成熟後如何運用】

{mingGongStarMature}
```

---

## 三、命宮四化命中順序

1. 本命飛入命宮  
2. 大限飛入命宮  
3. 流年飛入命宮  
4. 命宮主星本身四化（生年四化在該主星）  
5. 若都無：留空；`sihuaNarrativeBlock` 顯示 fallback：「此宮雖未被本命四化直接點亮…」

---

## 四、句庫／矩陣檔案

- `worker/src/lifebook/mingGongSentenceLibrary.ts`：MING_GONG_CORE、MING_GONG_IMBALANCE、getMingGongAssistantNarrative、pickMingGongCore、pickMingGongImbalance  
- `worker/src/lifebook/mingGongStarMatrix.ts`：MING_GONG_STAR_MATRIX、getMingGongStarInsight（opening / strength / tension / mature）  
- `worker/src/lifebook/mingGongTransformMatrix.ts`：getMingGongTransformMeaning  
- `worker/src/lifebook/mingGongSanfangMatrix.ts`：MING_GONG_SANFANG_BY_STAR、MING_GONG_SANFANG_FALLBACK、getMingGongSanfangInsight  

---

## 五、D1 覆寫

- 整章：D1 `lifebookSection.s02` 傳四欄 JSON 可取代本地 s02。  
- 單欄：`lifebookSection.s02.structure_analysis`（或 behavior_pattern / blind_spots / strategic_advice）傳字串即可覆寫。  
- `palaceCoreDefinition` 僅 s02 由 pickMingGongCore(seed) 產出，不再用 SECTION_TEMPLATES.description。
