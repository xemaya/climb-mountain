import { describe, it, expect } from "vitest";
import { initialState } from "../src/game/state";
import { resolveTask } from "../src/game/cards";
import { applyAction, climbScore } from "../src/game/rules";

function playGreedyTurn(s: ReturnType<typeof initialState>) {
  while (s.phase === "await-select" && s.player.handDice.length > 0) {
    const score = climbScore(s.player.rolled);
    const result = s.currentCard ? resolveTask(s.currentCard, score) : null;
    if (s.player.rolled.length >= 2 && result !== null && result > 0) break;
    if (s.player.rolled.length >= 5) break;
    s = applyAction(s, { kind: "draw-die" });
  }
  return applyAction(s, { kind: "commit" });
}

describe("edge cases", () => {
  it("deck reshuffles after exhaustion", () => {
    const s0 = initialState(1);
    let s = s0;
    let turns = 0;
    while (s.phase !== "won" && s.phase !== "lost" && turns < 30) {
      s = playGreedyTurn(s);
      turns++;
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
      s = playGreedyTurn(s);
      expect(s.demon.cell).toBeLessThanOrEqual(s.player.cell);
      turns++;
    }
  });

  it("madness stock never goes negative", () => {
    let s = initialState(1);
    let turns = 0;
    while (s.phase !== "won" && s.phase !== "lost" && turns < 40) {
      s = playGreedyTurn(s);
      expect(s.madnessStock).toBeGreaterThanOrEqual(0);
      turns++;
    }
  });
});
