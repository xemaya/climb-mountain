import { balance } from "./balance";

export type DemonTriggers = {
  slid: boolean;
  newMadness: boolean;
  isEvent: boolean;
};

export function computeDemonAdvance(t: DemonTriggers): number {
  let total = balance.DEMON_BASELINE_PER_ROUND;
  if (t.slid) total += balance.DEMON_BONUS_ON_SLIDE;
  if (t.newMadness) total += balance.DEMON_BONUS_ON_NEW_MADNESS;
  if (t.isEvent) total += balance.DEMON_BONUS_ON_EVENT;
  return total;
}

export function applyDemonAdvance(demonCell: number, playerCell: number, advance: number): number {
  return Math.min(demonCell + advance, playerCell);
}
