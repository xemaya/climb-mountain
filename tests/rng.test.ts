import { describe, it, expect } from "vitest";
import { makeRng, nextInt, nextFloat, shuffle } from "../src/game/rng";

describe("rng", () => {
  it("produces deterministic sequence for the same seed", () => {
    const a = makeRng(42);
    const b = makeRng(42);
    const seqA = Array.from({ length: 5 }, () => nextInt(a, 100));
    const seqB = Array.from({ length: 5 }, () => nextInt(b, 100));
    expect(seqA).toEqual(seqB);
  });

  it("produces different sequences for different seeds", () => {
    const a = makeRng(1);
    const b = makeRng(2);
    const seqA = Array.from({ length: 5 }, () => nextInt(a, 100));
    const seqB = Array.from({ length: 5 }, () => nextInt(b, 100));
    expect(seqA).not.toEqual(seqB);
  });

  it("nextInt(rng, n) returns values in [0, n)", () => {
    const rng = makeRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = nextInt(rng, 6);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(6);
    }
  });

  it("shuffle is deterministic by seed", () => {
    const a = makeRng(123);
    const b = makeRng(123);
    const arrA = shuffle(a, [1, 2, 3, 4, 5, 6]);
    const arrB = shuffle(b, [1, 2, 3, 4, 5, 6]);
    expect(arrA).toEqual(arrB);
  });

  it("nextFloat returns values in [0, 1)", () => {
    const rng = makeRng(9);
    for (let i = 0; i < 100; i++) {
      const v = nextFloat(rng);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });
});
