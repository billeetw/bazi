# S19 宮位覆蓋盤點

Override 規則目前依宮位分布如下，僅在 **trigger 宮位** 使用。

| 宮位 | 規則集 | 狀態 |
|------|--------|------|
| 命宮 | SELF_RULES | ✅ |
| 兄弟宮 | SIBLING_RULES | ✅ |
| 夫妻宮 | SPOUSE_RULES | ✅ |
| 子女宮 | OUTPUT_RULES | ✅ |
| 財帛宮 | MONEY_RULES | ✅ |
| 疾厄宮 | HEALTH_RULES | ✅ |
| 遷移宮 | TRAVEL_RULES | ✅ |
| 僕役宮 | SERVANT_RULES | ✅ |
| 官祿宮 | CAREER_RULES | ✅ |
| 田宅宮 | PROPERTY_RULES | ✅ |
| 福德宮 | FORTUNE_RULES | ✅ |
| 父母宮 | AUTHORITY_RULES | ✅ |

**十二宮皆有對應 override 規則集**；若星曜／四化未命中任一條 override，仍會依序走 seed（萬用規則）→ generic fallback builder。
