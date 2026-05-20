import type { RngState } from "./types";

// mulberry32 — well-known small seedable PRNG
export function makeRng(seed: number): RngState {
  return { seed, state: seed >>> 0 };
}

export function nextFloat(rng: RngState): number {
  rng.state = (rng.state + 0x6d2b79f5) >>> 0;
  let t = rng.state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function nextInt(rng: RngState, exclusiveMax: number): number {
  return Math.floor(nextFloat(rng) * exclusiveMax);
}

export function shuffle<T>(rng: RngState, arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = nextInt(rng, i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
