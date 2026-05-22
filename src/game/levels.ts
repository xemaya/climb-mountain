import { balance } from "./balance";

export type LevelConfig = {
  level: number;
  name: string;
  startPlayerCell: number;
  startDemonCell: number;
  colorDice: number;
  startMadnessDice: number;
  madnessStock: number;
  slideBackCells: number;
  demonBaseline: number;
  demonSlideBonus: number;
  demonNewMadnessBonus: number;
  demonEventBonus: number;
};

export const levelConfigs: LevelConfig[] = [
  {
    level: 1,
    name: "雾中前哨",
    startPlayerCell: 8,
    startDemonCell: 0,
    colorDice: 7,
    startMadnessDice: 1,
    madnessStock: 16,
    slideBackCells: 1,
    demonBaseline: 1,
    demonSlideBonus: 0,
    demonNewMadnessBonus: 0,
    demonEventBonus: 0,
  },
  {
    level: 2,
    name: "裂冰坡",
    startPlayerCell: 7,
    startDemonCell: 0,
    colorDice: 7,
    startMadnessDice: 2,
    madnessStock: 16,
    slideBackCells: 2,
    demonBaseline: 1,
    demonSlideBonus: 0,
    demonNewMadnessBonus: 0,
    demonEventBonus: 0,
  },
  {
    level: 3,
    name: "无声营地",
    startPlayerCell: 7,
    startDemonCell: 1,
    colorDice: 7,
    startMadnessDice: 3,
    madnessStock: 17,
    slideBackCells: 2,
    demonBaseline: 1,
    demonSlideBonus: 1,
    demonNewMadnessBonus: 0,
    demonEventBonus: 1,
  },
  {
    level: 4,
    name: "黄衣山脊",
    startPlayerCell: 6,
    startDemonCell: 1,
    colorDice: 7,
    startMadnessDice: 3,
    madnessStock: 17,
    slideBackCells: 2,
    demonBaseline: 1,
    demonSlideBonus: 1,
    demonNewMadnessBonus: 1,
    demonEventBonus: 1,
  },
  {
    level: 5,
    name: "风暴肩线",
    startPlayerCell: 6,
    startDemonCell: 1,
    colorDice: 7,
    startMadnessDice: 3,
    madnessStock: 18,
    slideBackCells: 2,
    demonBaseline: 1,
    demonSlideBonus: 1,
    demonNewMadnessBonus: 1,
    demonEventBonus: 2,
  },
  {
    level: 6,
    name: "颠倒冰原",
    startPlayerCell: 6,
    startDemonCell: 2,
    colorDice: 7,
    startMadnessDice: 3,
    madnessStock: 18,
    slideBackCells: 3,
    demonBaseline: 1,
    demonSlideBonus: 1,
    demonNewMadnessBonus: 1,
    demonEventBonus: 2,
  },
  {
    level: 7,
    name: "黑星垭口",
    startPlayerCell: 5,
    startDemonCell: 2,
    colorDice: 6,
    startMadnessDice: 4,
    madnessStock: 18,
    slideBackCells: 3,
    demonBaseline: 1,
    demonSlideBonus: 2,
    demonNewMadnessBonus: 1,
    demonEventBonus: 2,
  },
  {
    level: 8,
    name: "白噪深壁",
    startPlayerCell: 5,
    startDemonCell: 3,
    colorDice: 6,
    startMadnessDice: 4,
    madnessStock: 19,
    slideBackCells: 3,
    demonBaseline: 2,
    demonSlideBonus: 1,
    demonNewMadnessBonus: 1,
    demonEventBonus: 2,
  },
  {
    level: 9,
    name: "诸神背脊",
    startPlayerCell: 4,
    startDemonCell: 2,
    colorDice: 6,
    startMadnessDice: 4,
    madnessStock: 20,
    slideBackCells: 3,
    demonBaseline: 2,
    demonSlideBonus: 2,
    demonNewMadnessBonus: 1,
    demonEventBonus: 2,
  },
  {
    level: 10,
    name: "不可名状之巅",
    startPlayerCell: 4,
    startDemonCell: 3,
    colorDice: 6,
    startMadnessDice: 5,
    madnessStock: 20,
    slideBackCells: 3,
    demonBaseline: 2,
    demonSlideBonus: 2,
    demonNewMadnessBonus: 1,
    demonEventBonus: 3,
  },
];

export function getLevelConfig(level: number): LevelConfig {
  return levelConfigs[Math.min(Math.max(level, 1), levelConfigs.length) - 1] ?? {
    level: 1,
    name: "雾中前哨",
    startPlayerCell: balance.START_PLAYER_CELL,
    startDemonCell: balance.START_DEMON_CELL,
    colorDice: balance.PLAYER_COLOR_DICE,
    startMadnessDice: balance.START_MADNESS_DICE,
    madnessStock: balance.MADNESS_STOCK,
    slideBackCells: balance.SLIDE_BACK_CELLS,
    demonBaseline: balance.DEMON_BASELINE_PER_ROUND,
    demonSlideBonus: balance.DEMON_BONUS_ON_SLIDE,
    demonNewMadnessBonus: balance.DEMON_BONUS_ON_NEW_MADNESS,
    demonEventBonus: balance.DEMON_BONUS_ON_EVENT,
  };
}

export function isFinalLevel(level: number): boolean {
  return level >= levelConfigs.length;
}
