# Lifebook 逐宮資料輸入模板（S17 權重敘事）

用途：你每次提供一宮資料時，直接照此格式填。  
目標：同一份輸入可直接轉成系統的「權重 + 段落語句」資料結構，並進入測試。

---

## 0) 宮位設定

- `palace`: `命宮` | `兄弟宮` | `夫妻宮` | `子女宮` | `財帛宮` | `疾厄宮` | `遷移宮` | `交友宮` | `官祿宮` | `田宅宮` | `福德宮` | `父母宮`
- 顯示用固定：`交友宮`
- 內部 canonical：`僕役宮`（系統會自動映射）

---

## 1) 星曜段落語句（每顆星）

每顆星至少填這 3 欄（若沒有可先留空）：

- `career_fit`（該宮可改名，如官祿用 career_fit、財帛可用 money_fit）
- `forbidden_decisions`（2 條）
- `risk_alert`（1 條）

範例（官祿宮）：

```yaml
palace: 官祿宮
stars:
  - star: 武曲
    class: main
    career_fit: 金融、管理、營運、技術執行
    forbidden_decisions:
      - 過度硬推不留彈性
      - 只看結果忽略關係成本
    risk_alert: 過於強硬會造成合作斷裂
```

---

## 2) 權重（四段必填）

每顆星在該宮請填：

- `core`
- `decision`
- `phenomenon`
- `pitfall`

範圍：`0 ~ 5`

範例：

```yaml
weights:
  - star: 武曲
    core: 4.9
    decision: 4.9
    phenomenon: 4.5
    pitfall: 3.7
```

---

## 3) 條件（可選）

- `when_no_main_star: true|false`
- `brightness_rules`（如 廟/旺/得/平/陷 的語句補充）
- `co_star_rules`（如「天機+天梁」）
- `mutagen_rules`（化祿/權/科/忌）

範例：

```yaml
conditions:
  - star: 地劫
    when_no_main_star: true
    note: 無主星時優先拉動 phenomenon/pitfall
```

---

## 4) 宮位骨架語義（四段主題）

每宮固定四段：

- `core_focus`
- `decision_focus`
- `phenomenon_focus`
- `pitfall_focus`

範例：

```yaml
schema:
  core_focus: 你在社會角色中的站位與做事方式
  decision_focus: 工作發展、權責取捨與策略選擇
  phenomenon_focus: 職場節奏與責任壓力的日常呈現
  pitfall_focus: 方向錯置、承擔失衡與名實落差
```

---

## 5) 交付後我會做的事情（固定流程）

1. 正規化你輸入（宮名/星名/類型）
2. 併入該宮資料模組（不影響其他宮）
3. 補測試：
   - 權重命中
   - 段落有該宮專用語義
   - 不回退到通用套句
4. 回報測試結果與變更檔案

---

## 6) 最小可用輸入（你每次至少給這些）

- 該宮 8~12 顆核心星（主星 + 常見輔/煞）
- 每顆星：
  - `career_fit`（或該宮對應 fit）
  - `forbidden_decisions` 2 條
  - `risk_alert` 1 條
  - 四段權重

有了這些就可以上線該宮第一版。
