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
