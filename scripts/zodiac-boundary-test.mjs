/**
 * Boundary test: zodiac should use lunar year (LNY), not Gregorian year.
 * Run: node scripts/zodiac-boundary-test.mjs
 * Expect: 1988-02-01 → Rabbit, 1988-02-17 → Dragon, 1990-01-25 → Snake, 1990-01-26 → Horse
 */
import { getLunarYearFromDate, getTaisuiStatus, branchToZodiac } from "../js/calc/taisui.js";

const cases = [
  { date: "1988-02-01", expectZodiac: "兔", expectBranch: "卯", desc: "before 1988 LNY (Feb 17)" },
  { date: "1988-02-16", expectZodiac: "兔", expectBranch: "卯", desc: "before 1988 LNY" },
  { date: "1988-02-17", expectZodiac: "龍", expectBranch: "辰", desc: "1988 LNY" },
  { date: "1990-01-25", expectZodiac: "蛇", expectBranch: "巳", desc: "before 1990 LNY (Jan 26)" },
  { date: "1990-01-26", expectZodiac: "馬", expectBranch: "午", desc: "1990 LNY" },
];

console.log("Zodiac boundary test (lunar year from date)\n");

let ok = 0;
for (const c of cases) {
  const [y, m, d] = c.date.split("-").map(Number);
  const lunarYear = getLunarYearFromDate(y, m, d);
  const status = getTaisuiStatus({ birthYear: y, birthMonth: m, birthDay: d, year: 2026 });
  const zodiac = status.zodiac;
  const branch = status.userBranch;
  const pass = zodiac === c.expectZodiac && branch === c.expectBranch;
  if (pass) ok++;
  console.log(
    `${c.date} → lunarYear=${lunarYear} branch=${branch} zodiac=${zodiac} (expect ${c.expectBranch}/${c.expectZodiac}) ${pass ? "✓" : "✗"} ${c.desc}`
  );
}

console.log(`\n${ok}/${cases.length} passed`);
process.exit(ok === cases.length ? 0 : 1);
