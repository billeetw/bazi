/**
 * CL3 crossChartEngine：時間層疊推理用型別。
 */

import type { PalacePatternFinding, SpilloverFinding, StarCombinationFinding } from "../../lifebookFindings.js";

export interface PalaceTimelineContext {
  palace: string;
  natalPatterns: PalacePatternFinding[];
  decadalPatterns: PalacePatternFinding[];
  yearlyPatterns: PalacePatternFinding[];
  spilloversIn: SpilloverFinding[];
  combinations: StarCombinationFinding[];
}
