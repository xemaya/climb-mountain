import { balance } from "./balance";
import type { LevelConfig } from "./levels";

export type DemonTriggers = {
  slid: boolean;
  newMadness: boolean;
  isEvent: boolean;
};

export function computeDemonAdvance(t: DemonTriggers, config?: Pick<LevelConfig, "demonBaseline" | "demonSlideBonus" | "demonNewMadnessBonus" | "demonEventBonus">): number {
  let total = config?.demonBaseline ?? balance.DEMON_BASELINE_PER_ROUND;
  if (t.slid) total += config?.demonSlideBonus ?? balance.DEMON_BONUS_ON_SLIDE;
  if (t.newMadness) total += config?.demonNewMadnessBonus ?? balance.DEMON_BONUS_ON_NEW_MADNESS;
  if (t.isEvent) total += config?.demonEventBonus ?? balance.DEMON_BONUS_ON_EVENT;
  return total;
}

export function applyDemonAdvance(demonCell: number, playerCell: number, advance: number): number {
  return Math.min(demonCell + advance, playerCell);
}
