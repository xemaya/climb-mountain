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
      const groups = Array.from(counts.values()).filter((groupSize) => groupSize >= cond.groupSize).length;
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
    return null;
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
