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
