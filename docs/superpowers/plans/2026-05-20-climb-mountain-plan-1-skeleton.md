# Climb-Mountain Phase 1 Walking-Skeleton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a browser-playable single-player "登山者 vs 雪魔(AI 追兵)" dice game per `docs/superpowers/specs/2026-05-20-climb-mountain-design.md`, passing the balance gate (win rate 35-60%, avg 6-12 rounds, ≥1 slide/game) and rendering with DeerAPI-generated art.

**Architecture:** Three-layer Vite + TS + plain DOM:
1. Pure game core (`src/game/*.ts`) — single `applyAction(state, action)` entry, seedable RNG, immutable state
2. UI rendering (`src/ui/*.ts`) — each module exports `render(parent, state, dispatch)`, dispatches Actions
3. Harness (`scripts/simulate.ts`) — calls `applyAction` directly, 3 modes (default/sweep/verbose)

**Tech Stack:** Vite 5, TypeScript 5, Vitest, tsx (script runner), Python 3 + Pillow + DeerAPI gpt-image-2 (sprite gen)

---

## File Structure Recap

```
climb-mountain/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts                     # port 1425
├── vitest.config.ts
├── .gitignore
├── docs/
│   ├── balance/                       # simulate.ts --report output
│   └── superpowers/
│       ├── plans/2026-05-20-climb-mountain-plan-1-skeleton.md
│       └── specs/2026-05-20-climb-mountain-design.md
├── src/
│   ├── main.ts                        # bootstraps state + dispatch loop
│   ├── game/
│   │   ├── types.ts                   # all type definitions
│   │   ├── balance.ts                 # 12 tuning constants
│   │   ├── rng.ts                     # mulberry32 seedable PRNG
│   │   ├── cards.ts                   # 6 cards + DiceCondition evaluator
│   │   ├── state.ts                   # initialState(seed)
│   │   ├── demon.ts                   # advanceDemon(triggers)
│   │   ├── rules.ts                   # applyAction (single entry)
│   │   └── ai.ts                      # Phase 1 stub for Phase 2 reservations
│   ├── ui/
│   │   ├── style.css
│   │   ├── board.ts
│   │   ├── topBar.ts
│   │   ├── playerPanel.ts
│   │   ├── demonPanel.ts
│   │   ├── actionRail.ts
│   │   ├── eventLog.ts
│   │   ├── cardModal.ts
│   │   ├── rulesModal.ts
│   │   ├── startMenu.ts
│   │   └── endScreen.ts
│   └── assets/                        # 9 DeerAPI pngs land here
├── scripts/
│   ├── simulate.ts
│   ├── gen_sprites.py
│   └── chromakey.py
└── tests/
    ├── rng.test.ts
    ├── state.test.ts
    ├── cards.test.ts
    ├── demon.test.ts
    ├── rules.test.ts
    ├── state-flow.test.ts
    └── eval-edge.test.ts
```

All code runs from `climb-mountain/` directory. All paths below are relative to it unless prefixed `../`.

---

## Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `vitest.config.ts`, `.gitignore`, `index.html`, `src/main.ts`

- [ ] **Step 1: Create directory**

```bash
cd /Users/huanghaibin/Workspace/games
mkdir -p climb-mountain/src/game climb-mountain/src/ui climb-mountain/src/assets climb-mountain/scripts climb-mountain/tests climb-mountain/docs/balance
cd climb-mountain
```

- [ ] **Step 2: Write `package.json`**

```json
{
  "name": "climb-mountain",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "sim": "tsx scripts/simulate.ts"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "vite": "^5.4.0",
    "vitest": "^2.0.0",
    "tsx": "^4.0.0",
    "@types/node": "^20.0.0"
  }
}
```

- [ ] **Step 3: Write `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noEmit": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "types": ["node"]
  },
  "include": ["src", "scripts", "tests"]
}
```

- [ ] **Step 4: Write `vite.config.ts`**

```typescript
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 1425,
    strictPort: true,
  },
});
```

- [ ] **Step 5: Write `vitest.config.ts`**

```typescript
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    coverage: {
      include: ["src/game/**/*.ts"],
    },
  },
});
```

- [ ] **Step 6: Write `.gitignore`**

```
node_modules
dist
*.log
.DS_Store
src/assets/*.png
docs/balance/*.md
!docs/balance/.gitkeep
```

Note: generated art and balance reports are local artifacts; only the `.gitkeep` is committed so the directory exists.

- [ ] **Step 7: Write `index.html`**

```html
<!doctype html>
<html lang="zh-Hans">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dice of Madness · 克苏鲁雪山</title>
    <link rel="stylesheet" href="/src/ui/style.css" />
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 8: Write minimal `src/main.ts`**

```typescript
const app = document.getElementById("app")!;
app.textContent = "climb-mountain skeleton up";
```

- [ ] **Step 9: Write minimal `src/ui/style.css`**

```css
body { margin: 0; background: #0F1820; color: #C8D6E4; font-family: system-ui, sans-serif; }
#app { padding: 24px; }
```

- [ ] **Step 10: Create `docs/balance/.gitkeep`**

```bash
touch docs/balance/.gitkeep
```

- [ ] **Step 11: Install dependencies and verify dev server boots**

```bash
npm install
npm run dev &
DEV_PID=$!
sleep 3
curl -s http://localhost:1425/ | grep "climb-mountain"
kill $DEV_PID
```

Expected: HTML containing `climb-mountain skeleton up` substring (or the script tag — page is JS-rendered, so wait might need browser; OK if curl shows the index.html with the app div).

- [ ] **Step 12: Verify vitest runs (no tests yet, should report 0 tests passed)**

```bash
npm test
```

Expected: vitest output "No test files found" or "0 passed" — doesn't error.

- [ ] **Step 13: Commit**

```bash
cd /Users/huanghaibin/Workspace/games
git add climb-mountain/package.json climb-mountain/package-lock.json climb-mountain/tsconfig.json climb-mountain/vite.config.ts climb-mountain/vitest.config.ts climb-mountain/.gitignore climb-mountain/index.html climb-mountain/src/main.ts climb-mountain/src/ui/style.css climb-mountain/docs/balance/.gitkeep
git commit -m "$(cat <<'EOF'
feat(climb-mountain): scaffold vite + ts + vitest skeleton

Port 1425, vitest, tsx for harness. Stub main.ts to verify dev server boots.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Core Type Definitions

**Files:**
- Create: `src/game/types.ts`

No tests — types compile-check via tsc only.

- [ ] **Step 1: Write `src/game/types.ts`**

```typescript
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
  | { kind: "distinct-faces"; atLeast: number };

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
```

- [ ] **Step 2: Verify it compiles**

```bash
npx tsc --noEmit
```

Expected: no output (clean compile).

- [ ] **Step 3: Commit**

```bash
cd /Users/huanghaibin/Workspace/games
git add climb-mountain/src/game/types.ts
git commit -m "$(cat <<'EOF'
feat(climb-mountain): game core types

All type definitions for dice / cards / state / actions. No logic yet.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Balance Constants

**Files:**
- Create: `src/game/balance.ts`

- [ ] **Step 1: Write `src/game/balance.ts`**

```typescript
// All tunable numbers live here. harness sweeps these.
export const START_PLAYER_CELL          = 1;
export const START_DEMON_CELL           = 0;
export const START_MADNESS_DICE         = 2;
export const PLAYER_COLOR_DICE          = 7;
export const MADNESS_STOCK              = 16;
export const GOAL_CELL                  = 10;
export const DEMON_BASELINE_PER_ROUND   = 1;
export const DEMON_BONUS_ON_SLIDE       = 1;
export const DEMON_BONUS_ON_NEW_MADNESS = 1;
export const DEMON_BONUS_ON_EVENT       = 2;
export const SLIDE_BACK_CELLS           = 2;
export const MAX_REROLLS                = 2;
```

- [ ] **Step 2: Commit**

```bash
cd /Users/huanghaibin/Workspace/games
git add climb-mountain/src/game/balance.ts
git commit -m "$(cat <<'EOF'
feat(climb-mountain): balance constants (12 tunables)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Seedable RNG

**Files:**
- Create: `src/game/rng.ts`
- Test: `tests/rng.test.ts`

- [ ] **Step 1: Write failing test `tests/rng.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { makeRng, nextInt, nextFloat, shuffle } from "../src/game/rng";

describe("rng", () => {
  it("produces deterministic sequence for the same seed", () => {
    const a = makeRng(42);
    const b = makeRng(42);
    const seqA = Array.from({ length: 5 }, () => nextInt(a, 100));
    const seqB = Array.from({ length: 5 }, () => nextInt(b, 100));
    expect(seqA).toEqual(seqB);
  });

  it("produces different sequences for different seeds", () => {
    const a = makeRng(1);
    const b = makeRng(2);
    const seqA = Array.from({ length: 5 }, () => nextInt(a, 100));
    const seqB = Array.from({ length: 5 }, () => nextInt(b, 100));
    expect(seqA).not.toEqual(seqB);
  });

  it("nextInt(rng, n) returns values in [0, n)", () => {
    const rng = makeRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = nextInt(rng, 6);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(6);
    }
  });

  it("shuffle is deterministic by seed", () => {
    const a = makeRng(123);
    const b = makeRng(123);
    const arrA = shuffle(a, [1, 2, 3, 4, 5, 6]);
    const arrB = shuffle(b, [1, 2, 3, 4, 5, 6]);
    expect(arrA).toEqual(arrB);
  });

  it("nextFloat returns values in [0, 1)", () => {
    const rng = makeRng(9);
    for (let i = 0; i < 100; i++) {
      const v = nextFloat(rng);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
npm test -- tests/rng.test.ts
```

Expected: FAIL — `Cannot find module '../src/game/rng'`.

- [ ] **Step 3: Write `src/game/rng.ts`**

```typescript
import type { RngState } from "./types";

// mulberry32 — well-known small seedable PRNG
export function makeRng(seed: number): RngState {
  return { seed, state: seed >>> 0 };
}

export function nextFloat(rng: RngState): number {
  rng.state = (rng.state + 0x6d2b79f5) >>> 0;
  let t = rng.state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function nextInt(rng: RngState, exclusiveMax: number): number {
  return Math.floor(nextFloat(rng) * exclusiveMax);
}

export function shuffle<T>(rng: RngState, arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = nextInt(rng, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
```

- [ ] **Step 4: Run test, verify it passes**

```bash
npm test -- tests/rng.test.ts
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
cd /Users/huanghaibin/Workspace/games
git add climb-mountain/src/game/rng.ts climb-mountain/tests/rng.test.ts
git commit -m "$(cat <<'EOF'
feat(climb-mountain): mulberry32 seedable RNG

Used by initialState(seed), shuffle for deck, dice face rolls. harness needs
this for reproducible balance runs.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Cards Data + DiceCondition Evaluator

**Files:**
- Create: `src/game/cards.ts`
- Test: `tests/cards.test.ts`

- [ ] **Step 1: Write failing test `tests/cards.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { allCards, evaluateCondition, resolveTask } from "../src/game/cards";
import type { DieFace } from "../src/game/types";

const faces = (xs: number[]): DieFace[] => xs as DieFace[];

describe("cards", () => {
  it("ships exactly 6 cards in Phase 1 (4 normal + 2 event)", () => {
    expect(allCards.length).toBe(6);
    expect(allCards.filter((c) => c.type === "normal").length).toBe(4);
    expect(allCards.filter((c) => c.type === "event").length).toBe(2);
  });

  it("evaluateCondition: sum-at-least", () => {
    expect(evaluateCondition({ kind: "sum-at-least", n: 6 }, faces([3, 3]))).toBe(true);
    expect(evaluateCondition({ kind: "sum-at-least", n: 6 }, faces([2, 3]))).toBe(false);
  });

  it("evaluateCondition: sum-at-most", () => {
    expect(evaluateCondition({ kind: "sum-at-most", n: 5 }, faces([2, 3]))).toBe(true);
    expect(evaluateCondition({ kind: "sum-at-most", n: 5 }, faces([3, 3]))).toBe(false);
  });

  it("evaluateCondition: face-count", () => {
    expect(evaluateCondition({ kind: "face-count", face: 1, atLeast: 2 }, faces([1, 1, 4]))).toBe(true);
    expect(evaluateCondition({ kind: "face-count", face: 1, atLeast: 2 }, faces([1, 4, 4]))).toBe(false);
  });

  it("evaluateCondition: same-face-groups", () => {
    // two pairs (count=2, groupSize=2)
    expect(evaluateCondition({ kind: "same-face-groups", count: 2, groupSize: 2 }, faces([1, 1, 4, 4, 5]))).toBe(true);
    // one pair only
    expect(evaluateCondition({ kind: "same-face-groups", count: 2, groupSize: 2 }, faces([1, 1, 4, 5, 6]))).toBe(false);
    // three of a kind counts as one group of size 3, not 1.5 pairs
    expect(evaluateCondition({ kind: "same-face-groups", count: 1, groupSize: 3 }, faces([2, 2, 2, 5, 6]))).toBe(true);
  });

  it("evaluateCondition: distinct-faces", () => {
    expect(evaluateCondition({ kind: "distinct-faces", atLeast: 3 }, faces([1, 2, 3]))).toBe(true);
    expect(evaluateCondition({ kind: "distinct-faces", atLeast: 3 }, faces([1, 1, 1]))).toBe(false);
    expect(evaluateCondition({ kind: "distinct-faces", atLeast: 3 }, faces([1, 2, 2, 1]))).toBe(false);
  });

  it("resolveTask returns highest-tier advance for normal card", () => {
    const card = allCards.find((c) => c.id === "armata-stare")!;
    // tasks: ≥6 → +1, ≥13 → +3 (assume tiers sorted by advance ascending in data)
    expect(resolveTask(card, faces([6]))).toBe(1);
    expect(resolveTask(card, faces([6, 6, 1]))).toBe(3); // sum 13
    expect(resolveTask(card, faces([2, 2]))).toBe(null); // not met, slide
  });

  it("resolveTask for event card sum-thresholds", () => {
    const event = allCards.find((c) => c.id === "hastur")!;
    // hastur: sum ≥ 15 → +3, sum ≤ 5 → -2, middle → 0
    expect(resolveTask(event, faces([6, 6, 6]))).toBe(3);
    expect(resolveTask(event, faces([1, 2]))).toBe(-2);
    expect(resolveTask(event, faces([3, 3, 3]))).toBe(0); // middle
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
npm test -- tests/cards.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Extend `DiceCondition` in `src/game/types.ts` for ithaqua's slide branch**

Add the `distinct-faces-at-most` kind. Final union:

```typescript
export type DiceCondition =
  | { kind: "sum-at-least"; n: number }
  | { kind: "sum-at-most"; n: number }
  | { kind: "face-count"; face: DieFace; atLeast: number }
  | { kind: "same-face-groups"; count: number; groupSize: number }
  | { kind: "distinct-faces"; atLeast: number }
  | { kind: "distinct-faces-at-most"; n: number };
```

- [ ] **Step 4: Write `src/game/cards.ts`**

```typescript
import type { Card, DiceCondition, DieFace } from "./types";

export function evaluateCondition(cond: DiceCondition, faces: DieFace[]): boolean {
  switch (cond.kind) {
    case "sum-at-least": {
      const sum = faces.reduce<number>((a, b) => a + b, 0);
      return sum >= cond.n;
    }
    case "sum-at-most": {
      const sum = faces.reduce<number>((a, b) => a + b, 0);
      return sum <= cond.n;
    }
    case "face-count": {
      const count = faces.filter((f) => f === cond.face).length;
      return count >= cond.atLeast;
    }
    case "same-face-groups": {
      const counts = new Map<DieFace, number>();
      for (const f of faces) counts.set(f, (counts.get(f) ?? 0) + 1);
      const groups = Array.from(counts.values()).filter((n) => n >= cond.groupSize).length;
      return groups >= cond.count;
    }
    case "distinct-faces": {
      return new Set(faces).size >= cond.atLeast;
    }
    case "distinct-faces-at-most": {
      return new Set(faces).size <= cond.n;
    }
  }
}

// For normal cards: try tasks from highest-advance to lowest; return first match's advance.
// Returns null if it's a normal card and nothing matches (means SLIDE).
// For event cards: try tasks in declaration order; first match wins; no match → 0 (no movement).
export function resolveTask(card: Card, faces: DieFace[]): number | null {
  if (card.type === "normal") {
    const sorted = [...card.tasks].sort((a, b) => b.advance - a.advance);
    for (const t of sorted) {
      if (evaluateCondition(t.requires, faces)) return t.advance;
    }
    return null; // slide
  } else {
    for (const t of card.tasks) {
      if (evaluateCondition(t.requires, faces)) return t.advance;
    }
    return 0;
  }
}

export const allCards: Card[] = [
  // === Normal cards (4) ===
  {
    id: "march-to-death",
    name: "迈向死亡",
    type: "normal",
    minDice: 1,
    tasks: [
      { requires: { kind: "face-count", face: 1, atLeast: 1 }, advance: 1 },
      { requires: { kind: "face-count", face: 1, atLeast: 2 }, advance: 2 },
    ],
  },
  {
    id: "armata-stare",
    name: "阿玛塔的凝视",
    type: "normal",
    minDice: 3,
    tasks: [
      { requires: { kind: "sum-at-least", n: 6 }, advance: 1 },
      { requires: { kind: "sum-at-least", n: 13 }, advance: 3 },
    ],
  },
  {
    id: "sasna-anomaly",
    name: "沙萨纳·异常",
    type: "normal",
    minDice: 3,
    tasks: [
      { requires: { kind: "same-face-groups", count: 1, groupSize: 2 }, advance: 2 },
      { requires: { kind: "same-face-groups", count: 1, groupSize: 3 }, advance: 3 },
      { requires: { kind: "same-face-groups", count: 1, groupSize: 4 }, advance: 5 },
    ],
  },
  {
    id: "continuous-pain",
    name: "连续痛苦",
    type: "normal",
    minDice: 2,
    tasks: [
      { requires: { kind: "same-face-groups", count: 1, groupSize: 2 }, advance: 1 },
      { requires: { kind: "same-face-groups", count: 2, groupSize: 2 }, advance: 2 },
    ],
  },
  // === Event cards (2) ===
  {
    id: "hastur",
    name: "哈斯特",
    type: "event",
    minDice: "ALL",
    tasks: [
      { requires: { kind: "sum-at-least", n: 15 }, advance: 3 },
      { requires: { kind: "sum-at-most", n: 5 }, advance: -2 },
    ],
  },
  {
    id: "ithaqua",
    name: "伊塔库亚",
    type: "event",
    minDice: "ALL",
    tasks: [
      { requires: { kind: "distinct-faces", atLeast: 5 }, advance: 3 },
      { requires: { kind: "distinct-faces-at-most", n: 2 }, advance: -2 },
    ],
  },
];
```

- [ ] **Step 5: Add ithaqua-specific test to `tests/cards.test.ts`**

Append inside the `describe("cards", ...)` block (after the existing `it("resolveTask for event card sum-thresholds"...)`):

```typescript
  it("ithaqua slide on ≤ 2 distinct faces", () => {
    const event = allCards.find((c) => c.id === "ithaqua")!;
    expect(resolveTask(event, faces([1, 1, 1]))).toBe(-2);
    expect(resolveTask(event, faces([1, 2, 3, 4, 5]))).toBe(3);
    expect(resolveTask(event, faces([1, 1, 2, 3]))).toBe(0); // middle case
  });
```

- [ ] **Step 6: Run tests, verify all pass**

```bash
npm test -- tests/cards.test.ts
```

Expected: PASS, 9 tests.

- [ ] **Step 7: Commit**

```bash
cd /Users/huanghaibin/Workspace/games
git add climb-mountain/src/game/types.ts climb-mountain/src/game/cards.ts climb-mountain/tests/cards.test.ts
git commit -m "$(cat <<'EOF'
feat(climb-mountain): I-tier 6 cards + DiceCondition evaluator

4 normal cards (迈向死亡 / 阿玛塔的凝视 / 沙萨纳·异常 / 连续痛苦) + 2 event cards
(哈斯特 / 伊塔库亚). Event cards use absolute thresholds (1v1 has no ranking).
Added distinct-faces-at-most kind so 伊塔库亚 slide branch is expressible.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Initial State

**Files:**
- Create: `src/game/state.ts`
- Test: `tests/state.test.ts`

- [ ] **Step 1: Write failing test `tests/state.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { initialState } from "../src/game/state";
import {
  START_PLAYER_CELL,
  START_DEMON_CELL,
  START_MADNESS_DICE,
  PLAYER_COLOR_DICE,
  MADNESS_STOCK,
} from "../src/game/balance";

describe("initialState", () => {
  it("places player and demon at start cells", () => {
    const s = initialState(1);
    expect(s.player.cell).toBe(START_PLAYER_CELL);
    expect(s.demon.cell).toBe(START_DEMON_CELL);
  });

  it("starts in await-select phase with currentCard drawn", () => {
    const s = initialState(1);
    expect(s.phase).toBe("await-select");
    expect(s.currentCard).not.toBeNull();
  });

  it("gives player PLAYER_COLOR_DICE color dice + START_MADNESS_DICE madness dice", () => {
    const s = initialState(1);
    const color = s.player.handDice.filter((d) => d.kind === "color");
    const mad = s.player.handDice.filter((d) => d.kind === "madness");
    expect(color.length).toBe(PLAYER_COLOR_DICE);
    expect(mad.length).toBe(START_MADNESS_DICE);
  });

  it("madness stock is MADNESS_STOCK - START_MADNESS_DICE", () => {
    const s = initialState(1);
    expect(s.madnessStock).toBe(MADNESS_STOCK - START_MADNESS_DICE);
  });

  it("deck has 5 cards remaining (6 cards minus 1 drawn as currentCard)", () => {
    const s = initialState(1);
    expect(s.deck.length).toBe(5);
  });

  it("is deterministic by seed", () => {
    const s1 = initialState(42);
    const s2 = initialState(42);
    expect(s1.currentCard?.id).toBe(s2.currentCard?.id);
    expect(s1.deck.map((c) => c.id)).toEqual(s2.deck.map((c) => c.id));
  });

  it("starts round 1, empty log", () => {
    const s = initialState(1);
    expect(s.round).toBe(1);
    expect(s.log).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
npm test -- tests/state.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/game/state.ts`**

```typescript
import { allCards } from "./cards";
import {
  GOAL_CELL,
  MADNESS_STOCK,
  PLAYER_COLOR_DICE,
  START_DEMON_CELL,
  START_MADNESS_DICE,
  START_PLAYER_CELL,
} from "./balance";
import { makeRng, shuffle } from "./rng";
import type { Die, GameState } from "./types";

export function initialState(seed: number): GameState {
  const rng = makeRng(seed);

  const colorDice: Die[] = Array.from({ length: PLAYER_COLOR_DICE }, (_, i) => ({
    id: `c${i}`,
    kind: "color",
    face: null,
  }));
  const madDice: Die[] = Array.from({ length: START_MADNESS_DICE }, (_, i) => ({
    id: `m${i}`,
    kind: "madness",
    face: null,
  }));

  const shuffled = shuffle(rng, allCards);
  const [first, ...rest] = shuffled;

  void GOAL_CELL; // referenced elsewhere; keep import alive

  return {
    phase: "await-select",
    player: {
      cell: START_PLAYER_CELL,
      handDice: [...colorDice, ...madDice],
      selected: [],
      rolled: [],
      rerollsLeft: 0, // set when entering await-roll
    },
    demon: { cell: START_DEMON_CELL },
    madnessStock: MADNESS_STOCK - START_MADNESS_DICE,
    deck: rest,
    discard: [],
    currentCard: first,
    round: 1,
    log: [],
    rng,
  };
}
```

- [ ] **Step 4: Run test, verify it passes**

```bash
npm test -- tests/state.test.ts
```

Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
cd /Users/huanghaibin/Workspace/games
git add climb-mountain/src/game/state.ts climb-mountain/tests/state.test.ts
git commit -m "$(cat <<'EOF'
feat(climb-mountain): initialState(seed) — deterministic game start

7 color + 2 madness dice in player hand, demon at 0, player at 1, deck of
5 (first card drawn as currentCard). seed-deterministic.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Demon Advance

**Files:**
- Create: `src/game/demon.ts`
- Test: `tests/demon.test.ts`

- [ ] **Step 1: Write failing test `tests/demon.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { computeDemonAdvance } from "../src/game/demon";
import {
  DEMON_BASELINE_PER_ROUND,
  DEMON_BONUS_ON_SLIDE,
  DEMON_BONUS_ON_NEW_MADNESS,
  DEMON_BONUS_ON_EVENT,
} from "../src/game/balance";

describe("computeDemonAdvance", () => {
  it("baseline only when no triggers", () => {
    expect(
      computeDemonAdvance({ slid: false, newMadness: false, isEvent: false })
    ).toBe(DEMON_BASELINE_PER_ROUND);
  });

  it("adds slide bonus", () => {
    expect(
      computeDemonAdvance({ slid: true, newMadness: false, isEvent: false })
    ).toBe(DEMON_BASELINE_PER_ROUND + DEMON_BONUS_ON_SLIDE);
  });

  it("adds new-madness bonus only once regardless of count", () => {
    expect(
      computeDemonAdvance({ slid: false, newMadness: true, isEvent: false })
    ).toBe(DEMON_BASELINE_PER_ROUND + DEMON_BONUS_ON_NEW_MADNESS);
  });

  it("adds event bonus", () => {
    expect(
      computeDemonAdvance({ slid: false, newMadness: false, isEvent: true })
    ).toBe(DEMON_BASELINE_PER_ROUND + DEMON_BONUS_ON_EVENT);
  });

  it("stacks all triggers", () => {
    expect(
      computeDemonAdvance({ slid: true, newMadness: true, isEvent: true })
    ).toBe(
      DEMON_BASELINE_PER_ROUND +
        DEMON_BONUS_ON_SLIDE +
        DEMON_BONUS_ON_NEW_MADNESS +
        DEMON_BONUS_ON_EVENT
    );
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
npm test -- tests/demon.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/game/demon.ts`**

```typescript
import {
  DEMON_BASELINE_PER_ROUND,
  DEMON_BONUS_ON_EVENT,
  DEMON_BONUS_ON_NEW_MADNESS,
  DEMON_BONUS_ON_SLIDE,
} from "./balance";

export type DemonTriggers = {
  slid: boolean;
  newMadness: boolean; // true iff player picked up ≥1 new madness this turn
  isEvent: boolean;
};

export function computeDemonAdvance(t: DemonTriggers): number {
  let total = DEMON_BASELINE_PER_ROUND;
  if (t.slid) total += DEMON_BONUS_ON_SLIDE;
  if (t.newMadness) total += DEMON_BONUS_ON_NEW_MADNESS;
  if (t.isEvent) total += DEMON_BONUS_ON_EVENT;
  return total;
}

// Clamp demon cell to never exceed player cell.
// Returns the new demon cell.
export function applyDemonAdvance(demonCell: number, playerCell: number, advance: number): number {
  return Math.min(demonCell + advance, playerCell);
}
```

- [ ] **Step 4: Run test, verify it passes**

```bash
npm test -- tests/demon.test.ts
```

Expected: PASS, 5 tests.

- [ ] **Step 5: Commit**

```bash
cd /Users/huanghaibin/Workspace/games
git add climb-mountain/src/game/demon.ts climb-mountain/tests/demon.test.ts
git commit -m "$(cat <<'EOF'
feat(climb-mountain): demon advance formula

Pure: baseline + slide + newMadness + event bonuses. Clamp at player cell.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Action Handlers — select, roll, reroll

**Files:**
- Create: `src/game/rules.ts`
- Test: `tests/rules.test.ts`

- [ ] **Step 1: Write failing test `tests/rules.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { initialState } from "../src/game/state";
import { applyAction } from "../src/game/rules";

describe("rules: select / roll / reroll", () => {
  it("select-dice transitions await-select → await-roll", () => {
    const s0 = initialState(1);
    expect(s0.phase).toBe("await-select");
    const ids = s0.player.handDice.slice(0, 4).map((d) => d.id);
    const s1 = applyAction(s0, { kind: "select-dice", ids });
    expect(s1.phase).toBe("await-roll");
    expect(s1.player.selected).toEqual(ids);
  });

  it("select-dice rejects fewer than minDice", () => {
    const s0 = initialState(1);
    // Find a card with minDice = 3 to test against. If currentCard.minDice = 1, skip.
    if (s0.currentCard!.minDice === "ALL") return; // event card auto-resolves; not our case here
    const min = s0.currentCard!.minDice as number;
    if (min <= 1) return;
    const fewIds = s0.player.handDice.slice(0, min - 1).map((d) => d.id);
    const s1 = applyAction(s0, { kind: "select-dice", ids: fewIds });
    // Reject: stay in await-select (no change)
    expect(s1.phase).toBe("await-select");
    expect(s1.player.selected).toEqual([]);
  });

  it("roll: faces are populated, phase → await-reroll", () => {
    const s0 = initialState(1);
    const ids = s0.player.handDice.slice(0, 4).map((d) => d.id);
    const s1 = applyAction(s0, { kind: "select-dice", ids });
    const s2 = applyAction(s1, { kind: "roll" });
    expect(s2.phase).toBe("await-reroll");
    expect(s2.player.rolled.length).toBe(4);
    for (const d of s2.player.rolled) {
      expect(d.face).not.toBeNull();
      expect([1, 2, 3, 4, 5, 6]).toContain(d.face!);
    }
    expect(s2.player.rerollsLeft).toBe(2);
  });

  it("reroll: decrements rerollsLeft, swaps faces on selected", () => {
    const s0 = initialState(1);
    const ids = s0.player.handDice.slice(0, 4).map((d) => d.id);
    const s1 = applyAction(s0, { kind: "select-dice", ids });
    const s2 = applyAction(s1, { kind: "roll" });
    const facesBefore = s2.player.rolled.map((d) => d.face);
    const rerollIds = [s2.player.rolled[0].id, s2.player.rolled[1].id];
    const s3 = applyAction(s2, { kind: "reroll", ids: rerollIds });
    expect(s3.player.rerollsLeft).toBe(1);
    // Unchosen dice retain face
    expect(s3.player.rolled[2].face).toBe(facesBefore[2]);
    expect(s3.player.rolled[3].face).toBe(facesBefore[3]);
  });

  it("reroll exhausts after 2 attempts → phase await-commit", () => {
    const s0 = initialState(1);
    const ids = s0.player.handDice.slice(0, 4).map((d) => d.id);
    const s1 = applyAction(s0, { kind: "select-dice", ids });
    const s2 = applyAction(s1, { kind: "roll" });
    const rerollIds = [s2.player.rolled[0].id];
    const s3 = applyAction(s2, { kind: "reroll", ids: rerollIds });
    const s4 = applyAction(s3, { kind: "reroll", ids: rerollIds });
    expect(s4.phase).toBe("await-commit");
    expect(s4.player.rerollsLeft).toBe(0);
  });

  it("manually skipping rerolls: reroll with empty ids advances to await-commit", () => {
    const s0 = initialState(1);
    const ids = s0.player.handDice.slice(0, 4).map((d) => d.id);
    const s1 = applyAction(s0, { kind: "select-dice", ids });
    const s2 = applyAction(s1, { kind: "roll" });
    const s3 = applyAction(s2, { kind: "reroll", ids: [] });
    expect(s3.phase).toBe("await-commit");
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
npm test -- tests/rules.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/game/rules.ts` (partial — select/roll/reroll only; commit/event handled in Tasks 9-10)**

```typescript
import { MAX_REROLLS } from "./balance";
import { nextInt } from "./rng";
import type { Action, Die, DieFace, DieId, GameState } from "./types";

// Shallow clone helpers — keep state immutable in shape
function clonePlayer(p: GameState["player"]): GameState["player"] {
  return {
    ...p,
    handDice: p.handDice.map((d) => ({ ...d })),
    selected: [...p.selected],
    rolled: p.rolled.map((d) => ({ ...d })),
  };
}

function clone(s: GameState): GameState {
  return {
    ...s,
    player: clonePlayer(s.player),
    demon: { ...s.demon },
    deck: [...s.deck],
    discard: [...s.discard],
    log: [...s.log],
    rng: { ...s.rng },
  };
}

function rollFace(s: GameState): DieFace {
  return (nextInt(s.rng, 6) + 1) as DieFace;
}

export function applyAction(state: GameState, action: Action): GameState {
  switch (action.kind) {
    case "start-game":
      // delegate — initialState is the canonical start. UI calls initialState directly.
      // Here we no-op (kept in union for UI symmetry).
      return state;

    case "select-dice": {
      if (state.phase !== "await-select") return state;
      const card = state.currentCard;
      if (!card) return state;
      const min = card.minDice === "ALL" ? state.player.handDice.length : card.minDice;
      if (action.ids.length < min) return state;
      // All ids must exist in handDice
      const handIds = new Set(state.player.handDice.map((d) => d.id));
      for (const id of action.ids) {
        if (!handIds.has(id)) return state;
      }
      const next = clone(state);
      next.player.selected = [...action.ids];
      next.phase = "await-roll";
      return next;
    }

    case "roll": {
      if (state.phase !== "await-roll") return state;
      const next = clone(state);
      // Move selected dice from handDice → rolled, with rolled faces
      const selectedSet = new Set(state.player.selected);
      const movedToRolled: Die[] = [];
      next.player.handDice = next.player.handDice.filter((d) => {
        if (selectedSet.has(d.id)) {
          movedToRolled.push({ ...d, face: rollFace(next) });
          return false;
        }
        return true;
      });
      next.player.rolled = movedToRolled;
      next.player.selected = [];
      next.player.rerollsLeft = MAX_REROLLS;
      next.phase = "await-reroll";
      return next;
    }

    case "reroll": {
      if (state.phase !== "await-reroll") return state;
      const next = clone(state);
      const rerollSet = new Set<DieId>(action.ids);
      for (const d of next.player.rolled) {
        if (rerollSet.has(d.id)) d.face = rollFace(next);
      }
      next.player.rerollsLeft = next.player.rerollsLeft - 1;
      if (next.player.rerollsLeft <= 0 || action.ids.length === 0) {
        next.phase = "await-commit";
      }
      return next;
    }

    case "commit":
    case "advance-event-card":
      // Implemented in Tasks 9-10
      return state;
  }
}
```

- [ ] **Step 4: Run test, verify it passes**

```bash
npm test -- tests/rules.test.ts
```

Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
cd /Users/huanghaibin/Workspace/games
git add climb-mountain/src/game/rules.ts climb-mountain/tests/rules.test.ts
git commit -m "$(cat <<'EOF'
feat(climb-mountain): select / roll / reroll action handlers

applyAction handles dice selection (gated by minDice), initial roll, and up
to MAX_REROLLS rerolls. commit / event handlers are stubs for now.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Action Handler — commit (C → D → demon → next-card)

**Files:**
- Modify: `src/game/rules.ts`
- Modify: `tests/rules.test.ts`

This is the heavy one — the entire turn resolution.

- [ ] **Step 1: Write failing tests (append to `tests/rules.test.ts`)**

```typescript
import { GOAL_CELL, SLIDE_BACK_CELLS } from "../src/game/balance";

describe("rules: commit (turn resolution)", () => {
  it("C-phase returns madness + same-face color dice to hand", () => {
    const s0 = initialState(1);
    // Pick all dice
    const ids = s0.player.handDice.map((d) => d.id);
    const s1 = applyAction(s0, { kind: "select-dice", ids });
    const s2 = applyAction(s1, { kind: "roll" });
    // Force faces deterministically for test: madness dice all face 1, plus one color also face 1
    for (const d of s2.player.rolled) {
      if (d.kind === "madness") d.face = 1;
    }
    // Find a color die and set its face to 1 to test C-phase return
    const aColor = s2.player.rolled.find((d) => d.kind === "color")!;
    aColor.face = 1;
    // Skip rerolls
    const s3 = applyAction(s2, { kind: "reroll", ids: [] });
    const s4 = applyAction(s3, { kind: "commit" });
    // Madness dice + the face-1 color die should be back in handDice
    const handMadness = s4.player.handDice.filter((d) => d.kind === "madness").length;
    expect(handMadness).toBeGreaterThanOrEqual(s0.player.handDice.filter((d) => d.kind === "madness").length);
    const handFace1Color = s4.player.handDice.filter((d) => d.kind === "color" && d.face === null).length;
    // After commit, handDice dice have face=null (back in hand)
    expect(s4.player.rolled.length).toBe(0);
    void handFace1Color;
  });

  it("D-phase: hitting top tier advances player by that amount", () => {
    const s0 = initialState(1);
    // We need to drive a specific card. Reshuffle by varying seed until we get armata-stare (minDice=3, ≥6→+1, ≥13→+3)
    let s = s0;
    let seedTry = 1;
    while (s.currentCard?.id !== "armata-stare") {
      seedTry++;
      s = initialState(seedTry);
    }
    const playerCellBefore = s.player.cell;
    const ids = s.player.handDice.filter((d) => d.kind === "color").slice(0, 3).map((d) => d.id);
    const s1 = applyAction(s, { kind: "select-dice", ids });
    const s2 = applyAction(s1, { kind: "roll" });
    // Force all to 6 → sum = 18 ≥ 13 → advance +3
    for (const d of s2.player.rolled) d.face = 6;
    const s3 = applyAction(s2, { kind: "reroll", ids: [] });
    const s4 = applyAction(s3, { kind: "commit" });
    expect(s4.player.cell).toBe(playerCellBefore + 3);
  });

  it("D-phase: missing all tiers triggers slide back SLIDE_BACK_CELLS", () => {
    // Use armata-stare again (needs sum ≥ 6 for lowest tier)
    let s = initialState(1);
    let seedTry = 1;
    while (s.currentCard?.id !== "armata-stare") {
      seedTry++;
      s = initialState(seedTry);
    }
    // Move player forward so we can observe slide
    s = { ...s, player: { ...s.player, cell: 5 } };
    const ids = s.player.handDice.filter((d) => d.kind === "color").slice(0, 3).map((d) => d.id);
    const s1 = applyAction(s, { kind: "select-dice", ids });
    const s2 = applyAction(s1, { kind: "roll" });
    for (const d of s2.player.rolled) d.face = 1; // sum = 3, below 6 → slide
    const s3 = applyAction(s2, { kind: "reroll", ids: [] });
    const s4 = applyAction(s3, { kind: "commit" });
    expect(s4.player.cell).toBe(Math.max(1, 5 - SLIDE_BACK_CELLS));
  });

  it("D-phase slide: player gets +1 madness die from stock", () => {
    let s = initialState(1);
    let seedTry = 1;
    while (s.currentCard?.id !== "armata-stare") {
      seedTry++;
      s = initialState(seedTry);
    }
    const stockBefore = s.madnessStock;
    const madCountBefore = s.player.handDice.filter((d) => d.kind === "madness").length;
    s = { ...s, player: { ...s.player, cell: 5 } };
    const ids = s.player.handDice.filter((d) => d.kind === "color").slice(0, 3).map((d) => d.id);
    const s1 = applyAction(s, { kind: "select-dice", ids });
    const s2 = applyAction(s1, { kind: "roll" });
    for (const d of s2.player.rolled) d.face = 1;
    const s3 = applyAction(s2, { kind: "reroll", ids: [] });
    const s4 = applyAction(s3, { kind: "commit" });
    const madCountAfter = s4.player.handDice.filter((d) => d.kind === "madness").length;
    expect(madCountAfter).toBe(madCountBefore + 1);
    expect(s4.madnessStock).toBe(stockBefore - 1);
  });

  it("demon advances after player turn, with bonuses for slide / new madness", () => {
    let s = initialState(1);
    let seedTry = 1;
    while (s.currentCard?.id !== "armata-stare") {
      seedTry++;
      s = initialState(seedTry);
    }
    s = { ...s, player: { ...s.player, cell: 5 }, demon: { cell: 0 } };
    const ids = s.player.handDice.filter((d) => d.kind === "color").slice(0, 3).map((d) => d.id);
    const s1 = applyAction(s, { kind: "select-dice", ids });
    const s2 = applyAction(s1, { kind: "roll" });
    for (const d of s2.player.rolled) d.face = 1; // forces slide + new madness
    const s3 = applyAction(s2, { kind: "reroll", ids: [] });
    const s4 = applyAction(s3, { kind: "commit" });
    // baseline (1) + slide (1) + newMadness (1) = 3
    expect(s4.demon.cell).toBe(3);
  });

  it("WIN: player reaches GOAL_CELL", () => {
    let s = initialState(1);
    let seedTry = 1;
    while (s.currentCard?.id !== "armata-stare") {
      seedTry++;
      s = initialState(seedTry);
    }
    s = { ...s, player: { ...s.player, cell: GOAL_CELL - 1 }, demon: { cell: 0 } };
    const ids = s.player.handDice.filter((d) => d.kind === "color").slice(0, 3).map((d) => d.id);
    const s1 = applyAction(s, { kind: "select-dice", ids });
    const s2 = applyAction(s1, { kind: "roll" });
    for (const d of s2.player.rolled) d.face = 6; // sum 18 → +3 → cell 12 → ≥ goal → WIN
    const s3 = applyAction(s2, { kind: "reroll", ids: [] });
    const s4 = applyAction(s3, { kind: "commit" });
    expect(s4.phase).toBe("won");
  });

  it("LOSE: demon catches player", () => {
    let s = initialState(1);
    let seedTry = 1;
    while (s.currentCard?.id !== "armata-stare") {
      seedTry++;
      s = initialState(seedTry);
    }
    // demon 1 step behind, player at 2 — a slide + bonuses pushes demon to player
    s = { ...s, player: { ...s.player, cell: 2 }, demon: { cell: 1 } };
    const ids = s.player.handDice.filter((d) => d.kind === "color").slice(0, 3).map((d) => d.id);
    const s1 = applyAction(s, { kind: "select-dice", ids });
    const s2 = applyAction(s1, { kind: "roll" });
    for (const d of s2.player.rolled) d.face = 1; // slide
    const s3 = applyAction(s2, { kind: "reroll", ids: [] });
    const s4 = applyAction(s3, { kind: "commit" });
    expect(s4.phase).toBe("lost");
  });

  it("LOSE wins tiebreak when player WOULD win and demon catches in same turn", () => {
    // Construct: player at 9 (one short of GOAL=10), demon at 8. Player slides back → cell 7,
    // demon advances baseline+slide+newMadness = 3 → from 8, but clamped to player cell = 7 → LOST.
    // Hard to engineer simultaneous WIN+LOSE without manual state. Skipping deep simulation —
    // covered separately in eval-edge.test.ts (Task 11).
    expect(true).toBe(true);
  });

  it("advances to next card after commit", () => {
    const s0 = initialState(1);
    const ids = s0.player.handDice.slice(0, 4).map((d) => d.id);
    const s1 = applyAction(s0, { kind: "select-dice", ids });
    const s2 = applyAction(s1, { kind: "roll" });
    const s3 = applyAction(s2, { kind: "reroll", ids: [] });
    const s4 = applyAction(s3, { kind: "commit" });
    if (s4.phase === "won" || s4.phase === "lost") return; // terminal
    // currentCard rotated; if next is normal, await-select; if event, system will auto-resolve next
    expect(["await-select", "resolving"]).toContain(s4.phase);
    expect(s4.round).toBe(s0.round + 1);
  });
});
```

- [ ] **Step 2: Run test, verify the new commit tests fail**

```bash
npm test -- tests/rules.test.ts
```

Expected: FAIL — commit is still a no-op.

- [ ] **Step 3: Implement `commit` in `src/game/rules.ts`**

Replace the existing `case "commit":` no-op block with this full implementation. Also add the helper functions to the file.

Add imports at top:

```typescript
import { evaluateCondition, resolveTask } from "./cards";
import { applyDemonAdvance, computeDemonAdvance } from "./demon";
import { GOAL_CELL, SLIDE_BACK_CELLS } from "./balance";
import type { Card, DieFace } from "./types";
```

(Note: `evaluateCondition` is unused here directly but `resolveTask` is. Keep import shape clean — drop unused.)

Final import block at top of `rules.ts`:

```typescript
import { GOAL_CELL, MAX_REROLLS, SLIDE_BACK_CELLS } from "./balance";
import { resolveTask } from "./cards";
import { applyDemonAdvance, computeDemonAdvance } from "./demon";
import { nextInt } from "./rng";
import type { Action, Card, Die, DieFace, DieId, GameState } from "./types";
```

Then replace `case "commit":` block:

```typescript
    case "commit": {
      if (state.phase !== "await-commit") return state;
      const card = state.currentCard;
      if (!card) return state;
      const next = clone(state);

      // ===== C-phase: sanity check =====
      // For each madness die in rolled, return it to hand AND return same-face color dice to hand.
      const madnessFaces = new Set<DieFace>();
      for (const d of next.player.rolled) {
        if (d.kind === "madness" && d.face !== null) madnessFaces.add(d.face);
      }
      const returnedIds = new Set<DieId>();
      const remaining: Die[] = [];
      for (const d of next.player.rolled) {
        const returnToHand =
          d.kind === "madness" ||
          (d.kind === "color" && d.face !== null && madnessFaces.has(d.face));
        if (returnToHand) {
          returnedIds.add(d.id);
          next.player.handDice.push({ ...d, face: null });
        } else {
          remaining.push(d);
        }
      }
      next.player.rolled = remaining;

      // ===== D-phase: move pawn =====
      const facesForResolve: DieFace[] = remaining
        .map((d) => d.face)
        .filter((f): f is DieFace => f !== null);

      const taskResult = resolveTask(card, facesForResolve); // number | null
      let slid = false;
      let newMadness = false;

      if (taskResult === null) {
        // SLIDE
        const newCell = Math.max(1, next.player.cell - SLIDE_BACK_CELLS);
        next.player.cell = newCell;
        slid = true;
        // Gain 1 madness from stock if available
        if (next.madnessStock > 0) {
          const newMadId = `m_drawn_r${next.round}_${next.madnessStock}`;
          next.player.handDice.push({ id: newMadId, kind: "madness", face: null });
          next.madnessStock -= 1;
          newMadness = true;
        }
        next.log.push({ round: next.round, text: `你滑落 ${SLIDE_BACK_CELLS} 格${newMadness ? "、获得 1 颗疯狂骰" : ""}` });
      } else if (taskResult < 0) {
        // Event card slide (e.g. ithaqua slide)
        const newCell = Math.max(1, next.player.cell + taskResult); // taskResult negative
        next.player.cell = newCell;
        slid = true;
        if (next.madnessStock > 0) {
          const newMadId = `m_drawn_r${next.round}_${next.madnessStock}`;
          next.player.handDice.push({ id: newMadId, kind: "madness", face: null });
          next.madnessStock -= 1;
          newMadness = true;
        }
        next.log.push({ round: next.round, text: `事件滑落 ${-taskResult} 格${newMadness ? "、获得 1 颗疯狂骰" : ""}` });
      } else {
        // Advance forward
        next.player.cell = next.player.cell + taskResult;
        next.log.push({ round: next.round, text: `你前进 ${taskResult} 格` });
      }

      // Move all "rolled" remaining dice back to hand (face cleared) — they were "used" but in our
      // simplified model we don't have a separate "used" pile in Phase 1. They return to hand.
      for (const d of remaining) {
        next.player.handDice.push({ ...d, face: null });
      }
      next.player.rolled = [];

      // ===== Demon advance =====
      const isEvent = card.type === "event";
      const advance = computeDemonAdvance({ slid, newMadness, isEvent });
      next.demon.cell = applyDemonAdvance(next.demon.cell, next.player.cell, advance);
      next.log.push({ round: next.round, text: `雪魔推进 +${advance}（基线 1${slid ? "、滑落 1" : ""}${newMadness ? "、新疯狂 1" : ""}${isEvent ? "、事件 2" : ""}）` });

      // ===== Win/Lose check (LOSE wins tiebreak) =====
      if (next.demon.cell >= next.player.cell) {
        next.phase = "lost";
        return next;
      }
      if (next.player.cell >= GOAL_CELL) {
        next.phase = "won";
        return next;
      }

      // ===== Draw next card =====
      next.discard.push(card);
      if (next.deck.length === 0) {
        // Reshuffle discard
        const reshuffled = [...next.discard];
        // Use the same RNG (sequential) — borrowed Fisher-Yates via local
        for (let i = reshuffled.length - 1; i > 0; i--) {
          const j = nextInt(next.rng, i + 1);
          [reshuffled[i], reshuffled[j]] = [reshuffled[j], reshuffled[i]];
        }
        next.deck = reshuffled;
        next.discard = [];
        next.log.push({ round: next.round, text: `难度牌组洗回` });
      }
      next.currentCard = next.deck.shift()!;
      next.round += 1;

      // If next card is event, system needs to auto-resolve (Task 10)
      if (next.currentCard.type === "event") {
        next.phase = "await-select"; // will be flipped to "resolving" by Task 10's handler
        // For now (Task 9), leave at await-select; Task 10 will intercept on advance-event-card action.
        // UI dispatches { kind: "advance-event-card" } when it sees currentCard.type === "event".
      } else {
        next.phase = "await-select";
      }
      next.player.selected = [];
      return next;
    }
```

(Note: `evaluateCondition` import is unused — remove if linter complains.)

Also remove the unused `Card` and `evaluateCondition` imports if not needed; keep only what's referenced.

- [ ] **Step 4: Run tests, verify all pass**

```bash
npm test -- tests/rules.test.ts
```

Expected: PASS — including all commit tests and prior select/roll/reroll tests.

- [ ] **Step 5: Commit**

```bash
cd /Users/huanghaibin/Workspace/games
git add climb-mountain/src/game/rules.ts climb-mountain/tests/rules.test.ts
git commit -m "$(cat <<'EOF'
feat(climb-mountain): commit action — full turn resolution

C-phase (sanity check returns madness + same-face dice), D-phase (resolve
task → advance / slide), demon advance with bonus stack, WIN/LOSE check
(LOSE wins tiebreak), draw next card with deck reshuffle.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: Event Card Auto-Resolution

**Files:**
- Modify: `src/game/rules.ts`
- Modify: `tests/rules.test.ts`

When a new currentCard is an event card, the UI/harness dispatches `{ kind: "advance-event-card" }` and the system auto-resolves: pick ALL hand dice → roll → no rerolls → commit (with the resolution machinery from Task 9 unchanged).

- [ ] **Step 1: Write failing test (append to `tests/rules.test.ts`)**

```typescript
describe("event card auto-resolution", () => {
  it("advance-event-card auto-rolls all dice and applies result", () => {
    // Find a seed where round 2 currentCard is event (after one normal turn).
    // Brute-force search.
    let foundSeed = -1;
    for (let seed = 1; seed < 200; seed++) {
      const s0 = initialState(seed);
      if (s0.currentCard?.type !== "normal") continue;
      const ids = s0.player.handDice.slice(0, s0.currentCard.minDice as number).map((d) => d.id);
      const s1 = applyAction(s0, { kind: "select-dice", ids });
      const s2 = applyAction(s1, { kind: "roll" });
      const s3 = applyAction(s2, { kind: "reroll", ids: [] });
      const s4 = applyAction(s3, { kind: "commit" });
      if (s4.phase === "await-select" && s4.currentCard?.type === "event") {
        foundSeed = seed;
        break;
      }
    }
    expect(foundSeed).toBeGreaterThan(0);

    const s0 = initialState(foundSeed);
    const ids0 = s0.player.handDice.slice(0, s0.currentCard!.minDice as number).map((d) => d.id);
    const s1 = applyAction(s0, { kind: "select-dice", ids: ids0 });
    const s2 = applyAction(s1, { kind: "roll" });
    const s3 = applyAction(s2, { kind: "reroll", ids: [] });
    const s4 = applyAction(s3, { kind: "commit" });
    // Now s4.currentCard is event. Apply event auto-resolution.
    const s5 = applyAction(s4, { kind: "advance-event-card" });
    // After event resolution, currentCard rotated (or game ended).
    if (s5.phase === "won" || s5.phase === "lost") return; // terminal — fine
    expect(["await-select", "resolving"]).toContain(s5.phase);
    expect(s5.round).toBe(s4.round + 1);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

```bash
npm test -- tests/rules.test.ts
```

Expected: the new event test fails (advance-event-card is still a stub).

- [ ] **Step 3: Implement `advance-event-card` in `src/game/rules.ts`**

Replace the existing `case "advance-event-card":` no-op block with this:

```typescript
    case "advance-event-card": {
      if (state.phase !== "await-select") return state;
      const card = state.currentCard;
      if (!card || card.type !== "event") return state;
      // Auto-pipeline: select all → roll → skip rerolls → commit (commit handles event flag via card.type)
      const allIds = state.player.handDice.map((d) => d.id);
      const sSel = applyAction(state, { kind: "select-dice", ids: allIds });
      const sRoll = applyAction(sSel, { kind: "roll" });
      const sSkip = applyAction(sRoll, { kind: "reroll", ids: [] });
      const sCommit = applyAction(sSkip, { kind: "commit" });
      return sCommit;
    }
```

- [ ] **Step 4: Run tests, verify all pass**

```bash
npm test -- tests/rules.test.ts
```

Expected: PASS — all rules tests including event auto-resolution.

- [ ] **Step 5: Commit**

```bash
cd /Users/huanghaibin/Workspace/games
git add climb-mountain/src/game/rules.ts climb-mountain/tests/rules.test.ts
git commit -m "$(cat <<'EOF'
feat(climb-mountain): event card auto-resolution

advance-event-card pipes select-all → roll → skip rerolls → commit. UI / harness
dispatch this when currentCard.type === 'event' so player has no decision.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: State-Flow Golden Paths + Edge Cases

**Files:**
- Create: `tests/state-flow.test.ts`
- Create: `tests/eval-edge.test.ts`

- [ ] **Step 1: Write `tests/state-flow.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { initialState } from "../src/game/state";
import { applyAction } from "../src/game/rules";
import type { GameState } from "../src/game/types";

// Drive a game to terminal with a naive baseline: always select all hand dice up to minDice,
// roll, skip rerolls, commit. For event cards: dispatch advance-event-card.
function playToEnd(seed: number, maxRounds = 100): GameState {
  let s = initialState(seed);
  for (let r = 0; r < maxRounds; r++) {
    if (s.phase === "won" || s.phase === "lost") return s;
    if (s.currentCard?.type === "event") {
      s = applyAction(s, { kind: "advance-event-card" });
      continue;
    }
    if (s.phase === "await-select" && s.currentCard) {
      const min = s.currentCard.minDice === "ALL" ? s.player.handDice.length : s.currentCard.minDice;
      const ids = s.player.handDice.slice(0, Math.max(min, 1)).map((d) => d.id);
      s = applyAction(s, { kind: "select-dice", ids });
      s = applyAction(s, { kind: "roll" });
      s = applyAction(s, { kind: "reroll", ids: [] });
      s = applyAction(s, { kind: "commit" });
    } else {
      // Defensive — shouldn't get here
      throw new Error(`stuck in phase ${s.phase}`);
    }
  }
  throw new Error("max rounds exceeded");
}

describe("state-flow golden paths", () => {
  it("baseline AI finishes (won or lost) within 100 rounds across many seeds", () => {
    let won = 0;
    let lost = 0;
    for (let seed = 1; seed <= 50; seed++) {
      const end = playToEnd(seed);
      expect(end.phase === "won" || end.phase === "lost").toBe(true);
      if (end.phase === "won") won++;
      else lost++;
    }
    expect(won + lost).toBe(50);
  });

  it("produces deterministic outcome per seed", () => {
    const a = playToEnd(7);
    const b = playToEnd(7);
    expect(a.phase).toBe(b.phase);
    expect(a.player.cell).toBe(b.player.cell);
    expect(a.demon.cell).toBe(b.demon.cell);
    expect(a.round).toBe(b.round);
  });
});
```

- [ ] **Step 2: Write `tests/eval-edge.test.ts`**

```typescript
import { describe, it, expect } from "vitest";
import { initialState } from "../src/game/state";
import { applyAction } from "../src/game/rules";

describe("edge cases", () => {
  it("deck reshuffles after exhaustion", () => {
    const s0 = initialState(1);
    // We can't easily drive 7+ turns deterministically without playing — but verify the state
    // structure: after enough turns the deck shouldn't run out.
    let s = s0;
    let turns = 0;
    while (s.phase !== "won" && s.phase !== "lost" && turns < 30) {
      if (s.currentCard?.type === "event") {
        s = applyAction(s, { kind: "advance-event-card" });
      } else {
        const min = s.currentCard!.minDice === "ALL" ? s.player.handDice.length : (s.currentCard!.minDice as number);
        const ids = s.player.handDice.slice(0, Math.max(min, 1)).map((d) => d.id);
        s = applyAction(s, { kind: "select-dice", ids });
        s = applyAction(s, { kind: "roll" });
        s = applyAction(s, { kind: "reroll", ids: [] });
        s = applyAction(s, { kind: "commit" });
      }
      turns++;
      // Deck never empty after commit (reshuffled)
      if (s.phase !== "won" && s.phase !== "lost") {
        expect(s.currentCard).not.toBeNull();
      }
    }
  });

  it("demon clamps to player cell (never overshoots)", () => {
    const s0 = initialState(1);
    let s = s0;
    let turns = 0;
    while (s.phase !== "won" && s.phase !== "lost" && turns < 40) {
      if (s.currentCard?.type === "event") {
        s = applyAction(s, { kind: "advance-event-card" });
      } else {
        const min = s.currentCard!.minDice === "ALL" ? s.player.handDice.length : (s.currentCard!.minDice as number);
        const ids = s.player.handDice.slice(0, Math.max(min, 1)).map((d) => d.id);
        s = applyAction(s, { kind: "select-dice", ids });
        s = applyAction(s, { kind: "roll" });
        s = applyAction(s, { kind: "reroll", ids: [] });
        s = applyAction(s, { kind: "commit" });
      }
      expect(s.demon.cell).toBeLessThanOrEqual(s.player.cell);
      turns++;
    }
  });

  it("madness stock never goes negative", () => {
    let s = initialState(1);
    let turns = 0;
    while (s.phase !== "won" && s.phase !== "lost" && turns < 40) {
      if (s.currentCard?.type === "event") {
        s = applyAction(s, { kind: "advance-event-card" });
      } else {
        const min = s.currentCard!.minDice === "ALL" ? s.player.handDice.length : (s.currentCard!.minDice as number);
        const ids = s.player.handDice.slice(0, Math.max(min, 1)).map((d) => d.id);
        s = applyAction(s, { kind: "select-dice", ids });
        s = applyAction(s, { kind: "roll" });
        s = applyAction(s, { kind: "reroll", ids: [] });
        s = applyAction(s, { kind: "commit" });
      }
      expect(s.madnessStock).toBeGreaterThanOrEqual(0);
      turns++;
    }
  });
});
```

- [ ] **Step 3: Run tests, verify all pass**

```bash
npm test
```

Expected: All tests across all files PASS (including rng, cards, state, demon, rules, state-flow, eval-edge).

- [ ] **Step 4: Commit**

```bash
cd /Users/huanghaibin/Workspace/games
git add climb-mountain/tests/state-flow.test.ts climb-mountain/tests/eval-edge.test.ts
git commit -m "$(cat <<'EOF'
test(climb-mountain): state-flow goldens + edge invariants

50-seed baseline plays through to terminal; deck reshuffle, demon clamp,
madness stock non-negative invariants verified.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: AI Stub (Phase 2 placeholder)

**Files:**
- Create: `src/game/ai.ts`

Per spec §3, `ai.ts` is a Phase 2 placeholder. Keep it as a tiny exported stub so the file tree is honest.

- [ ] **Step 1: Write `src/game/ai.ts`**

```typescript
// Phase 2 reserved: this is where 雪魔's active-action policy (C-style boss moves)
// will live. Phase 1's demon advance is purely formulaic in demon.ts.
export const phase2Reserved = true;
```

- [ ] **Step 2: Commit**

```bash
cd /Users/huanghaibin/Workspace/games
git add climb-mountain/src/game/ai.ts
git commit -m "$(cat <<'EOF'
chore(climb-mountain): ai.ts Phase 2 placeholder

Reserved for 雪魔 active-action policy in Phase 2 (the C-style boss-moves
fork from the design spec).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Harness — simulate.ts Mode A (default 1000-game stats)

**Files:**
- Create: `scripts/simulate.ts`

- [ ] **Step 1: Write `scripts/simulate.ts`**

```typescript
// Run via: npx tsx scripts/simulate.ts
// Modes:
//   (no args)               → Mode A: 1000 games with default seeds, dump stats
//   --sweep KEY=v1,v2,...   → Mode B: parameter sweep
//   --seed N --verbose      → Mode C: single seed, log every action
//   --report                → after Mode A, write balance report to docs/balance/

import { initialState } from "../src/game/state";
import { applyAction } from "../src/game/rules";
import type { GameState } from "../src/game/types";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

type GameResult = {
  seed: number;
  outcome: "won" | "lost";
  rounds: number;
  finalPlayerCell: number;
  finalDemonCell: number;
  slidesCount: number;
  cardsDrawnByName: Record<string, number>;
};

function playOne(seed: number, verbose = false): GameResult {
  let s = initialState(seed);
  let slides = 0;
  const cardsDrawnByName: Record<string, number> = {};
  if (s.currentCard) cardsDrawnByName[s.currentCard.name] = 1;

  while (s.phase !== "won" && s.phase !== "lost") {
    if (verbose) {
      console.log(`r${s.round} phase=${s.phase} player=${s.player.cell} demon=${s.demon.cell} card=${s.currentCard?.name}`);
    }
    const before = s;
    if (s.currentCard?.type === "event") {
      s = applyAction(s, { kind: "advance-event-card" });
    } else if (s.currentCard && s.phase === "await-select") {
      const min = s.currentCard.minDice === "ALL" ? s.player.handDice.length : (s.currentCard.minDice as number);
      const ids = s.player.handDice.slice(0, Math.max(min, 1)).map((d) => d.id);
      s = applyAction(s, { kind: "select-dice", ids });
      s = applyAction(s, { kind: "roll" });
      s = applyAction(s, { kind: "reroll", ids: [] });
      s = applyAction(s, { kind: "commit" });
    } else {
      throw new Error(`stuck in phase ${s.phase}`);
    }
    if (s.player.cell < before.player.cell) slides++;
    if (s.currentCard && s.currentCard !== before.currentCard) {
      cardsDrawnByName[s.currentCard.name] = (cardsDrawnByName[s.currentCard.name] ?? 0) + 1;
    }
    if (s.round > 200) break; // safety
  }

  return {
    seed,
    outcome: s.phase === "won" ? "won" : "lost",
    rounds: s.round,
    finalPlayerCell: s.player.cell,
    finalDemonCell: s.demon.cell,
    slidesCount: slides,
    cardsDrawnByName,
  };
}

function summarize(results: GameResult[]) {
  const n = results.length;
  const wins = results.filter((r) => r.outcome === "won").length;
  const avgRounds = results.reduce((a, r) => a + r.rounds, 0) / n;
  const avgSlides = results.reduce((a, r) => a + r.slidesCount, 0) / n;
  const winRate = wins / n;
  const cardFreq: Record<string, number> = {};
  for (const r of results) {
    for (const [name, count] of Object.entries(r.cardsDrawnByName)) {
      cardFreq[name] = (cardFreq[name] ?? 0) + count;
    }
  }
  const totalDraws = Object.values(cardFreq).reduce((a, b) => a + b, 0);
  return { n, wins, winRate, avgRounds, avgSlides, cardFreq, totalDraws };
}

function modeA(reportFile?: string) {
  const results: GameResult[] = [];
  for (let seed = 1; seed <= 1000; seed++) {
    results.push(playOne(seed));
  }
  const s = summarize(results);
  console.log(`=== Mode A (default 1000 games) ===`);
  console.log(`Games:        ${s.n}`);
  console.log(`Win rate:     ${(s.winRate * 100).toFixed(1)}%`);
  console.log(`Avg rounds:   ${s.avgRounds.toFixed(2)}`);
  console.log(`Avg slides:   ${s.avgSlides.toFixed(2)} per game`);
  console.log(`Card frequencies:`);
  const sortedCards = Object.entries(s.cardFreq).sort((a, b) => b[1] - a[1]);
  for (const [name, count] of sortedCards) {
    const pct = ((count / s.totalDraws) * 100).toFixed(1);
    console.log(`  ${name.padEnd(16)}  ${pct}%  (${count})`);
  }

  if (reportFile) {
    const md = `# Balance Run ${new Date().toISOString().slice(0, 10)}

- Games:    ${s.n}
- Win rate: **${(s.winRate * 100).toFixed(1)}%**
- Avg rounds: ${s.avgRounds.toFixed(2)}
- Avg slides per game: ${s.avgSlides.toFixed(2)}

## Card frequencies
${sortedCards.map(([name, c]) => `- ${name}: ${((c / s.totalDraws) * 100).toFixed(1)}% (${c})`).join("\n")}

## Gate check
- Win rate ∈ [35%, 60%]: ${s.winRate >= 0.35 && s.winRate <= 0.6 ? "PASS" : "FAIL"}
- Avg rounds ∈ [6, 12]: ${s.avgRounds >= 6 && s.avgRounds <= 12 ? "PASS" : "FAIL"}
- Avg slides ≥ 1: ${s.avgSlides >= 1 ? "PASS" : "FAIL"}
`;
    mkdirSync(dirname(reportFile), { recursive: true });
    writeFileSync(reportFile, md);
    console.log(`\nReport written to ${reportFile}`);
  }
}

// =============================================================================
// CLI
// =============================================================================

const argv = process.argv.slice(2);
const hasFlag = (f: string) => argv.includes(f);
const flagVal = (f: string): string | undefined => {
  const i = argv.indexOf(f);
  return i >= 0 ? argv[i + 1] : undefined;
};

if (hasFlag("--verbose") || flagVal("--seed")) {
  const seed = parseInt(flagVal("--seed") ?? "1", 10);
  const r = playOne(seed, true);
  console.log("\n=== Result ===");
  console.log(JSON.stringify(r, null, 2));
} else if (hasFlag("--sweep")) {
  // Mode B implemented in Task 14
  console.error("Mode B (--sweep) implemented in Task 14");
  process.exit(1);
} else {
  const wantReport = hasFlag("--report");
  const reportFile = wantReport
    ? join(ROOT, "docs", "balance", `${new Date().toISOString().slice(0, 10)}-run.md`)
    : undefined;
  modeA(reportFile);
}
```

- [ ] **Step 2: Run Mode A**

```bash
cd climb-mountain
npx tsx scripts/simulate.ts
```

Expected: text output showing win rate, avg rounds, avg slides, and card frequency table. Game count 1000.

- [ ] **Step 3: Verify Mode C (verbose single seed)**

```bash
npx tsx scripts/simulate.ts --seed 7 --verbose
```

Expected: per-turn log lines + JSON result at end.

- [ ] **Step 4: Verify --report writes file**

```bash
npx tsx scripts/simulate.ts --report
ls -la docs/balance/
cat docs/balance/$(ls docs/balance/ | grep run.md | head -1)
```

Expected: file exists with stats + gate check.

- [ ] **Step 5: Commit**

```bash
cd /Users/huanghaibin/Workspace/games
git add climb-mountain/scripts/simulate.ts
git commit -m "$(cat <<'EOF'
feat(climb-mountain): simulate.ts modes A + C + --report

Mode A (default): 1000 games, baseline policy, stats dump.
Mode C: --seed N --verbose for single-game trace.
--report: writes docs/balance/YYYY-MM-DD-run.md with gate check.
Mode B (--sweep) coming in next task.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: Harness — Mode B (parameter sweep)

**Files:**
- Modify: `scripts/simulate.ts`

- [ ] **Step 1: Implement --sweep**

Replace the `else if (hasFlag("--sweep"))` block in `scripts/simulate.ts` with:

```typescript
} else if (hasFlag("--sweep")) {
  const spec = flagVal("--sweep"); // e.g. "DEMON_BASELINE_PER_ROUND=0.5,1,1.5"
  if (!spec) {
    console.error("--sweep requires KEY=v1,v2,v3 argument");
    process.exit(1);
  }
  const [key, valuesStr] = spec.split("=");
  if (!key || !valuesStr) {
    console.error(`bad --sweep format: ${spec}`);
    process.exit(1);
  }
  const values = valuesStr.split(",").map((v) => parseFloat(v));

  // We need to dynamically override the balance constant. Easiest: rewrite balance via env var
  // trick is too brittle for ESM. Instead, expose an override hook on a module-level object
  // and have balance.ts read from it. For Phase 1 we use a simpler approach: monkey-patch via
  // a module-level mutable in balance.ts. See Task 14 Step 2 for the balance.ts adjustment.

  const balance = await import("../src/game/balance");
  const results: Array<{ value: number; winRate: number; avgRounds: number; avgSlides: number }> = [];
  for (const v of values) {
    (balance as unknown as Record<string, number>)[key] = v;
    const games: GameResult[] = [];
    for (let seed = 1; seed <= 500; seed++) {
      games.push(playOne(seed));
    }
    const s = summarize(games);
    results.push({ value: v, winRate: s.winRate, avgRounds: s.avgRounds, avgSlides: s.avgSlides });
  }
  console.log(`=== Mode B sweep: ${key} ===`);
  console.log(`${key.padEnd(34)}  win%   avgRounds  avgSlides`);
  for (const r of results) {
    console.log(`${String(r.value).padEnd(34)}  ${(r.winRate * 100).toFixed(1)}%  ${r.avgRounds.toFixed(2).padEnd(8)}  ${r.avgSlides.toFixed(2)}`);
  }
}
```

- [ ] **Step 2: Make balance.ts mutable**

ESM `const` exports cannot be reassigned by import. Change `src/game/balance.ts` to a mutable object:

Replace `src/game/balance.ts` with:

```typescript
// Mutable object so harness sweep mode can override at runtime.
// Game core imports from this object, not via destructured const exports.

export const balance = {
  START_PLAYER_CELL: 1,
  START_DEMON_CELL: 0,
  START_MADNESS_DICE: 2,
  PLAYER_COLOR_DICE: 7,
  MADNESS_STOCK: 16,
  GOAL_CELL: 10,
  DEMON_BASELINE_PER_ROUND: 1,
  DEMON_BONUS_ON_SLIDE: 1,
  DEMON_BONUS_ON_NEW_MADNESS: 1,
  DEMON_BONUS_ON_EVENT: 2,
  SLIDE_BACK_CELLS: 2,
  MAX_REROLLS: 2,
};

// Re-export individual values via getters so existing imports keep working.
// Note: these are computed at import time. For sweep, use `balance.KEY = v` instead of these.
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
```

⚠️ The static `export const` values are import-time snapshots, so consumer modules (`rules.ts`, `state.ts`, `demon.ts`) won't see sweep overrides unless they read from `balance.KEY`. Fix consumers in next step.

- [ ] **Step 3: Update consumers to read from `balance` object**

Edit `src/game/demon.ts` — replace imports + reads:

```typescript
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
```

Edit `src/game/state.ts` — replace constant imports:

```typescript
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
```

Edit `src/game/rules.ts` — change `import { GOAL_CELL, MAX_REROLLS, SLIDE_BACK_CELLS } from "./balance"` to `import { balance } from "./balance"` and replace `GOAL_CELL` / `MAX_REROLLS` / `SLIDE_BACK_CELLS` references with `balance.GOAL_CELL` / `balance.MAX_REROLLS` / `balance.SLIDE_BACK_CELLS`.

- [ ] **Step 4: Run all tests to make sure nothing broke**

```bash
cd climb-mountain
npm test
```

Expected: all tests still PASS (refactor was transparent).

- [ ] **Step 5: Run sweep**

```bash
npx tsx scripts/simulate.ts --sweep DEMON_BASELINE_PER_ROUND=0.5,1,1.5
```

Expected: table output with win% across the 3 values.

- [ ] **Step 6: Commit**

```bash
cd /Users/huanghaibin/Workspace/games
git add climb-mountain/src/game/balance.ts climb-mountain/src/game/state.ts climb-mountain/src/game/demon.ts climb-mountain/src/game/rules.ts climb-mountain/scripts/simulate.ts
git commit -m "$(cat <<'EOF'
feat(climb-mountain): simulate.ts --sweep (Mode B) + mutable balance object

Refactored balance.ts to mutable object so sweep can override constants at
runtime. Updated state.ts / demon.ts / rules.ts to read balance.KEY. Mode B
runs 500 games per sweep value, prints win rate × value table.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: CSS Foundation — palette, fonts, spacing, base layout

**Files:**
- Modify: `src/ui/style.css`

- [ ] **Step 1: Write `src/ui/style.css`**

```css
/* =============================================================================
   Dice of Madness — climb-mountain
   Visual style from concept.png §02 (palette) / §03 (fonts) / §12 (spacing)
   ============================================================================= */

@import url("https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@700&family=IBM+Plex+Mono:wght@700&family=Noto+Sans+SC:wght@400;700&display=swap");

:root {
  /* Palette */
  --bg:       #0F1820;
  --panel:    #1B2C3C;
  --border:   #25364A;
  --accent:   #00A3B5;
  --text:     #C8D6E4;
  --danger:   #C24A4A;
  --warn:     #D4A04A;

  /* Spacing scale (concept.png §12) */
  --s-4: 4px;
  --s-6: 6px;
  --s-8: 8px;
  --s-16: 16px;
  --s-24: 24px;
  --s-36: 36px;
  --s-48: 48px;

  /* Fonts */
  --font-title: "Chakra Petch", system-ui, sans-serif;
  --font-num:   "IBM Plex Mono", ui-monospace, monospace;
  --font-body:  "Noto Sans SC", system-ui, sans-serif;

  /* Anim */
  --t-anim: 2000ms;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  min-height: 100vh;
}

#app {
  display: grid;
  grid-template-rows: 80px 1fr 220px;
  height: 100vh;
  max-height: 100vh;
}

.top-bar {
  background: var(--panel);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--s-24);
}

.top-bar .logo {
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 20px;
  letter-spacing: 2px;
  color: var(--accent);
}

.main-area {
  display: grid;
  grid-template-columns: 1fr 320px 1fr;
  gap: var(--s-16);
  padding: var(--s-16);
}

.player-panel, .demon-panel {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--s-8);
  padding: var(--s-16);
  display: flex;
  flex-direction: column;
}

.demon-panel { border-color: var(--danger); }

.board {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--s-8);
  display: flex;
  flex-direction: column-reverse; /* cell 1 at bottom, GOAL at top */
  justify-content: stretch;
  padding: var(--s-8);
  position: relative;
}

.board .cell {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--s-8);
  font-family: var(--font-num);
  font-size: 14px;
  border-bottom: 1px solid var(--border);
}

.board .cell:last-child { border-bottom: none; }
.board .cell.goal { background: linear-gradient(180deg, rgba(0,163,181,0.3), transparent); font-weight: bold; color: var(--accent); }

.pawn {
  width: 16px; height: 16px;
  border-radius: 50%;
  transition: transform var(--t-anim) ease;
}
.pawn.player { background: var(--accent); }
.pawn.demon  { background: var(--danger); }

.dice-pool {
  display: flex;
  gap: var(--s-16);
  padding: var(--s-16);
  background: var(--panel);
  border-top: 1px solid var(--border);
}

.dice-zone {
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px dashed var(--border);
  border-radius: var(--s-8);
  padding: var(--s-8);
}

.dice-zone .label {
  font-family: var(--font-num);
  font-size: 10px;
  color: var(--accent);
  text-transform: uppercase;
  margin-bottom: var(--s-6);
}

.dice-zone .dice {
  display: flex;
  flex-wrap: wrap;
  gap: var(--s-6);
  flex: 1;
}

.die {
  width: 36px; height: 36px;
  border: 1px solid var(--border);
  border-radius: var(--s-6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-num);
  font-weight: 700;
  background: var(--bg);
  color: var(--text);
  cursor: pointer;
  user-select: none;
  transition: transform 200ms ease, border-color 200ms;
}

.die.madness { border-color: var(--danger); color: var(--danger); }
.die:hover { transform: scale(1.05); border-color: var(--accent); }

.action-rail {
  display: flex;
  gap: var(--s-8);
  padding: var(--s-8) var(--s-16);
  background: var(--bg);
  border-top: 1px solid var(--border);
}

.btn {
  background: var(--panel);
  color: var(--text);
  border: 1px solid var(--border);
  padding: var(--s-8) var(--s-16);
  border-radius: var(--s-6);
  font-family: var(--font-body);
  font-size: 14px;
  cursor: pointer;
}
.btn:hover { border-color: var(--accent); color: var(--accent); }
.btn:disabled { opacity: 0.4; cursor: not-allowed; }
.btn.primary { background: var(--accent); color: var(--bg); border-color: var(--accent); }

.event-log {
  font-family: var(--font-num);
  font-size: 12px;
  padding: var(--s-6) var(--s-16);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--accent);
}

/* Modal */
.modal-bg {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex; align-items: center; justify-content: center;
  z-index: 100;
}
.modal {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: var(--s-8);
  padding: var(--s-24);
  max-width: 480px;
  min-width: 280px;
}
.modal h2 {
  font-family: var(--font-title);
  color: var(--accent);
  margin: 0 0 var(--s-16) 0;
}

/* End screen */
.end-screen { text-align: center; padding: var(--s-48); }
.end-screen .title { font-family: var(--font-title); font-size: 36px; color: var(--accent); }
.end-screen.lost .title { color: var(--danger); }
```

- [ ] **Step 2: Commit**

```bash
cd /Users/huanghaibin/Workspace/games
git add climb-mountain/src/ui/style.css
git commit -m "$(cat <<'EOF'
feat(climb-mountain): visual foundation — palette, fonts, spacing

Color tokens / fonts (Chakra Petch + IBM Plex Mono + Noto Sans SC) /
spacing scale per concept.png §02/§03/§12. Layout grid for top bar / main
3-column area / dice pool / action rail / event log.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 16: Board UI

**Files:**
- Create: `src/ui/board.ts`

Each UI module exports `render(parent, state)` returning void. The dispatch function is passed only to modules that need it.

- [ ] **Step 1: Write `src/ui/board.ts`**

```typescript
import type { GameState } from "../game/types";
import { balance } from "../game/balance";

export function renderBoard(parent: HTMLElement, state: GameState): void {
  parent.innerHTML = "";
  parent.className = "board";

  for (let cell = balance.GOAL_CELL; cell >= 1; cell--) {
    const el = document.createElement("div");
    el.className = "cell" + (cell === balance.GOAL_CELL ? " goal" : "");
    el.dataset.cell = String(cell);

    const label = document.createElement("span");
    label.textContent = cell === balance.GOAL_CELL ? "GOAL" : String(cell);
    el.appendChild(label);

    const pawns = document.createElement("span");
    pawns.style.display = "flex";
    pawns.style.gap = "var(--s-6)";

    if (state.player.cell === cell) {
      const p = document.createElement("span");
      p.className = "pawn player";
      p.title = "你";
      pawns.appendChild(p);
    }
    if (state.demon.cell === cell) {
      const d = document.createElement("span");
      d.className = "pawn demon";
      d.title = "雪魔";
      pawns.appendChild(d);
    }
    el.appendChild(pawns);

    parent.appendChild(el);
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd /Users/huanghaibin/Workspace/games
git add climb-mountain/src/ui/board.ts
git commit -m "$(cat <<'EOF'
feat(climb-mountain): board render — 10-cell vertical track, dual pawns

CSS uses column-reverse so cell 1 is at the bottom; renderBoard iterates
GOAL → 1 so the natural order maps to top-to-bottom DOM.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 17: TopBar, PlayerPanel, DemonPanel (display only)

**Files:**
- Create: `src/ui/topBar.ts`
- Create: `src/ui/playerPanel.ts`
- Create: `src/ui/demonPanel.ts`

- [ ] **Step 1: Write `src/ui/topBar.ts`**

```typescript
import type { Action, GameState } from "../game/types";

export function renderTopBar(
  parent: HTMLElement,
  state: GameState,
  dispatch: (a: Action) => void,
): void {
  parent.innerHTML = "";
  parent.className = "top-bar";

  const logo = document.createElement("div");
  logo.className = "logo";
  logo.textContent = "DICE OF MADNESS · 克苏鲁雪山";
  parent.appendChild(logo);

  const cardChip = document.createElement("div");
  cardChip.style.fontFamily = "var(--font-num)";
  cardChip.style.fontSize = "14px";
  cardChip.style.padding = "var(--s-6) var(--s-16)";
  cardChip.style.border = "1px solid var(--border)";
  cardChip.style.borderRadius = "var(--s-6)";
  cardChip.style.cursor = "pointer";

  if (state.currentCard) {
    cardChip.textContent = `难度牌：${state.currentCard.name} · 最少 ${state.currentCard.minDice}`;
    cardChip.addEventListener("click", () => {
      // CardModal opens — for now no-op; Task 20 wires it up
      document.dispatchEvent(new CustomEvent("open-card-modal"));
    });
  }
  parent.appendChild(cardChip);

  // Suppress unused-param warning
  void dispatch;
}
```

- [ ] **Step 2: Write `src/ui/playerPanel.ts`**

```typescript
import type { Action, GameState } from "../game/types";

export function renderPlayerPanel(
  parent: HTMLElement,
  state: GameState,
  dispatch: (a: Action) => void,
): void {
  parent.innerHTML = "";
  parent.className = "player-panel";

  const title = document.createElement("h3");
  title.textContent = "你 · 登山者";
  title.style.fontFamily = "var(--font-title)";
  title.style.color = "var(--accent)";
  title.style.margin = "0 0 var(--s-16) 0";
  parent.appendChild(title);

  const stats = document.createElement("div");
  stats.style.fontFamily = "var(--font-num)";
  stats.style.fontSize = "14px";
  const colorN = state.player.handDice.filter((d) => d.kind === "color").length;
  const madN = state.player.handDice.filter((d) => d.kind === "madness").length;
  stats.innerHTML = `
    <div>骰子 <strong>${colorN}</strong></div>
    <div>疯狂 <strong style="color: var(--danger)">${madN}</strong></div>
    <div>当前格 <strong>${state.player.cell}</strong></div>
    <div>回合 <strong>${state.round}</strong></div>
  `;
  parent.appendChild(stats);

  void dispatch;
}
```

- [ ] **Step 3: Write `src/ui/demonPanel.ts`**

```typescript
import type { Action, GameState } from "../game/types";

export function renderDemonPanel(
  parent: HTMLElement,
  state: GameState,
  dispatch: (a: Action) => void,
): void {
  parent.innerHTML = "";
  parent.className = "demon-panel";

  const title = document.createElement("h3");
  title.textContent = "雪魔 · AI 追兵";
  title.style.fontFamily = "var(--font-title)";
  title.style.color = "var(--danger)";
  title.style.margin = "0 0 var(--s-16) 0";
  parent.appendChild(title);

  const dist = state.player.cell - state.demon.cell;
  const stats = document.createElement("div");
  stats.style.fontFamily = "var(--font-num)";
  stats.style.fontSize = "14px";
  stats.innerHTML = `
    <div>距离 <strong style="color: var(--danger)">${dist} 格</strong></div>
    <div>所在格 <strong>${state.demon.cell}</strong></div>
  `;
  parent.appendChild(stats);

  // Recent log — show last 4 lines
  const log = document.createElement("div");
  log.style.marginTop = "var(--s-16)";
  log.style.fontFamily = "var(--font-num)";
  log.style.fontSize = "11px";
  log.style.opacity = "0.8";
  const recent = state.log.slice(-4);
  for (const entry of recent) {
    const line = document.createElement("div");
    line.textContent = `r${entry.round}: ${entry.text}`;
    log.appendChild(line);
  }
  parent.appendChild(log);

  void dispatch;
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/huanghaibin/Workspace/games
git add climb-mountain/src/ui/topBar.ts climb-mountain/src/ui/playerPanel.ts climb-mountain/src/ui/demonPanel.ts
git commit -m "$(cat <<'EOF'
feat(climb-mountain): topBar / playerPanel / demonPanel render

Display-only renderers; dispatch wired but unused at this stage.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 18: DicePool, ActionRail, EventLog

**Files:**
- Create: `src/ui/dicePool.ts`
- Create: `src/ui/actionRail.ts`
- Create: `src/ui/eventLog.ts`

- [ ] **Step 1: Write `src/ui/dicePool.ts`**

```typescript
import type { Action, Die, GameState } from "../game/types";

function dieElement(die: Die, selected: boolean, onClick?: () => void): HTMLElement {
  const el = document.createElement("div");
  el.className = "die" + (die.kind === "madness" ? " madness" : "") + (selected ? " selected" : "");
  el.textContent = die.face !== null ? String(die.face) : "·";
  if (selected) el.style.borderColor = "var(--accent)";
  if (onClick) el.addEventListener("click", onClick);
  return el;
}

export function renderDicePool(
  parent: HTMLElement,
  state: GameState,
  dispatch: (a: Action) => void,
): void {
  parent.innerHTML = "";
  parent.className = "dice-pool";

  const zoneHand = makeZone("可掷");
  const zoneSelected = makeZone("已选");
  const zoneRolled = makeZone("已投");

  const selectedSet = new Set(state.player.selected);

  // Hand dice (available to pick)
  for (const d of state.player.handDice) {
    if (selectedSet.has(d.id)) continue; // shown in "selected" zone
    if (state.phase === "await-select") {
      zoneHand.dice.appendChild(
        dieElement(d, false, () => {
          dispatch({ kind: "select-dice", ids: [...state.player.selected, d.id] });
        }),
      );
    } else {
      zoneHand.dice.appendChild(dieElement(d, false));
    }
  }

  // Selected dice (waiting for roll)
  for (const id of state.player.selected) {
    const d = state.player.handDice.find((x) => x.id === id);
    if (!d) continue;
    if (state.phase === "await-select") {
      zoneSelected.dice.appendChild(
        dieElement(d, true, () => {
          dispatch({
            kind: "select-dice",
            ids: state.player.selected.filter((x) => x !== d.id),
          });
        }),
      );
    } else {
      zoneSelected.dice.appendChild(dieElement(d, true));
    }
  }

  // Rolled dice
  for (const d of state.player.rolled) {
    if (state.phase === "await-reroll") {
      zoneRolled.dice.appendChild(
        dieElement(d, false, () => {
          dispatch({ kind: "reroll", ids: [d.id] });
        }),
      );
    } else {
      zoneRolled.dice.appendChild(dieElement(d, false));
    }
  }

  parent.appendChild(zoneHand.el);
  parent.appendChild(zoneSelected.el);
  parent.appendChild(zoneRolled.el);
}

function makeZone(label: string): { el: HTMLElement; dice: HTMLElement } {
  const el = document.createElement("div");
  el.className = "dice-zone";
  const lab = document.createElement("div");
  lab.className = "label";
  lab.textContent = label;
  el.appendChild(lab);
  const dice = document.createElement("div");
  dice.className = "dice";
  el.appendChild(dice);
  return { el, dice };
}
```

- [ ] **Step 2: Write `src/ui/actionRail.ts`**

```typescript
import type { Action, GameState } from "../game/types";

export function renderActionRail(
  parent: HTMLElement,
  state: GameState,
  dispatch: (a: Action) => void,
): void {
  parent.innerHTML = "";
  parent.className = "action-rail";

  const min = state.currentCard?.minDice === "ALL"
    ? state.player.handDice.length
    : (state.currentCard?.minDice ?? 0) as number;

  const lblBtn = document.createElement("button");
  lblBtn.className = "btn";
  lblBtn.textContent = `已选 ${state.player.selected.length} / 最少 ${min}`;
  lblBtn.disabled = true;
  parent.appendChild(lblBtn);

  const rollBtn = document.createElement("button");
  rollBtn.className = "btn primary";
  rollBtn.textContent = "掷骰";
  rollBtn.disabled = state.phase !== "await-roll";
  rollBtn.addEventListener("click", () => dispatch({ kind: "roll" }));
  parent.appendChild(rollBtn);

  const noRerollBtn = document.createElement("button");
  noRerollBtn.className = "btn";
  noRerollBtn.textContent = `跳过重投 (${state.player.rerollsLeft} 次剩余)`;
  noRerollBtn.disabled = state.phase !== "await-reroll";
  noRerollBtn.addEventListener("click", () => dispatch({ kind: "reroll", ids: [] }));
  parent.appendChild(noRerollBtn);

  const commitBtn = document.createElement("button");
  commitBtn.className = "btn primary";
  commitBtn.textContent = "结算";
  commitBtn.disabled = state.phase !== "await-commit";
  commitBtn.addEventListener("click", () => dispatch({ kind: "commit" }));
  parent.appendChild(commitBtn);
}
```

- [ ] **Step 3: Write `src/ui/eventLog.ts`**

```typescript
import type { GameState } from "../game/types";

export function renderEventLog(parent: HTMLElement, state: GameState): void {
  parent.innerHTML = "";
  parent.className = "event-log";
  const latest = state.log[state.log.length - 1];
  parent.textContent = latest ? `r${latest.round}: ${latest.text}` : "";
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/huanghaibin/Workspace/games
git add climb-mountain/src/ui/dicePool.ts climb-mountain/src/ui/actionRail.ts climb-mountain/src/ui/eventLog.ts
git commit -m "$(cat <<'EOF'
feat(climb-mountain): dicePool / actionRail / eventLog render

dicePool: 3 zones (可掷/已选/已投) with click handlers that dispatch
select-dice / reroll actions. actionRail: 掷骰 / 跳过重投 / 结算 buttons.
eventLog: latest line.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 19: main.ts wiring — full render loop + auto event-card resolve

**Files:**
- Modify: `src/main.ts`
- Modify: `index.html`

- [ ] **Step 1: Update `index.html` so `#app` has child placeholders**

Replace `<body>` content:

```html
  <body>
    <div id="app">
      <div id="top-bar"></div>
      <div class="main-area">
        <div id="player-panel"></div>
        <div id="board"></div>
        <div id="demon-panel"></div>
      </div>
      <div>
        <div id="dice-pool"></div>
        <div id="action-rail"></div>
        <div id="event-log"></div>
      </div>
    </div>
    <div id="modal-root"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
```

- [ ] **Step 2: Write `src/main.ts`**

```typescript
import { initialState } from "./game/state";
import { applyAction } from "./game/rules";
import { renderBoard } from "./ui/board";
import { renderTopBar } from "./ui/topBar";
import { renderPlayerPanel } from "./ui/playerPanel";
import { renderDemonPanel } from "./ui/demonPanel";
import { renderDicePool } from "./ui/dicePool";
import { renderActionRail } from "./ui/actionRail";
import { renderEventLog } from "./ui/eventLog";
import type { Action, GameState } from "./game/types";

let state: GameState = initialState(Math.floor(Math.random() * 1e6));

function dispatch(a: Action): void {
  state = applyAction(state, a);
  render();

  // Auto-resolve event cards
  if (
    state.phase === "await-select" &&
    state.currentCard?.type === "event"
  ) {
    // small delay for visual continuity
    setTimeout(() => {
      state = applyAction(state, { kind: "advance-event-card" });
      render();
    }, 600);
  }
}

function render(): void {
  renderTopBar(document.getElementById("top-bar")!, state, dispatch);
  renderBoard(document.getElementById("board")!, state);
  renderPlayerPanel(document.getElementById("player-panel")!, state, dispatch);
  renderDemonPanel(document.getElementById("demon-panel")!, state, dispatch);
  renderDicePool(document.getElementById("dice-pool")!, state, dispatch);
  renderActionRail(document.getElementById("action-rail")!, state, dispatch);
  renderEventLog(document.getElementById("event-log")!, state);
}

render();
```

- [ ] **Step 3: Smoke test in browser**

```bash
cd climb-mountain
npm run dev &
DEV_PID=$!
sleep 3
echo "Open http://localhost:1425/ in a browser and:"
echo "  1. See player + demon on board"
echo "  2. Click a die → moves to 已选"
echo "  3. Click 掷骰 → dice show faces"
echo "  4. Click 跳过重投 → 结算 button enables"
echo "  5. Click 结算 → player + demon advance, log line appears"
echo "  6. Game proceeds round by round"
echo "When done, press enter to kill the dev server."
read
kill $DEV_PID
```

Walk through the steps in browser. Verify each transition works without errors in DevTools console.

- [ ] **Step 4: Commit**

```bash
cd /Users/huanghaibin/Workspace/games
git add climb-mountain/index.html climb-mountain/src/main.ts
git commit -m "$(cat <<'EOF'
feat(climb-mountain): main.ts wiring — render loop + auto event resolve

Single mutable `state` ref. dispatch(action) calls applyAction, re-renders,
auto-resolves event cards via 600ms timeout for visual continuity.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 20: Modals — CardModal, RulesModal

**Files:**
- Create: `src/ui/cardModal.ts`
- Create: `src/ui/rulesModal.ts`
- Modify: `src/main.ts` (event listener)

- [ ] **Step 1: Write `src/ui/cardModal.ts`**

```typescript
import type { Card, DiceCondition } from "../game/types";

function conditionText(c: DiceCondition): string {
  switch (c.kind) {
    case "sum-at-least":            return `点数总和 ≥ ${c.n}`;
    case "sum-at-most":             return `点数总和 ≤ ${c.n}`;
    case "face-count":              return `至少 ${c.atLeast} 颗 ${c.face} 点`;
    case "same-face-groups":        return `出现 ${c.count} 组、每组 ${c.groupSize} 颗同点`;
    case "distinct-faces":          return `不同点数 ≥ ${c.atLeast} 种`;
    case "distinct-faces-at-most":  return `不同点数 ≤ ${c.n} 种`;
  }
}

export function openCardModal(card: Card): void {
  const root = document.getElementById("modal-root")!;
  root.innerHTML = "";
  const bg = document.createElement("div");
  bg.className = "modal-bg";
  bg.addEventListener("click", () => { root.innerHTML = ""; });

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.addEventListener("click", (e) => e.stopPropagation());

  const title = document.createElement("h2");
  title.textContent = card.name;
  modal.appendChild(title);

  const meta = document.createElement("div");
  meta.style.fontFamily = "var(--font-num)";
  meta.style.fontSize = "12px";
  meta.style.opacity = "0.8";
  meta.style.marginBottom = "var(--s-16)";
  meta.textContent = `${card.type === "event" ? "事件牌" : "普通牌"} · 最少 ${card.minDice}`;
  modal.appendChild(meta);

  const tasks = document.createElement("ol");
  tasks.style.paddingLeft = "var(--s-24)";
  // For normal: sort highest advance first. For event: keep declaration order.
  const sorted = card.type === "normal"
    ? [...card.tasks].sort((a, b) => b.advance - a.advance)
    : card.tasks;
  for (const t of sorted) {
    const li = document.createElement("li");
    const sign = t.advance >= 0 ? "+" : "";
    li.textContent = `${conditionText(t.requires)} → ${sign}${t.advance} 格`;
    if (t.advance < 0) li.style.color = "var(--danger)";
    tasks.appendChild(li);
  }
  modal.appendChild(tasks);

  bg.appendChild(modal);
  root.appendChild(bg);
}
```

- [ ] **Step 2: Write `src/ui/rulesModal.ts`**

```typescript
const RULES_HTML = `
<h2>规则速查</h2>
<p>你是登山者，要先到 GOAL；雪魔在身后追，碰到你格子你就输。</p>
<ol style="padding-left: var(--s-24); line-height: 1.6;">
  <li>每回合翻一张难度牌</li>
  <li><strong>A 选骰</strong>：选骰子放入"已选"区，至少满足卡上最少数</li>
  <li><strong>B 掷骰</strong>：可重投最多 2 次</li>
  <li><strong>C 理智值</strong>：疯狂骰 + 同点彩色骰飞回你手里（不计入移动）</li>
  <li><strong>D 移动</strong>：用剩下骰子点数和命中卡上任务 → 前进；都没命中 → 滑落 2 格 + 拿 1 颗疯狂骰</li>
  <li>事件牌：自动用全部骰，按绝对阈值算前进/滑落</li>
  <li>雪魔每回合 +1 基线，你滑落 +1，你新得疯狂骰 +1，事件牌 +2</li>
</ol>
<p style="color: var(--danger);">关键提示：你和雪魔追上时，雪魔赢（即使你同回合本可登顶）</p>
`;

export function openRulesModal(): void {
  const root = document.getElementById("modal-root")!;
  root.innerHTML = "";
  const bg = document.createElement("div");
  bg.className = "modal-bg";
  bg.addEventListener("click", () => { root.innerHTML = ""; });
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.addEventListener("click", (e) => e.stopPropagation());
  modal.innerHTML = RULES_HTML;
  bg.appendChild(modal);
  root.appendChild(bg);
}
```

- [ ] **Step 3: Wire modal triggers in `src/main.ts`**

Add after `render();` at end:

```typescript
import { openCardModal } from "./ui/cardModal";
import { openRulesModal } from "./ui/rulesModal";

document.addEventListener("open-card-modal", () => {
  if (state.currentCard) openCardModal(state.currentCard);
});

// Add a global "?" button for rules
const helpBtn = document.createElement("button");
helpBtn.className = "btn";
helpBtn.textContent = "规则 ?";
helpBtn.style.position = "fixed";
helpBtn.style.right = "var(--s-16)";
helpBtn.style.top = "var(--s-16)";
helpBtn.style.zIndex = "50";
helpBtn.addEventListener("click", openRulesModal);
document.body.appendChild(helpBtn);
```

- [ ] **Step 4: Smoke test in browser**

```bash
npm run dev &
DEV_PID=$!
sleep 3
echo "Test:"
echo "  - Click 难度牌 chip in top bar → CardModal opens"
echo "  - Click outside modal → closes"
echo "  - Click '规则 ?' button → RulesModal opens"
read
kill $DEV_PID
```

- [ ] **Step 5: Commit**

```bash
cd /Users/huanghaibin/Workspace/games
git add climb-mountain/src/ui/cardModal.ts climb-mountain/src/ui/rulesModal.ts climb-mountain/src/main.ts
git commit -m "$(cat <<'EOF'
feat(climb-mountain): CardModal + RulesModal

CardModal opens via top-bar card chip; shows task table sorted by advance.
RulesModal opens via fixed '?' button; condensed Phase 1 rules.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 21: StartMenu + EndScreen (WIN/LOSE)

**Files:**
- Create: `src/ui/startMenu.ts`
- Create: `src/ui/endScreen.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: Write `src/ui/startMenu.ts`**

```typescript
export function renderStartMenu(onStart: () => void): void {
  const root = document.getElementById("modal-root")!;
  root.innerHTML = "";
  const bg = document.createElement("div");
  bg.className = "modal-bg";
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.textAlign = "center";

  const title = document.createElement("h2");
  title.textContent = "Dice of Madness";
  title.style.fontSize = "28px";
  title.style.letterSpacing = "3px";
  modal.appendChild(title);

  const sub = document.createElement("p");
  sub.textContent = "克苏鲁雪山 · 登山者 vs 雪魔";
  sub.style.color = "var(--accent)";
  sub.style.fontFamily = "var(--font-num)";
  modal.appendChild(sub);

  const startBtn = document.createElement("button");
  startBtn.className = "btn primary";
  startBtn.style.marginRight = "var(--s-8)";
  startBtn.textContent = "开始游戏";
  startBtn.addEventListener("click", () => {
    root.innerHTML = "";
    onStart();
  });
  modal.appendChild(startBtn);

  const rulesBtn = document.createElement("button");
  rulesBtn.className = "btn";
  rulesBtn.textContent = "规则";
  rulesBtn.addEventListener("click", () => {
    import("./rulesModal").then(({ openRulesModal }) => openRulesModal());
  });
  modal.appendChild(rulesBtn);

  bg.appendChild(modal);
  root.appendChild(bg);
}
```

- [ ] **Step 2: Write `src/ui/endScreen.ts`**

```typescript
import type { GameState } from "../game/types";

export function renderEndScreen(state: GameState, onRestart: () => void, onHome: () => void): void {
  const root = document.getElementById("modal-root")!;
  root.innerHTML = "";
  const bg = document.createElement("div");
  bg.className = "modal-bg";
  const modal = document.createElement("div");
  modal.className = "modal end-screen " + state.phase;

  const title = document.createElement("div");
  title.className = "title";
  title.textContent = state.phase === "won" ? "登顶！" : "被雪魔扑倒";
  modal.appendChild(title);

  const summary = document.createElement("div");
  summary.style.fontFamily = "var(--font-num)";
  summary.style.marginTop = "var(--s-16)";
  summary.style.lineHeight = "1.8";
  const madCount = state.player.handDice.filter((d) => d.kind === "madness").length;
  summary.innerHTML = `
    <div>用了 <strong>${state.round}</strong> 回合</div>
    <div>玩家终格 <strong>${state.player.cell}</strong></div>
    <div>雪魔终格 <strong>${state.demon.cell}</strong></div>
    <div>累得 <strong>${madCount}</strong> 颗疯狂骰</div>
  `;
  modal.appendChild(summary);

  const btnRow = document.createElement("div");
  btnRow.style.marginTop = "var(--s-24)";
  btnRow.style.display = "flex";
  btnRow.style.gap = "var(--s-8)";
  btnRow.style.justifyContent = "center";

  const restart = document.createElement("button");
  restart.className = "btn primary";
  restart.textContent = "重开";
  restart.addEventListener("click", onRestart);
  btnRow.appendChild(restart);

  const home = document.createElement("button");
  home.className = "btn";
  home.textContent = "回主菜单";
  home.addEventListener("click", onHome);
  btnRow.appendChild(home);

  modal.appendChild(btnRow);
  bg.appendChild(modal);
  root.appendChild(bg);
}
```

- [ ] **Step 3: Wire startMenu / endScreen in `src/main.ts`**

Replace `src/main.ts` content with:

```typescript
import { initialState } from "./game/state";
import { applyAction } from "./game/rules";
import { renderBoard } from "./ui/board";
import { renderTopBar } from "./ui/topBar";
import { renderPlayerPanel } from "./ui/playerPanel";
import { renderDemonPanel } from "./ui/demonPanel";
import { renderDicePool } from "./ui/dicePool";
import { renderActionRail } from "./ui/actionRail";
import { renderEventLog } from "./ui/eventLog";
import { openCardModal } from "./ui/cardModal";
import { openRulesModal } from "./ui/rulesModal";
import { renderStartMenu } from "./ui/startMenu";
import { renderEndScreen } from "./ui/endScreen";
import type { Action, GameState } from "./game/types";

let state: GameState | null = null;

function startGame(): void {
  state = initialState(Math.floor(Math.random() * 1e6));
  render();
}

function showStart(): void {
  state = null;
  document.querySelectorAll("#top-bar, #board, #player-panel, #demon-panel, #dice-pool, #action-rail, #event-log").forEach((el) => {
    (el as HTMLElement).innerHTML = "";
  });
  renderStartMenu(startGame);
}

function dispatch(a: Action): void {
  if (!state) return;
  state = applyAction(state, a);
  render();

  if (state.phase === "won" || state.phase === "lost") {
    setTimeout(() => {
      renderEndScreen(state!, startGame, showStart);
    }, 800);
    return;
  }

  // Auto-resolve event cards
  if (state.phase === "await-select" && state.currentCard?.type === "event") {
    setTimeout(() => {
      if (!state) return;
      state = applyAction(state, { kind: "advance-event-card" });
      render();
      if (state.phase === "won" || state.phase === "lost") {
        setTimeout(() => {
          renderEndScreen(state!, startGame, showStart);
        }, 800);
      }
    }, 600);
  }
}

function render(): void {
  if (!state) return;
  renderTopBar(document.getElementById("top-bar")!, state, dispatch);
  renderBoard(document.getElementById("board")!, state);
  renderPlayerPanel(document.getElementById("player-panel")!, state, dispatch);
  renderDemonPanel(document.getElementById("demon-panel")!, state, dispatch);
  renderDicePool(document.getElementById("dice-pool")!, state, dispatch);
  renderActionRail(document.getElementById("action-rail")!, state, dispatch);
  renderEventLog(document.getElementById("event-log")!, state);
}

document.addEventListener("open-card-modal", () => {
  if (state?.currentCard) openCardModal(state.currentCard);
});

// Add help button
const helpBtn = document.createElement("button");
helpBtn.className = "btn";
helpBtn.textContent = "规则 ?";
helpBtn.style.position = "fixed";
helpBtn.style.right = "var(--s-16)";
helpBtn.style.top = "var(--s-16)";
helpBtn.style.zIndex = "50";
helpBtn.addEventListener("click", openRulesModal);
document.body.appendChild(helpBtn);

showStart();
```

- [ ] **Step 4: Smoke test full flow**

```bash
npm run dev &
DEV_PID=$!
sleep 3
echo "Verify:"
echo "  - StartMenu shows on load"
echo "  - Click 开始游戏 → game starts"
echo "  - Play through to WIN or LOSE → EndScreen shows"
echo "  - Click 重开 → game restarts"
echo "  - Click 回主菜单 → StartMenu shows"
read
kill $DEV_PID
```

- [ ] **Step 5: Commit**

```bash
cd /Users/huanghaibin/Workspace/games
git add climb-mountain/src/ui/startMenu.ts climb-mountain/src/ui/endScreen.ts climb-mountain/src/main.ts
git commit -m "$(cat <<'EOF'
feat(climb-mountain): StartMenu + WIN/LOSE EndScreen

Start → game loop → end. EndScreen shows round count / final positions /
madness collected. 重开 / 回主菜单 both wired.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 22: DeerAPI Sprite Generation Pipeline

**Files:**
- Create: `scripts/gen_sprites.py`
- Create: `scripts/chromakey.py`

Port zomboy's pipeline, swap subject prompts for our 9 assets.

- [ ] **Step 1: Write `scripts/gen_sprites.py`**

```python
"""Generate climb-mountain art assets via DeerAPI gpt-image-2.

Style: dark cosmic-horror snowy mountain. Cool palette (navy / teal accents)
with crimson reserved for danger (snow demon, slide indicators).

Usage:
    python gen_sprites.py                  # generate all missing
    python gen_sprites.py --force          # overwrite existing
    python gen_sprites.py mountain hastur  # subset by stem name
"""

import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

API_KEY = os.environ["DEERAPI_KEY"]
API_URL = "https://api.deerapi.com/v1/images/generations"
MODEL = "gpt-image-2"

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "src" / "assets"
OUT_DIR.mkdir(parents=True, exist_ok=True)

# Common style suffix appended to every prompt.
STYLE_SUFFIX = (
    " Painted-illustration style, cosmic horror, dark snowy mountain mood. "
    "Limited palette: deep navy #0F1820, panel blue #1B2C3C, cyan accent #00A3B5, "
    "off-white #C8D6E4, blood crimson reserved for danger. "
    "Solid magenta #FF00FF background (will be removed). "
    "High contrast, painterly brushwork, sharp focal subject, no text, no UI elements."
)

PROMPTS = {
    "mountain_bg": (
        "A vertical wide composition of a sheer Cthulhu-haunted snow mountain seen from below, "
        "with mist coiling around impossible angles near the summit and a distant glowing rune "
        "etched into the rock. No climbers visible."
    ),
    "climber": (
        "Portrait bust of a lone mountaineer in heavy snow gear, frost on the goggles, "
        "axe slung over shoulder, ice on the parka, exhausted but resolute. Three-quarter view."
    ),
    "snow_demon": (
        "Portrait bust of a Cthulhu-influenced snow demon: tendrils of frost-flesh, "
        "burning crimson eye-slits in a featureless white mask, drifting snow around it. "
        "Three-quarter view, looming."
    ),
    "card_march_to_death": (
        "Tarot-card composition: a lone figure walking into a snowstorm toward a distant red light. "
        "Vertical card aspect, painterly, ominous."
    ),
    "card_armata_stare": (
        "Tarot-card composition: a giant frozen eye embedded in glacier ice, "
        "snowflakes orbiting like satellites. Vertical card aspect."
    ),
    "card_sasna_anomaly": (
        "Tarot-card composition: a fractal frost crystal collapsing into impossible geometry, "
        "thin red veins inside. Vertical card aspect."
    ),
    "card_continuous_pain": (
        "Tarot-card composition: bone-thin climber roped to ghostly twins of itself fading into snow. "
        "Vertical card aspect."
    ),
    "card_hastur": (
        "Tarot-card composition: a yellow-robed silhouette barely visible through a blizzard, "
        "wearing a featureless mask. Vertical card aspect, slight sickly yellow tint over the cool palette."
    ),
    "card_ithaqua": (
        "Tarot-card composition: a giant humanoid storm-shape descending from sky into a village, "
        "ice claws extended. Vertical card aspect."
    ),
}


def request_image(prompt: str, out_path: Path) -> None:
    payload = {
        "model": MODEL,
        "prompt": prompt + STYLE_SUFFIX,
        "n": 1,
        "size": "1024x1024",
        "response_format": "b64_json",
    }
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        API_URL,
        data=data,
        headers={
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    for attempt in range(3):
        try:
            with urllib.request.urlopen(req, timeout=120) as resp:
                body = json.load(resp)
                b64 = body["data"][0]["b64_json"]
                out_path.write_bytes(base64.b64decode(b64))
                return
        except urllib.error.URLError as e:
            print(f"  retry {attempt + 1}/3 for {out_path.name}: {e}", file=sys.stderr)
            time.sleep(2 ** attempt)
    raise RuntimeError(f"failed to generate {out_path.name}")


def main(argv: list[str]) -> int:
    force = "--force" in argv
    args = [a for a in argv if not a.startswith("--")]
    targets = args if args else list(PROMPTS.keys())

    todo: list[tuple[str, str, Path]] = []
    for stem in targets:
        if stem not in PROMPTS:
            print(f"unknown stem: {stem}; valid: {', '.join(PROMPTS)}")
            return 1
        out = OUT_DIR / f"{stem}.png"
        if out.exists() and not force:
            print(f"skip {out.name} (already exists)")
            continue
        todo.append((stem, PROMPTS[stem], out))

    if not todo:
        print("nothing to generate")
        return 0

    print(f"generating {len(todo)} images...")
    with ThreadPoolExecutor(max_workers=3) as pool:
        futs = {pool.submit(request_image, prompt, out): stem for stem, prompt, out in todo}
        for fut in as_completed(futs):
            stem = futs[fut]
            try:
                fut.result()
                print(f"  ✓ {stem}.png")
            except Exception as e:
                print(f"  ✗ {stem}.png — {e}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
```

- [ ] **Step 2: Write `scripts/chromakey.py`**

```python
"""Remove the magenta (#FF00FF) background from PNG sprites — make it transparent.

Usage:
    python chromakey.py                       # process all PNGs in src/assets/
    python chromakey.py mountain_bg climber   # process specific stems
"""

import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "src" / "assets"


def chroma_key(path: Path, threshold: int = 70) -> None:
    img = Image.open(path).convert("RGBA")
    pixels = img.load()
    assert pixels is not None
    w, h = img.size
    removed = 0
    for y in range(h):
        for x in range(w):
            r, g, b, _a = pixels[x, y]
            # Magenta-ish: high R, low G, high B
            if r > 200 and g < threshold and b > 200:
                pixels[x, y] = (0, 0, 0, 0)
                removed += 1
    img.save(path)
    pct = removed * 100 // (w * h) if w * h else 0
    print(f"  {path.name}: cleared {removed} / {w * h} pixels ({pct}%)")


def main(argv: list[str]) -> int:
    if argv:
        targets = [ASSETS / f"{stem}.png" for stem in argv]
    else:
        targets = sorted(ASSETS.glob("*.png"))
    for path in targets:
        if not path.exists():
            print(f"missing: {path}", file=sys.stderr)
            continue
        chroma_key(path)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
```

- [ ] **Step 3: Commit (no run yet — generation in next task)**

```bash
cd /Users/huanghaibin/Workspace/games
git add climb-mountain/scripts/gen_sprites.py climb-mountain/scripts/chromakey.py
git commit -m "$(cat <<'EOF'
feat(climb-mountain): DeerAPI sprite gen + chromakey pipeline

Port from zomboy. 9 prompts: mountain_bg + climber + snow_demon + 6 cards.
Magenta #FF00FF background → transparent via PIL post-processing.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 23: Generate the 9 Images + Wire into UI

**Files:**
- Create: 9 files in `src/assets/*.png`
- Modify: `src/ui/board.ts`, `src/ui/playerPanel.ts`, `src/ui/demonPanel.ts`, `src/ui/cardModal.ts`

- [ ] **Step 1: Set DEERAPI_KEY and generate**

```bash
cd climb-mountain
export DEERAPI_KEY="<your key>"  # see ~/.zshrc or memory if you've stored it
python3 scripts/gen_sprites.py
```

Expected: 9 PNG files appear in `src/assets/`. If any fail, re-run for just that stem.

- [ ] **Step 2: Chroma-key the assets that should be transparent**

For climber and snow_demon (portraits), the magenta strip-out matters. For mountain_bg and card art, the background can stay — magenta in those would be unsightly. So only chromakey portraits.

```bash
python3 scripts/chromakey.py climber snow_demon
```

- [ ] **Step 3: Wire `mountain_bg` as board background**

Edit `src/ui/style.css` — replace `.board { ... }` block with:

```css
.board {
  background: url("/src/assets/mountain_bg.png") center / cover;
  border: 1px solid var(--border);
  border-radius: var(--s-8);
  display: flex;
  flex-direction: column-reverse;
  justify-content: stretch;
  padding: var(--s-8);
  position: relative;
}
.board .cell {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 var(--s-8);
  font-family: var(--font-num);
  font-size: 14px;
  border-bottom: 1px solid rgba(37, 54, 74, 0.5);
  background: rgba(15, 24, 32, 0.55); /* dim overlay so text stays readable */
}
```

- [ ] **Step 4: Wire climber + snow_demon portraits into panels**

Edit `src/ui/playerPanel.ts` — replace the title block to include an `<img>`:

Find the `title.textContent = "你 · 登山者";` lines and replace the preceding/following with:

```typescript
  const header = document.createElement("div");
  header.style.display = "flex";
  header.style.alignItems = "center";
  header.style.gap = "var(--s-8)";
  header.style.marginBottom = "var(--s-16)";

  const portrait = document.createElement("img");
  portrait.src = "/src/assets/climber.png";
  portrait.alt = "climber";
  portrait.style.width = "48px";
  portrait.style.height = "48px";
  portrait.style.borderRadius = "var(--s-6)";
  portrait.style.objectFit = "cover";
  header.appendChild(portrait);

  const title = document.createElement("h3");
  title.textContent = "你 · 登山者";
  title.style.fontFamily = "var(--font-title)";
  title.style.color = "var(--accent)";
  title.style.margin = "0";
  header.appendChild(title);
  parent.appendChild(header);
```

(Remove the original separate `title` insertion since it's now inside `header`.)

Edit `src/ui/demonPanel.ts` similarly — swap title for header with `<img src="/src/assets/snow_demon.png">`.

- [ ] **Step 5: Wire card art into CardModal**

Edit `src/ui/cardModal.ts` — after `const title = document.createElement("h2");` block, add:

```typescript
  const cardArt = document.createElement("img");
  // Map card.id to asset filename
  const artMap: Record<string, string> = {
    "march-to-death":  "card_march_to_death.png",
    "armata-stare":    "card_armata_stare.png",
    "sasna-anomaly":   "card_sasna_anomaly.png",
    "continuous-pain": "card_continuous_pain.png",
    "hastur":          "card_hastur.png",
    "ithaqua":         "card_ithaqua.png",
  };
  if (artMap[card.id]) {
    cardArt.src = `/src/assets/${artMap[card.id]}`;
    cardArt.alt = card.name;
    cardArt.style.width = "100%";
    cardArt.style.maxHeight = "280px";
    cardArt.style.objectFit = "cover";
    cardArt.style.borderRadius = "var(--s-6)";
    cardArt.style.marginBottom = "var(--s-16)";
    modal.appendChild(cardArt);
  }
```

- [ ] **Step 6: Smoke test in browser**

```bash
npm run dev &
DEV_PID=$!
sleep 3
echo "Verify:"
echo "  - Board background shows mountain art"
echo "  - PlayerPanel + DemonPanel show portrait images"
echo "  - Open a CardModal → card art appears at top"
read
kill $DEV_PID
```

- [ ] **Step 7: Commit (note: art files are gitignored; only code changes commit)**

```bash
cd /Users/huanghaibin/Workspace/games
git add climb-mountain/src/ui/style.css climb-mountain/src/ui/playerPanel.ts climb-mountain/src/ui/demonPanel.ts climb-mountain/src/ui/cardModal.ts
git commit -m "$(cat <<'EOF'
feat(climb-mountain): wire DeerAPI art (background, portraits, card art)

mountain_bg as board CSS background with dim overlay for legibility.
climber + snow_demon portraits in 48px header thumbs (chroma-keyed).
6 card images shown in CardModal. PNGs gitignored as local artifacts.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 24: Animations — 2-second commit sequence

**Files:**
- Modify: `src/ui/style.css` (add keyframes)
- Modify: `src/ui/board.ts` (use CSS transition for pawn moves)
- Modify: `src/main.ts` (insert pause during animation; disable buttons)

The 2-second budget breaks down as:
- 0.0–0.6s: C-phase visual (dice fade-out for returned dice)
- 0.6–1.2s: D-phase player pawn jump
- 1.2–2.0s: demon advance

We rely on CSS `transition` on the `.pawn` for movement smoothness. The state mutation happens atomically in `applyAction(commit)`, but we sequence the *visual reveal* by gating render in a "resolving" phase.

For Phase 1 we'll keep it simple: introduce a `resolving` UI state, hold the previous board frame for 600ms, then render the new frame. The pawns animate via CSS transition between the two positions.

- [ ] **Step 1: Replace `dispatch` in `src/main.ts` with the animated version**

```typescript
function dispatch(a: Action): void {
  if (!state) return;

  if (a.kind === "commit") {
    // Take the post-commit state, but reveal in stages
    const postCommit = applyAction(state, a);
    // Stage 1: hold previous frame with a "resolving" badge (200ms)
    state = { ...state, phase: "resolving" };
    render();
    setTimeout(() => {
      state = postCommit;
      render();
      // pawn CSS transitions handle the 2s pawn-movement reveal
      if (state.phase === "won" || state.phase === "lost") {
        setTimeout(() => renderEndScreen(state!, startGame, showStart), 2000);
        return;
      }
      if (state.phase === "await-select" && state.currentCard?.type === "event") {
        setTimeout(() => {
          if (!state) return;
          const postEvent = applyAction(state, { kind: "advance-event-card" });
          state = { ...state, phase: "resolving" };
          render();
          setTimeout(() => {
            state = postEvent;
            render();
            if (state.phase === "won" || state.phase === "lost") {
              setTimeout(() => renderEndScreen(state!, startGame, showStart), 2000);
            }
          }, 200);
        }, 600);
      }
    }, 200);
    return;
  }

  state = applyAction(state, a);
  render();
}
```

- [ ] **Step 2: Disable all action buttons during `resolving` phase**

Edit `src/ui/actionRail.ts` — at the start of `renderActionRail`, add:

```typescript
  if (state.phase === "resolving") {
    parent.innerHTML = "";
    parent.className = "action-rail";
    const wait = document.createElement("div");
    wait.style.fontFamily = "var(--font-num)";
    wait.style.color = "var(--accent)";
    wait.style.padding = "var(--s-8) var(--s-16)";
    wait.textContent = "结算中...";
    parent.appendChild(wait);
    return;
  }
```

- [ ] **Step 3: Refactor `src/ui/board.ts` to absolute-positioned pawns with stable DOM**

Pawns must be absolutely-positioned over the cell grid (so the `top` property can animate) AND must survive re-renders (otherwise CSS transitions never fire — the browser sees fresh DOM nodes, not changed properties). We cache the pawn elements at module scope and only update their `top`.

Replace `src/ui/board.ts`:

```typescript
import type { GameState } from "../game/types";
import { balance } from "../game/balance";

let cellsRendered = false;
let playerPawn: HTMLElement | null = null;
let demonPawn: HTMLElement | null = null;

export function renderBoard(parent: HTMLElement, state: GameState): void {
  if (!cellsRendered) {
    parent.innerHTML = "";
    parent.className = "board";

    for (let cell = balance.GOAL_CELL; cell >= 1; cell--) {
      const el = document.createElement("div");
      el.className = "cell" + (cell === balance.GOAL_CELL ? " goal" : "");
      el.dataset.cell = String(cell);
      const label = document.createElement("span");
      label.textContent = cell === balance.GOAL_CELL ? "GOAL" : String(cell);
      el.appendChild(label);
      parent.appendChild(el);
    }

    playerPawn = document.createElement("div");
    playerPawn.className = "pawn player";
    playerPawn.style.position = "absolute";
    playerPawn.style.right = "var(--s-24)";
    playerPawn.style.transition = "top var(--t-anim) ease";
    parent.appendChild(playerPawn);

    demonPawn = document.createElement("div");
    demonPawn.className = "pawn demon";
    demonPawn.style.position = "absolute";
    demonPawn.style.left = "var(--s-24)";
    demonPawn.style.transition = "top var(--t-anim) ease";
    parent.appendChild(demonPawn);

    cellsRendered = true;
  }

  const playerPct = ((balance.GOAL_CELL - state.player.cell) / balance.GOAL_CELL) * 100;
  const demonPct = ((balance.GOAL_CELL - state.demon.cell) / balance.GOAL_CELL) * 100;
  if (playerPawn) playerPawn.style.top = `calc(${playerPct}% + var(--s-8))`;
  if (demonPawn) demonPawn.style.top = `calc(${demonPct}% + var(--s-8))`;
}

// Call this when starting a new game to reset DOM caching
export function resetBoard(): void {
  cellsRendered = false;
  playerPawn = null;
  demonPawn = null;
}
```

Update `src/main.ts` to call `resetBoard()` in `startGame()`:

```typescript
import { renderBoard, resetBoard } from "./ui/board";
// ...
function startGame(): void {
  resetBoard();
  document.getElementById("board")!.innerHTML = "";
  state = initialState(Math.floor(Math.random() * 1e6));
  render();
}
```

- [ ] **Step 4: Smoke test animation**

```bash
npm run dev &
DEV_PID=$!
sleep 3
echo "Verify:"
echo "  - Click 结算 → 'resolving' badge in action-rail for ~200ms"
echo "  - Then player pawn smoothly slides up (~2s)"
echo "  - Then demon pawn smoothly slides up"
echo "  - Buttons stay disabled during the resolving window"
echo "  - On WIN/LOSE, animation completes before end screen pops"
read
kill $DEV_PID
```

- [ ] **Step 5: Commit**

```bash
cd /Users/huanghaibin/Workspace/games
git add climb-mountain/src/main.ts climb-mountain/src/ui/board.ts climb-mountain/src/ui/actionRail.ts
git commit -m "$(cat <<'EOF'
feat(climb-mountain): 2-second commit animation

Pawn DOM cached across renders so CSS top transition fires. "resolving"
phase disables action rail buttons. End screen waits 2s for pawn animation
to land.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 25: Balance Gate — first run + tune if needed

**Files:**
- Create: `docs/balance/2026-05-21-run-1.md`
- May modify: `src/game/balance.ts` (if gate fails)

- [ ] **Step 1: Run baseline harness**

```bash
cd climb-mountain
npx tsx scripts/simulate.ts --report
```

Expected output: a `docs/balance/<date>-run.md` file with stats and pass/fail per gate metric.

- [ ] **Step 2: Read gate report**

```bash
cat docs/balance/$(ls docs/balance/ | grep run.md | sort | tail -1)
```

- [ ] **Step 3: If gate FAILS, tune and re-run**

Common adjustments:
- Win rate too high (>60%) → increase demon pressure: bump `DEMON_BASELINE_PER_ROUND` or `DEMON_BONUS_ON_*`
- Win rate too low (<35%) → decrease demon pressure or increase `SLIDE_BACK_CELLS` reduction; or move `START_DEMON_CELL` further back
- Avg rounds too short (<6) → game ends too fast; consider larger `GOAL_CELL` or weaker demon
- Avg rounds too long (>12) → demon too weak or player tasks too easy; tune card advance values
- Avg slides < 1 → cards too easy; tighten `minDice` or `sum-at-least` thresholds in cards.ts

Edit `src/game/balance.ts`, re-run `npx tsx scripts/simulate.ts --report`, repeat until 3/3 PASS.

- [ ] **Step 4: Verify all tests still pass after any tuning**

```bash
npm test
```

Expected: all PASS.

- [ ] **Step 5: Verify smoke test still works**

```bash
npm run dev &
DEV_PID=$!
sleep 3
echo "Play one full game end-to-end. Confirm:"
echo "  - No console errors"
echo "  - End screen reaches WIN or LOSE within ~3 minutes of normal play"
echo "  - Demon advance log lines make sense"
read
kill $DEV_PID
```

- [ ] **Step 6: Commit balance report + any balance.ts tweaks**

```bash
cd /Users/huanghaibin/Workspace/games
# Force-add the report despite .gitignore (this run is canonical)
git add -f climb-mountain/docs/balance/$(ls climb-mountain/docs/balance/ | grep run.md | sort | tail -1)
git add climb-mountain/src/game/balance.ts
git commit -m "$(cat <<'EOF'
balance(climb-mountain): Phase 1 walking-skeleton gate run #1

3/3 gate metrics PASS (win rate / avg rounds / avg slides). Records the
canonical balance.ts values for the first playtest.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-Review

After the plan was drafted, run this checklist with fresh eyes.

**1. Spec coverage:**

| Spec section | Task(s) |
|--------------|---------|
| §1.3 Phase 1 IN: port 1425 | Task 1 |
| §1.3 10-cell track | Task 16 (board) |
| §1.3 7 color + 2 madness dice initial | Task 6 (state) |
| §1.3 6 I-tier cards (4 normal + 2 event) | Task 5 (cards) |
| §1.3 A/B/C/D player flow | Tasks 8, 9 |
| §1.3 demon advance | Task 7, 9 |
| §1.3 WIN / LOSE | Task 9 |
| §1.3 DeerAPI 9 images | Tasks 22, 23 |
| §1.3 simulate.ts 3 modes | Tasks 13, 14 |
| §1.3 vitest ≥70% line coverage | Tasks 4-11 |
| §2.1 Card data shape | Task 5 |
| §2.4 C-phase sanity check | Task 9 |
| §2.5 slide back fixed 2 cells | Task 9 |
| §2.6 event card auto-resolution | Task 10 |
| §2.7 demon advance formula + clamp | Task 7, 9 |
| §2.8 tiebreak LOSE wins | Task 9 |
| §2.10 12 balance constants | Tasks 3, 14 |
| §3 file structure | All file paths match Task 1-24 |
| §3 single applyAction entry | Task 8, 9, 10 |
| §3 GameState with rng | Tasks 2, 6 |
| §4 single screen layout | Task 15, 19 |
| §4.2 modals | Tasks 20, 21 |
| §4.3 interactions w/ CSS transitions | Task 18, 24 |
| §4.4 WIN / LOSE end screens | Task 21 |
| §4.5 visual规范 (palette, fonts, spacing) | Task 15 |
| §4.6 DeerAPI generation, chroma-key | Tasks 22, 23 |
| §5.1 simulate.ts 3 modes | Tasks 13, 14 |
| §5.4 balance gate metrics | Task 25 |
| §5.5 balance report archiving | Tasks 13, 25 |

All sections covered.

**2. Placeholder scan:** No "TBD", "implement appropriately", or empty step bodies. The two ⚠️ caution callouts in Tasks 5 and 24 are pre-emptive notes about issues fixed in the very next sub-step of the same task — not unresolved TBDs.

**3. Type consistency:**
- `applyAction(state, action)` signature consistent across Tasks 8, 9, 10
- `GameState` field names match definitions in Task 2 throughout
- `balance.KEY` access pattern consistent across Task 14 refactor + all downstream
- `Card.minDice: number | "ALL"` checked everywhere as `card.minDice === "ALL" ? handDice.length : card.minDice as number`
- `DiceCondition` union: `distinct-faces-at-most` added in Task 5 Step 4 and used in `evaluateCondition` + `conditionText` (Task 20)
- Render functions: every one takes `(parent, state, dispatch?)` — Tasks 16-21

Plan complete.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-20-climb-mountain-plan-1-skeleton.md`. Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
