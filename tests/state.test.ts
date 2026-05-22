import { describe, it, expect } from "vitest";
import { initialState } from "../src/game/state";
import { allCards } from "../src/game/cards";
import { getLevelConfig } from "../src/game/levels";

describe("initialState", () => {
  it("places player and demon at start cells", () => {
    const s = initialState(1);
    const level = getLevelConfig(1);
    expect(s.player.cell).toBe(level.startPlayerCell);
    expect(s.demon.cell).toBe(level.startDemonCell);
  });

  it("starts in await-select phase with currentCard drawn", () => {
    const s = initialState(1);
    expect(s.phase).toBe("await-select");
    expect(s.currentCard).not.toBeNull();
  });

  it("gives player PLAYER_COLOR_DICE color dice + START_MADNESS_DICE madness dice", () => {
    const s = initialState(1);
    const level = getLevelConfig(1);
    const color = s.player.handDice.filter((d) => d.kind === "color");
    const mad = s.player.handDice.filter((d) => d.kind === "madness");
    expect(color.length).toBe(level.colorDice);
    expect(mad.length).toBe(level.startMadnessDice);
  });

  it("madness stock is MADNESS_STOCK - START_MADNESS_DICE", () => {
    const s = initialState(1);
    const level = getLevelConfig(1);
    expect(s.madnessStock).toBe(level.madnessStock - level.startMadnessDice);
  });

  it("deck has one fewer card after drawing currentCard", () => {
    const s = initialState(1);
    expect(s.deck.length).toBe(allCards.length - 1);
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
