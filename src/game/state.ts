import { allCards } from "./cards";
import { balance } from "./balance";
import { makeRng, shuffle } from "./rng";
import type { Die, GameState } from "./types";

export function initialState(seed: number): GameState {
  const rng = makeRng(seed);

  const colorDice: Die[] = Array.from({ length: balance.PLAYER_COLOR_DICE }, (_, i) => ({
    id: `c${i}`,
    kind: "color",
    face: null,
  }));
  const madDice: Die[] = Array.from({ length: balance.START_MADNESS_DICE }, (_, i) => ({
    id: `m${i}`,
    kind: "madness",
    face: null,
  }));

  const shuffled = shuffle(rng, allCards);
  const [first, ...rest] = shuffled;

  return {
    phase: "await-select",
    player: {
      cell: balance.START_PLAYER_CELL,
      handDice: [...colorDice, ...madDice],
      selected: [],
      rolled: [],
      rerollsLeft: 0,
    },
    demon: { cell: balance.START_DEMON_CELL },
    madnessStock: balance.MADNESS_STOCK - balance.START_MADNESS_DICE,
    deck: rest,
    discard: [],
    currentCard: first,
    round: 1,
    log: [],
    rng,
  };
}
