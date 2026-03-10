/**
 * Findings Orchestrator v1：宮位層組裝。
 * 產出 mainBattlefields, pressureOutlets, palacePatterns, starCombinations, spilloverFindings。
 */

import type {
  MainBattlefield,
  PressureOutlet,
  PalacePatternFinding,
  StarCombinationFinding,
  SpilloverFinding,
  CrossChartFinding,
} from "../lifebookFindings.js";
import type { NormalizedChart } from "../normalizedChart.js";
import { dedupePalacePatterns, dedupeStarCombinations, dedupeSpilloverFindings } from "./findingsDedupe.js";
import { rankPalacePatterns, rankStarCombinations, takeTopStarCombinationsPerPalace, takeTopSpilloversPerTarget } from "./findingsRanker.js";
import { selectMainBattlefields, selectPressureOutlets } from "./findingsSelectors.js";

export interface BuildPalaceFindingsInput {
  chart: NormalizedChart;
  palacePatterns: PalacePatternFinding[];
  starCombinations: StarCombinationFinding[];
  spilloverFindings: SpilloverFinding[];
  crossChartFindings: CrossChartFinding[];
}

export interface BuildPalaceFindingsResult {
  mainBattlefields: MainBattlefield[];
  pressureOutlets: PressureOutlet[];
  palacePatterns: PalacePatternFinding[];
  starCombinations: StarCombinationFinding[];
  spilloverFindings: SpilloverFinding[];
}

export function buildPalaceFindings(input: BuildPalaceFindingsInput): BuildPalaceFindingsResult {
  const palacePatterns = rankPalacePatterns(dedupePalacePatterns(input.palacePatterns));

  const mainStars = new Set(
    input.chart.palaces.flatMap((p) => p.mainStars.map((s) => s.name?.trim()).filter(Boolean))
  );
  const rankedCombos = rankStarCombinations(
    dedupeStarCombinations(input.starCombinations),
    mainStars
  );
  const starCombinations = takeTopStarCombinationsPerPalace(rankedCombos, 3);

  const spilloverFindings = takeTopSpilloversPerTarget(
    dedupeSpilloverFindings(input.spilloverFindings),
    3
  );

  let mainBattlefields = selectMainBattlefields({
    chart: input.chart,
    palacePatterns,
    starCombinations: input.starCombinations,
    spilloverFindings: input.spilloverFindings,
    crossChartFindings: input.crossChartFindings,
    topN: 3,
  });
  if (mainBattlefields.length === 0 && input.chart.currentDecade?.palace) {
    mainBattlefields = [{
      palace: input.chart.currentDecade.palace,
      label: "當前大限",
      reason: "此十年主戰場",
      layer: "decade",
    }];
  }

  const pressureOutlets = selectPressureOutlets({
    palacePatterns,
    starCombinations: input.starCombinations,
    spilloverFindings: input.spilloverFindings,
    topN: 5,
  });

  return {
    mainBattlefields,
    pressureOutlets,
    palacePatterns,
    starCombinations,
    spilloverFindings,
  };
}
