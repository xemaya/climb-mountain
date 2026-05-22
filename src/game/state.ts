import { allCards } from "./cards";
import { getLevelConfig } from "./levels";
import { makeRng, shuffle } from "./rng";
import type { Die, GameState, RoundEffects } from "./types";

export function emptyRoundEffects(): RoundEffects {
  return {
    scoreBonus: 0,
    preventSlide: false,
    demonAdvanceDelta: 0,
    extraAdvance: 0,
  };
}

export function makeLevelDice(level: number): { handDice: Die[]; madnessStock: number } {
  const config = getLevelConfig(level);
  const colorDice: Die[] = Array.from({ length: config.colorDice }, (_, i) => ({
    id: `L${level}_c${i}`,
    kind: "color",
    face: null,
  }));
  const madDice: Die[] = Array.from({ length: config.startMadnessDice }, (_, i) => ({
    id: `L${level}_m${i}`,
    kind: "madness",
    face: null,
  }));

  return {
    handDice: [...colorDice, ...madDice],
    madnessStock: Math.max(0, config.madnessStock - config.startMadnessDice),
  };
}

export function initialState(seed: number): GameState {
  const rng = makeRng(seed);
  const level = 1;
  const config = getLevelConfig(level);
  const levelDice = makeLevelDice(level);

  const shuffled = shuffle(rng, allCards);
  const [first, ...rest] = shuffled;

  return {
    phase: "await-select",
    level,
    player: {
      cell: config.startPlayerCell,
      handDice: levelDice.handDice,
      selected: [],
      rolled: [],
      rerollsLeft: 0,
      items: [],
    },
    demon: { cell: config.startDemonCell },
    madnessStock: levelDice.madnessStock,
    deck: rest,
    discard: [],
    currentCard: first,
    round: 1,
    roundEffects: emptyRoundEffects(),
    log: [],
    rng,
  };
}
