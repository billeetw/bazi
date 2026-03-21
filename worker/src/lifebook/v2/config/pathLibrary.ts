/**
 * Lifebook V2：路徑庫 v1 — 8 條主路徑。
 * 宮位使用正規名：命宮、財帛宮、官祿宮（事業）、僕役宮（交友）、田宅宮、福德宮、兄弟宮等。
 */

export type PathCategory =
  | "wealth"
  | "career"
  | "asset"
  | "partnership"
  | "risk"
  | "inner_state";

export interface PalacePathDefinition {
  id: string;
  name: string;
  category: PathCategory;
  /** 宮位順序（正規名，如 命宮、財帛宮、官祿宮） */
  palaces: string[];
  description: string;
  primary: boolean;
  scoringProfile: {
    lu: number;
    quan: number;
    ke: number;
    ji: number;
    pathMultiplier: number;
  };
}

/** v1 主路徑：主財富線、資產線、官財線、人脈財線、合作財線、資產回現線、心態影響財線、主動開創線 */
export const PATH_LIBRARY: PalacePathDefinition[] = [
  {
    id: "main_wealth_line",
    name: "主財富線",
    category: "wealth",
    palaces: ["命宮", "財帛宮", "官祿宮", "福德宮"],
    description: "命→財→事業→福德，整體財富與事業、心態的連動",
    primary: true,
    scoringProfile: { lu: 3, quan: 2, ke: 1, ji: -3, pathMultiplier: 1.5 },
  },
  {
    id: "asset_line",
    name: "資產線",
    category: "asset",
    palaces: ["財帛宮", "福德宮", "田宅宮"],
    description: "財帛→福德→田宅，資產累積與置產、心態",
    primary: true,
    scoringProfile: { lu: 3, quan: 2, ke: 1, ji: -3, pathMultiplier: 1.3 },
  },
  {
    id: "career_wealth_line",
    name: "官財線",
    category: "career",
    palaces: ["官祿宮", "財帛宮"],
    description: "事業→財帛，工作收入與事業表現",
    primary: true,
    scoringProfile: { lu: 3, quan: 2, ke: 1, ji: -3, pathMultiplier: 1.2 },
  },
  {
    id: "network_wealth_line",
    name: "人脈財線",
    category: "partnership",
    palaces: ["僕役宮", "財帛宮"],
    description: "交友（僕役）→財帛，人脈帶財、合作生財",
    primary: true,
    scoringProfile: { lu: 3, quan: 2, ke: 1, ji: -3, pathMultiplier: 1.2 },
  },
  {
    id: "sibling_wealth_line",
    name: "合作財線",
    category: "partnership",
    palaces: ["兄弟宮", "財帛宮"],
    description: "兄弟→財帛，手足、同儕、合作與財",
    primary: false,
    scoringProfile: { lu: 3, quan: 2, ke: 1, ji: -3, pathMultiplier: 1.1 },
  },
  {
    id: "asset_to_cash_line",
    name: "資產回現線",
    category: "asset",
    palaces: ["田宅宮", "財帛宮"],
    description: "田宅→財帛，不動產或家庭資源變現",
    primary: false,
    scoringProfile: { lu: 3, quan: 2, ke: 1, ji: -3, pathMultiplier: 1.2 },
  },
  {
    id: "mind_wealth_line",
    name: "心態影響財線",
    category: "inner_state",
    palaces: ["福德宮", "財帛宮"],
    description: "福德→財帛，心態、福報對財運的影響",
    primary: false,
    scoringProfile: { lu: 3, quan: 2, ke: 1, ji: -3, pathMultiplier: 1.1 },
  },
  {
    id: "active_creation_line",
    name: "主動開創線",
    category: "wealth",
    palaces: ["命宮", "官祿宮", "財帛宮"],
    description: "命→事業→財帛，主動開創與事業求財",
    primary: true,
    scoringProfile: { lu: 3, quan: 2, ke: 1, ji: -3, pathMultiplier: 1.3 },
  },
];

export function getPathById(id: string): PalacePathDefinition | undefined {
  return PATH_LIBRARY.find((p) => p.id === id);
}

export function getPathsByCategory(category: PathCategory): PalacePathDefinition[] {
  return PATH_LIBRARY.filter((p) => p.category === category);
}
