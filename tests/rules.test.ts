import { describe, it, expect } from "vitest";
import { initialState } from "../src/game/state";
import { applyAction } from "../src/game/rules";
import { GOAL_CELL, SLIDE_BACK_CELLS } from "../src/game/balance";

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
    if (s0.currentCard!.minDice === "ALL") return;
    const min = s0.currentCard!.minDice as number;
    if (min <= 1) return;
    const fewIds = s0.player.handDice.slice(0, min - 1).map((d) => d.id);
    const s1 = applyAction(s0, { kind: "select-dice", ids: fewIds });
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

describe("rules: commit (turn resolution)", () => {
  it("C-phase returns madness + same-face color dice to hand", () => {
    const s0 = initialState(1);
    const ids = s0.player.handDice.map((d) => d.id);
    const s1 = applyAction(s0, { kind: "select-dice", ids });
    const s2 = applyAction(s1, { kind: "roll" });
    for (const d of s2.player.rolled) {
      if (d.kind === "madness") d.face = 1;
    }
    const aColor = s2.player.rolled.find((d) => d.kind === "color")!;
    aColor.face = 1;
    const s3 = applyAction(s2, { kind: "reroll", ids: [] });
    const s4 = applyAction(s3, { kind: "commit" });
    const handMadness = s4.player.handDice.filter((d) => d.kind === "madness").length;
    expect(handMadness).toBeGreaterThanOrEqual(s0.player.handDice.filter((d) => d.kind === "madness").length);
    expect(s4.player.rolled.length).toBe(0);
  });

  it("D-phase: hitting top tier advances player by that amount", () => {
    let s = initialState(1);
    let seedTry = 1;
    while (s.currentCard?.id !== "armata-stare") {
      seedTry++;
      s = initialState(seedTry);
    }
    const playerCellBefore = s.player.cell;
    const ids = s.player.handDice.filter((d) => d.kind === "color").slice(0, 3).map((d) => d.id);
    const s1 = applyAction(s, { kind: "select-dice", ids });
    const s2 = applyAction(s1, { kind: "roll" });
    for (const d of s2.player.rolled) d.face = 6;
    const s3 = applyAction(s2, { kind: "reroll", ids: [] });
    const s4 = applyAction(s3, { kind: "commit" });
    expect(s4.player.cell).toBe(playerCellBefore + 3);
  });

  it("D-phase: missing all tiers triggers slide back SLIDE_BACK_CELLS", () => {
    let s = initialState(1);
    let seedTry = 1;
    while (s.currentCard?.id !== "armata-stare") {
      seedTry++;
      s = initialState(seedTry);
    }
    s = { ...s, player: { ...s.player, cell: 5 } };
    const ids = s.player.handDice.filter((d) => d.kind === "color").slice(0, 3).map((d) => d.id);
    const s1 = applyAction(s, { kind: "select-dice", ids });
    const s2 = applyAction(s1, { kind: "roll" });
    for (const d of s2.player.rolled) d.face = 1;
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
    for (const d of s2.player.rolled) d.face = 1;
    const s3 = applyAction(s2, { kind: "reroll", ids: [] });
    const s4 = applyAction(s3, { kind: "commit" });
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
    for (const d of s2.player.rolled) d.face = 6;
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
    s = { ...s, player: { ...s.player, cell: 2 }, demon: { cell: 1 } };
    const ids = s.player.handDice.filter((d) => d.kind === "color").slice(0, 3).map((d) => d.id);
    const s1 = applyAction(s, { kind: "select-dice", ids });
    const s2 = applyAction(s1, { kind: "roll" });
    for (const d of s2.player.rolled) d.face = 1;
    const s3 = applyAction(s2, { kind: "reroll", ids: [] });
    const s4 = applyAction(s3, { kind: "commit" });
    expect(s4.phase).toBe("lost");
  });

  it("advances to next card after commit", () => {
    const s0 = initialState(1);
    const ids = s0.player.handDice.slice(0, 4).map((d) => d.id);
    const s1 = applyAction(s0, { kind: "select-dice", ids });
    const s2 = applyAction(s1, { kind: "roll" });
    const s3 = applyAction(s2, { kind: "reroll", ids: [] });
    const s4 = applyAction(s3, { kind: "commit" });
    if (s4.phase === "won" || s4.phase === "lost") return;
    expect(["await-select", "resolving"]).toContain(s4.phase);
    expect(s4.round).toBe(s0.round + 1);
  });
});

describe("event card auto-resolution", () => {
  it("advance-event-card auto-rolls all dice and applies result", () => {
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
    const s5 = applyAction(s4, { kind: "advance-event-card" });
    if (s5.phase === "won" || s5.phase === "lost") return;
    expect(["await-select", "resolving"]).toContain(s5.phase);
    expect(s5.round).toBe(s4.round + 1);
  });
});
