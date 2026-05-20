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

  it("resolveTask returns highest-tier advance for normal card", () => {
    const card = allCards.find((c) => c.id === "armata-stare")!;
    expect(resolveTask(card, faces([6]))).toBe(1);
    expect(resolveTask(card, faces([6, 6, 1]))).toBe(3);
    expect(resolveTask(card, faces([2, 2]))).toBe(null);
  });

  it("resolveTask for event card sum-thresholds", () => {
    const event = allCards.find((c) => c.id === "hastur")!;
    expect(resolveTask(event, faces([6, 6, 6]))).toBe(3);
    expect(resolveTask(event, faces([1, 2]))).toBe(-2);
    expect(resolveTask(event, faces([3, 3, 3]))).toBe(0);
  });

  it("ithaqua slide on ≤ 2 distinct faces", () => {
    const event = allCards.find((c) => c.id === "ithaqua")!;
    expect(resolveTask(event, faces([1, 1, 1]))).toBe(-2);
    expect(resolveTask(event, faces([1, 2, 3, 4, 5]))).toBe(3);
    expect(resolveTask(event, faces([1, 1, 2, 3]))).toBe(0);
  });
});
