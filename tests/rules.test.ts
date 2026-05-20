import { describe, it, expect } from "vitest";
import { GOAL_CELL, SLIDE_BACK_CELLS } from "../src/game/balance";
import { applyAction, climbScore } from "../src/game/rules";
import { initialState } from "../src/game/state";
import type { Die, GameState } from "../src/game/types";

function withCard(id: string): GameState {
  for (let seed = 1; seed < 200; seed++) {
    const s = initialState(seed);
    if (s.currentCard?.id === id) return s;
  }
  throw new Error(`missing seed for ${id}`);
}

function withRolled(s: GameState, rolled: Die[]): GameState {
  const rolledIds = new Set(rolled.map((d) => d.id));
  return {
    ...s,
    player: {
      ...s.player,
      handDice: s.player.handDice.filter((d) => !rolledIds.has(d.id)),
      rolled,
    },
  };
}

describe("rules: blackjack-style dice flow", () => {
  it("draw-die pulls one die from the bag and rolls a face", () => {
    const s0 = initialState(1);
    const handBefore = s0.player.handDice.length;
    const s1 = applyAction(s0, { kind: "draw-die" });

    expect(s1.phase).toBe("await-select");
    expect(s1.player.handDice.length).toBe(handBefore - 1);
    expect(s1.player.rolled.length).toBe(1);
    expect(s1.player.rolled[0].face).not.toBeNull();
  });

  it("climbScore adds color dice and subtracts madness dice", () => {
    expect(climbScore([
      { id: "c0", kind: "color", face: 5 },
      { id: "c1", kind: "color", face: 4 },
      { id: "m0", kind: "madness", face: 6 },
    ])).toBe(3);
  });
});

describe("rules: commit turn resolution", () => {
  it("hitting a score tier advances the player", () => {
    const s = withCard("armata-stare");
    const before = s.player.cell;
    const rolled = s.player.handDice.filter((d) => d.kind === "color").slice(0, 3)
      .map((d) => ({ ...d, face: 5 as const }));
    const s1 = withRolled(s, rolled);
    const s2 = applyAction(s1, { kind: "commit" });

    expect(s2.player.cell).toBe(before + 3);
  });

  it("missing every tier slides back and adds one madness die", () => {
    const s = withCard("armata-stare");
    const stockBefore = s.madnessStock;
    const madnessBefore = s.player.handDice.filter((d) => d.kind === "madness").length;
    const rolled = s.player.handDice.filter((d) => d.kind === "color").slice(0, 2)
      .map((d) => ({ ...d, face: 1 as const }));
    const s1 = withRolled({ ...s, player: { ...s.player, cell: 5 } }, rolled);
    const s2 = applyAction(s1, { kind: "commit" });

    expect(s2.player.cell).toBe(Math.max(1, 5 - SLIDE_BACK_CELLS));
    expect(s2.player.handDice.filter((d) => d.kind === "madness").length).toBe(madnessBefore + 1);
    expect(s2.madnessStock).toBe(stockBefore - 1);
  });

  it("madness dice can pull a successful roll below the target", () => {
    const s = withCard("armata-stare");
    const color = s.player.handDice.find((d) => d.kind === "color")!;
    const madness = s.player.handDice.find((d) => d.kind === "madness")!;
    const s1 = withRolled(s, [
      { ...color, face: 6 },
      { ...madness, face: 3 },
    ]);
    const s2 = applyAction(s1, { kind: "commit" });

    expect(s2.player.cell).toBe(s.player.cell - SLIDE_BACK_CELLS);
  });

  it("WIN: player reaches GOAL_CELL", () => {
    const s = withCard("armata-stare");
    const rolled = s.player.handDice.filter((d) => d.kind === "color").slice(0, 3)
      .map((d) => ({ ...d, face: 5 as const }));
    const s1 = withRolled({ ...s, player: { ...s.player, cell: GOAL_CELL - 1 }, demon: { cell: 0 } }, rolled);
    const s2 = applyAction(s1, { kind: "commit" });

    expect(s2.phase).toBe("won");
  });

  it("LOSE: demon catches player", () => {
    const s = withCard("armata-stare");
    const rolled = s.player.handDice.filter((d) => d.kind === "color").slice(0, 2)
      .map((d) => ({ ...d, face: 1 as const }));
    const s1 = withRolled({ ...s, player: { ...s.player, cell: 2 }, demon: { cell: 1 } }, rolled);
    const s2 = applyAction(s1, { kind: "commit" });

    expect(s2.phase).toBe("lost");
  });
});
