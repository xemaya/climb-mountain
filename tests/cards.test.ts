import { describe, it, expect } from "vitest";
import { allCards, evaluateCondition, resolveTask } from "../src/game/cards";
import type { DieFace } from "../src/game/types";

const faces = (xs: number[]): DieFace[] => xs as DieFace[];

describe("cards", () => {
  it("ships exactly 6 cards in Phase 1 (4 normal + 2 event)", () => {
    expect(allCards.length).toBe(6);
    expect(allCards.filter((c) => c.type === "normal").length).toBe(4);
    expect(allCards.filter((c) => c.type === "event").length).toBe(2);
  });

  it("evaluateCondition: sum-at-least", () => {
    expect(evaluateCondition({ kind: "sum-at-least", n: 6 }, faces([3, 3]))).toBe(true);
    expect(evaluateCondition({ kind: "sum-at-least", n: 6 }, faces([2, 3]))).toBe(false);
  });

  it("evaluateCondition: sum-at-most", () => {
    expect(evaluateCondition({ kind: "sum-at-most", n: 5 }, faces([2, 3]))).toBe(true);
    expect(evaluateCondition({ kind: "sum-at-most", n: 5 }, faces([3, 3]))).toBe(false);
  });

  it("evaluateCondition: face-count", () => {
    expect(evaluateCondition({ kind: "face-count", face: 1, atLeast: 2 }, faces([1, 1, 4]))).toBe(true);
    expect(evaluateCondition({ kind: "face-count", face: 1, atLeast: 2 }, faces([1, 4, 4]))).toBe(false);
  });

  it("evaluateCondition: same-face-groups", () => {
    expect(evaluateCondition({ kind: "same-face-groups", count: 2, groupSize: 2 }, faces([1, 1, 4, 4, 5]))).toBe(true);
    expect(evaluateCondition({ kind: "same-face-groups", count: 2, groupSize: 2 }, faces([1, 1, 4, 5, 6]))).toBe(false);
    expect(evaluateCondition({ kind: "same-face-groups", count: 1, groupSize: 3 }, faces([2, 2, 2, 5, 6]))).toBe(true);
  });

  it("evaluateCondition: distinct-faces", () => {
    expect(evaluateCondition({ kind: "distinct-faces", atLeast: 3 }, faces([1, 2, 3]))).toBe(true);
    expect(evaluateCondition({ kind: "distinct-faces", atLeast: 3 }, faces([1, 1, 1]))).toBe(false);
    expect(evaluateCondition({ kind: "distinct-faces", atLeast: 3 }, faces([1, 2, 2, 1]))).toBe(false);
  });

  it("resolveTask returns highest score tier for a normal card", () => {
    const card = allCards.find((c) => c.id === "armata-stare")!;
    expect(resolveTask(card, 7)).toBe(null);
    expect(resolveTask(card, 8)).toBe(1);
    expect(resolveTask(card, 13)).toBe(3);
  });

  it("resolveTask for event card score thresholds", () => {
    const event = allCards.find((c) => c.id === "hastur")!;
    expect(resolveTask(event, 9)).toBe(null);
    expect(resolveTask(event, 10)).toBe(2);
    expect(resolveTask(event, 15)).toBe(4);
  });

  it("ithaqua uses climb score tiers", () => {
    const event = allCards.find((c) => c.id === "ithaqua")!;
    expect(resolveTask(event, 8)).toBe(null);
    expect(resolveTask(event, 9)).toBe(2);
    expect(resolveTask(event, 14)).toBe(3);
  });
});
