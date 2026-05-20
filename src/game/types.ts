// =============================================================================
// Dice
// =============================================================================

export type DieKind = "color" | "madness";
export type DieFace = 1 | 2 | 3 | 4 | 5 | 6;
export type DieId = string; // stable within a game; e.g. "c0", "c1", ..., "m0", "m1"

export type Die = {
  id: DieId;
  kind: DieKind;
  face: DieFace | null; // null = in hand, not yet rolled this turn
};

// =============================================================================
// Cards
// =============================================================================

export type DiceCondition =
  | { kind: "sum-at-least"; n: number }
  | { kind: "sum-at-most"; n: number }
  | { kind: "face-count"; face: DieFace; atLeast: number }
  | { kind: "same-face-groups"; count: number; groupSize: number }
  | { kind: "distinct-faces"; atLeast: number }
  | { kind: "distinct-faces-at-most"; n: number };

export type Task = {
  requires: DiceCondition;
  advance: number; // negative = slide
};

export type CardType = "normal" | "event";

export type Card = {
  id: string;
  name: string;
  type: CardType;
  minDice: number | "ALL"; // ALL = auto use all dice (event cards)
  tasks: Task[]; // normal: 2-3 tiers, evaluated highest-first; event: each task is independently applied
};

// =============================================================================
// Game state
// =============================================================================

export type Phase =
  | "await-select"
  | "await-roll"
  | "await-reroll"
  | "await-commit"
  | "resolving" // C → D → demon-advance animation window (UI-only state)
  | "won"
  | "lost";

export type Player = {
  cell: number;
  handDice: Die[]; // dice still in player's pool
  selected: DieId[]; // ids chosen for this turn (subset of handDice)
  rolled: Die[]; // dice that were rolled this turn (moved out of handDice for the turn)
  rerollsLeft: number;
};

export type Demon = {
  cell: number;
};

export type LogEntry = {
  round: number;
  text: string;
};

export type RngState = {
  seed: number;
  state: number; // current mulberry32 state
};

export type GameState = {
  phase: Phase;
  player: Player;
  demon: Demon;
  madnessStock: number; // remaining madness dice in supply
  deck: Card[];
  discard: Card[];
  currentCard: Card | null;
  round: number; // starts at 1
  log: LogEntry[];
  rng: RngState;
};

// =============================================================================
// Actions (single entry: applyAction)
// =============================================================================

export type Action =
  | { kind: "start-game"; seed: number }
  | { kind: "select-dice"; ids: DieId[] } // replace current selection set
  | { kind: "roll" } // initial roll
  | { kind: "reroll"; ids: DieId[] } // subset of rolled
  | { kind: "commit" } // C → D → demon-advance → check win/loss → draw next card
  | { kind: "advance-event-card" }; // when next card is event, system invokes this to auto-resolve
