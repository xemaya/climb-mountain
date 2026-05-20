import { describe, it, expect } from "vitest";
import { initialState } from "../src/game/state";
import { applyAction } from "../src/game/rules";

describe("edge cases", () => {
  it("deck reshuffles after exhaustion", () => {
    const s0 = initialState(1);
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
