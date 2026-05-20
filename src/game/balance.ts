// Mutable object so harness sweep mode can override at runtime.
// Game core imports `balance` and reads balance.KEY.

export const balance = {
  START_PLAYER_CELL: 5,
  START_DEMON_CELL: 0,
  START_MADNESS_DICE: 2,
  PLAYER_COLOR_DICE: 7,
  MADNESS_STOCK: 16,
  GOAL_CELL: 14,
  DEMON_BASELINE_PER_ROUND: 1,
  DEMON_BONUS_ON_SLIDE: 1,
  DEMON_BONUS_ON_NEW_MADNESS: 1,
  DEMON_BONUS_ON_EVENT: 1,
  SLIDE_BACK_CELLS: 2,
  MAX_REROLLS: 2,
};

// Re-export individual values for backward-compatible imports (tests still use these).
// These are import-time snapshots — they DO NOT reflect runtime sweep overrides.
// New code in src/game/* must read balance.KEY, not these constants.
export const START_PLAYER_CELL          = balance.START_PLAYER_CELL;
export const START_DEMON_CELL           = balance.START_DEMON_CELL;
export const START_MADNESS_DICE         = balance.START_MADNESS_DICE;
export const PLAYER_COLOR_DICE          = balance.PLAYER_COLOR_DICE;
export const MADNESS_STOCK              = balance.MADNESS_STOCK;
export const GOAL_CELL                  = balance.GOAL_CELL;
export const DEMON_BASELINE_PER_ROUND   = balance.DEMON_BASELINE_PER_ROUND;
export const DEMON_BONUS_ON_SLIDE       = balance.DEMON_BONUS_ON_SLIDE;
export const DEMON_BONUS_ON_NEW_MADNESS = balance.DEMON_BONUS_ON_NEW_MADNESS;
export const DEMON_BONUS_ON_EVENT       = balance.DEMON_BONUS_ON_EVENT;
export const SLIDE_BACK_CELLS           = balance.SLIDE_BACK_CELLS;
export const MAX_REROLLS                = balance.MAX_REROLLS;
