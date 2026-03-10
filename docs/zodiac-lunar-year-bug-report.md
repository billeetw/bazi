# Zodiac Bug Report: Gregorian vs Lunar Year

## 1. Files/functions containing zodiac logic

| File | Function / usage | Issue |
|------|-------------------|--------|
| **js/calc/taisui.js** | `yearToBranch(year)` | Uses `(year - 1984) % 12` with **Gregorian year**. No LNY check. **Wrong** when birth date is before Lunar New Year (e.g. 1988-02-01 → should be 卯 Rabbit, returns 辰 Dragon). |
| **js/calc/taisui.js** | `yearToStem(year)` | Same: Gregorian year only. **Wrong** for stem when date is before LNY. |
| **js/calc/taisui.js** | `getTaisuiStatus({ birthYear, year })` | Calls `yearToBranch(birthYear)` for **userBranch** and **zodiac**. **Wrong**: uses Gregorian birthYear. |
| **functions/utils/taisui.js** | `yearToBranch(year)` (internal) | Same formula as above. **Wrong** for birth year. |
| **functions/utils/taisui.js** | `yearToStem(year)` (internal) | Same. **Wrong** for birth year. |
| **functions/utils/taisui.js** | `getTaisuiStatus({ birthYear, year })` | Uses `yearToBranch(birthYear)` for userBranch/zodiac. **Wrong**. |
| **functions/api/taisui/status.js** | Gets `birthYear` from query or `user_charts.birth_date` | Uses `parseInt(String(row.birth_date).slice(0, 4), 10)` — **Gregorian year from date string**. For "1988-02-01" returns 1988; should use lunar year 1987. **Wrong**. |
| **functions/api/taisui/lamp.js** | Same: `birthYear = parseInt(String(birthDate).slice(0, 4), 10)` | **Wrong** for dates before LNY. |
| **js/ui.js** | Calls `renderTaisuiCard(vy, 2026)` | Passes **vy** (form birth year = Gregorian). **Wrong** when user’s birth date is before LNY. |
| **js/ui/components/taisui-card.js** | `renderTaisuiCard(birthYear, year)` | Passes **birthYear** to API; no month/day. API cannot do LNY check. **Wrong**. |
| **js/calc/taisui.js** | `branchToZodiac(branch)`, `zodiacToBranch(zodiac)` | **Correct**: branch ↔ zodiac mapping. Problem is **which branch** is used (Gregorian-derived vs lunar-derived). |

---

## 2. Which ones are wrong and why

- **Wrong**: Any path that derives **user zodiac / userBranch** from **Gregorian birth year** only:
  - `yearToBranch(birthYear)` in both taisui modules when `birthYear` is Gregorian.
  - APIs that pass only `birthYear` (e.g. from `birth_date.slice(0,4)`).
  - Frontend passing only `vy` (form year) to taisui card/API.
- **Why**: Zodiac and stem-branch follow the **lunar calendar**. A date like 1988-02-01 is still **丁卯 (Rabbit)** because Lunar New Year 1988 was 1988-02-17. Using 1988 gives 辰 (Dragon).

---

## 3. Lunar conversion analysis

- **compute/all (Worker)**  
  - Input: Gregorian `year, month, day, hour, minute`.  
  - Uses **iztro** `astrolabeBySolarDate(dateStr, timeIndex, ...)` and reads **chineseDate** from astrolabe (`rawDates.chineseDate.yearly` = [stem, branch]).  
  - **bazi.display.yG / yZ** and **bazi.year.stem / branch** are **lunar-correct** (stem-branch for the birth moment).  
  - **Timezone**: Not explicitly set; iztro/lunar-lite typically use local or a single timezone. For Taiwan, **Asia/Taipei** should be used; worth confirming in iztro/lunar-lite docs.

- **Inconsistency**  
  - Bazi (and strategic-panel, etc.) use **bazi.display.yZ** (lunar year branch) — **correct**.  
  - Taisui/zodiac use **yearToBranch(birthYear)** with Gregorian year — **wrong**.  
  - So zodiac is **recomputed incorrectly** in taisui code paths instead of using the same lunar year (or branch) as bazi.

---

## 4. Boundary test (Taiwan / Asia/Taipei)

| Date (Gregorian) | Expected zodiac (lunar year) | Current (wrong) | LNY note |
|------------------|------------------------------|------------------|----------|
| 1988-02-01 | Rabbit (丁卯) | Dragon (辰) | Before 1988 LNY (Feb 17) |
| 1988-02-16 | Rabbit (丁卯) | Dragon (辰) | Before 1988 LNY |
| 1988-02-17 | Dragon (戊辰) | Dragon (辰) | LNY 1988 |
| 1990-01-25 | Snake (己巳) | Horse (午) | Before 1990 LNY (Jan 26) |
| 1990-01-26 | Horse (庚午) | Horse (午) | LNY 1990 |

**Current behavior**: `yearToBranch(1988)` = 辰, `yearToBranch(1987)` = 卯. So 1988-02-01 must use **lunar year 1987** to get 卯 (Rabbit).

---

## 5. Fix proposal

**Ideal**: Use **lunar year** (or directly **bazi.year.branch**) everywhere for zodiac/userBranch.

**Minimal patch**: When full birth date is available (year, month, day), compute **lunar year** using a **Lunar New Year (LNY) check**:

- Maintain a small **LNY table**: Gregorian year → [month, day] of first day of lunar year (Taiwan).
- `getLunarYearFromDate(gregYear, gregMonth, gregDay)`:
  - If (month, day) < LNY(gregYear) then lunar year = gregYear - 1, else lunar year = gregYear.
- **getTaisuiStatus**:
  - Accept `birthDate` (YYYY-MM-DD) or `(birthYear, birthMonth, birthDay)`.
  - When date is available, use `getLunarYearFromDate` to get lunar year, then `userBranch = yearToBranch(lunarYear)`, `zodiac = branchToZodiac(userBranch)`.
  - When only `birthYear` is provided (no month/day), keep current behavior (wrong for pre-LNY dates) or require full date.
- **API**:
  - **status**: When `birth_date` is available (query or user_charts), parse and pass (y, m, d) to getTaisuiStatus.
  - **lamp**: Same: pass full birth_date into getTaisuiStatus.
- **Frontend**: When calling taisui status API, pass **birth_date** (YYYY-MM-DD) when available (e.g. from form vy, vm, vd after compute). Then API can compute lunar year and return correct zodiac.

**Alternative**: When frontend has **bazi** (after compute/all), pass **bazi.year.branch** (or display.yZ) to taisui card/API so zodiac is taken from bazi instead of recomputed; API would need to accept optional `birthYearBranch` and use it when present. This avoids LNY table on backend but requires frontend to always send branch when available.

---

## 6. Implemented fix (LNY-based)

- **js/calc/taisui.js**: Added `LNY_BY_YEAR` table (Taiwan LNY dates 1924–2030), `getLunarYearFromDate(gregYear, gregMonth, gregDay)`, and extended `getTaisuiStatus({ birthYear, birthMonth, birthDay, birthDate, year })` to compute lunar year when full date or `birthDate` (YYYY-MM-DD) is provided; `userBranch` and `zodiac` now use lunar year.
- **functions/utils/taisui.js**: Same LNY table, `getLunarYearFromDate`, and `getTaisuiStatus` options so backend uses lunar year when `birthDate` or (birthMonth, birthDay) is available.
- **functions/api/taisui/status.js**: Accepts query `birth_date` (YYYY-MM-DD); when loading from `user_charts.birth_date`, passes full date into `getTaisuiStatus` so zodiac is correct.
- **functions/api/taisui/lamp.js**: Passes `birthDate` into `getTaisuiStatus` when `birth_date` from DB is YYYY-MM-DD.
- **Frontend**: `renderTaisuiCard(birthYear, year, { birth_date })`; when calling taisui status API, adds `birth_date` (from form vy, vm, vd) so API returns correct zodiac. **ui.js** builds `birth_date` from vy/vm/vd and passes it to `renderTaisuiCard`.

### Boundary test outputs (after fix)

```
1988-02-01 → lunarYear=1987 branch=卯 zodiac=兔 ✓ before 1988 LNY (Feb 17)
1988-02-16 → lunarYear=1987 branch=卯 zodiac=兔 ✓ before 1988 LNY
1988-02-17 → lunarYear=1988 branch=辰 zodiac=龍 ✓ 1988 LNY
1990-01-25 → lunarYear=1989 branch=巳 zodiac=蛇 ✓ before 1990 LNY (Jan 26)
1990-01-26 → lunarYear=1990 branch=午 zodiac=馬 ✓ 1990 LNY
```

Run: `node scripts/zodiac-boundary-test.mjs`
