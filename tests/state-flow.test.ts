import { describe, it, expect } from "vitest";
import { initialState } from "../src/game/state";
import { applyAction } from "../src/game/rules";
import type { GameState } from "../src/game/types";

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
