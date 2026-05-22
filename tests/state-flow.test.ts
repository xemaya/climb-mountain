import { describe, it, expect } from "vitest";
import { initialState } from "../src/game/state";
import { resolveTask } from "../src/game/cards";
import { applyAction, climbScore } from "../src/game/rules";
import type { GameState } from "../src/game/types";

function playGreedyTurn(s: GameState): GameState {
  while (s.phase === "await-select" && s.player.handDice.length > 0) {
    const score = climbScore(s.player.rolled);
    const result = s.currentCard ? resolveTask(s.currentCard, score) : null;
    if (s.player.rolled.length >= 2 && result !== null && result > 0) break;
    if (s.player.rolled.length >= 5) break;
    s = applyAction(s, { kind: "draw-die" });
  }
  return applyAction(s, { kind: "commit" });
}

function playToEnd(seed: number, maxRounds = 100): GameState {
  let s = initialState(seed);
  for (let r = 0; r < maxRounds; r++) {
    if (s.phase === "won" || s.phase === "lost") return s;
    if (s.phase === "level-cleared") {
      s = applyAction(s, { kind: "next-level" });
      continue;
    }
    if (s.phase === "await-select" && s.currentCard) {
      s = playGreedyTurn(s);
    } else {
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
    console.log(`Golden path test: ${won} won, ${lost} lost across 50 seeds`);
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
