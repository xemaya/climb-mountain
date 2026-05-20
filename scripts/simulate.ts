// Run via: npx tsx scripts/simulate.ts
// Modes:
//   (no args)               → Mode A: 1000 games with default seeds, dump stats
//   --sweep KEY=v1,v2,...   → Mode B: parameter sweep (Task 14)
//   --seed N --verbose      → Mode C: single seed, log every action
//   --report                → after Mode A, write balance report to docs/balance/

import { initialState } from "../src/game/state";
import { resolveTask } from "../src/game/cards";
import { applyAction, climbScore } from "../src/game/rules";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

type GameResult = {
  seed: number;
  outcome: "won" | "lost";
  rounds: number;
  finalPlayerCell: number;
  finalDemonCell: number;
  slidesCount: number;
  cardsDrawnByName: Record<string, number>;
};

function playOne(seed: number, verbose = false): GameResult {
  let s = initialState(seed);
  let slides = 0;
  const cardsDrawnByName: Record<string, number> = {};
  if (s.currentCard) cardsDrawnByName[s.currentCard.name] = 1;

  while (s.phase !== "won" && s.phase !== "lost") {
    if (verbose) {
      console.log(`r${s.round} phase=${s.phase} player=${s.player.cell} demon=${s.demon.cell} card=${s.currentCard?.name}`);
    }
    const before = s;
    if (s.currentCard && s.phase === "await-select") {
      const card = s.currentCard;
      while (s.phase === "await-select" && s.player.handDice.length > 0) {
        const score = climbScore(s.player.rolled);
        const result = resolveTask(card, score);
        if (s.player.rolled.length >= 2 && result !== null && result > 0) break;
        if (s.player.rolled.length >= 5) break;
        s = applyAction(s, { kind: "draw-die" });
        if (verbose) {
          const last = s.player.rolled.at(-1);
          console.log(`  draw ${last?.kind}:${last?.face} score=${climbScore(s.player.rolled)}`);
        }
      }
      s = applyAction(s, { kind: "commit" });
    } else {
      throw new Error(`stuck in phase ${s.phase}`);
    }
    if (s.player.cell < before.player.cell) slides++;
    if (s.currentCard && s.currentCard !== before.currentCard) {
      cardsDrawnByName[s.currentCard.name] = (cardsDrawnByName[s.currentCard.name] ?? 0) + 1;
    }
    if (s.round > 200) break;
  }

  return {
    seed,
    outcome: s.phase === "won" ? "won" : "lost",
    rounds: s.round,
    finalPlayerCell: s.player.cell,
    finalDemonCell: s.demon.cell,
    slidesCount: slides,
    cardsDrawnByName,
  };
}

function summarize(results: GameResult[]) {
  const n = results.length;
  const wins = results.filter((r) => r.outcome === "won").length;
  const avgRounds = results.reduce((a, r) => a + r.rounds, 0) / n;
  const avgSlides = results.reduce((a, r) => a + r.slidesCount, 0) / n;
  const winRate = wins / n;
  const cardFreq: Record<string, number> = {};
  for (const r of results) {
    for (const [name, count] of Object.entries(r.cardsDrawnByName)) {
      cardFreq[name] = (cardFreq[name] ?? 0) + count;
    }
  }
  const totalDraws = Object.values(cardFreq).reduce((a, b) => a + b, 0);
  return { n, wins, winRate, avgRounds, avgSlides, cardFreq, totalDraws };
}

function modeA(reportFile?: string) {
  const results: GameResult[] = [];
  for (let seed = 1; seed <= 1000; seed++) {
    results.push(playOne(seed));
  }
  const s = summarize(results);
  console.log(`=== Mode A (default 1000 games) ===`);
  console.log(`Games:        ${s.n}`);
  console.log(`Win rate:     ${(s.winRate * 100).toFixed(1)}%`);
  console.log(`Avg rounds:   ${s.avgRounds.toFixed(2)}`);
  console.log(`Avg slides:   ${s.avgSlides.toFixed(2)} per game`);
  console.log(`Card frequencies:`);
  const sortedCards = Object.entries(s.cardFreq).sort((a, b) => b[1] - a[1]);
  for (const [name, count] of sortedCards) {
    const pct = ((count / s.totalDraws) * 100).toFixed(1);
    console.log(`  ${name.padEnd(16)}  ${pct}%  (${count})`);
  }

  if (reportFile) {
    const md = `# Balance Run ${new Date().toISOString().slice(0, 10)}

- Games:    ${s.n}
- Win rate: **${(s.winRate * 100).toFixed(1)}%**
- Avg rounds: ${s.avgRounds.toFixed(2)}
- Avg slides per game: ${s.avgSlides.toFixed(2)}

## Card frequencies
${sortedCards.map(([name, c]) => `- ${name}: ${((c / s.totalDraws) * 100).toFixed(1)}% (${c})`).join("\n")}

## Gate check
- Win rate ∈ [35%, 60%]: ${s.winRate >= 0.35 && s.winRate <= 0.6 ? "PASS" : "FAIL"}
- Avg rounds ∈ [6, 12]: ${s.avgRounds >= 6 && s.avgRounds <= 12 ? "PASS" : "FAIL"}
- Avg slides ≥ 1: ${s.avgSlides >= 1 ? "PASS" : "FAIL"}
`;
    mkdirSync(dirname(reportFile), { recursive: true });
    writeFileSync(reportFile, md);
    console.log(`\nReport written to ${reportFile}`);
  }
}

const argv = process.argv.slice(2);
const hasFlag = (f: string) => argv.includes(f);
const flagVal = (f: string): string | undefined => {
  const i = argv.indexOf(f);
  return i >= 0 ? argv[i + 1] : undefined;
};

if (hasFlag("--verbose") || flagVal("--seed")) {
  const seed = parseInt(flagVal("--seed") ?? "1", 10);
  const r = playOne(seed, true);
  console.log("\n=== Result ===");
  console.log(JSON.stringify(r, null, 2));
} else if (hasFlag("--sweep")) {
  const spec = flagVal("--sweep");
  if (!spec) {
    console.error("--sweep requires KEY=v1,v2,v3 argument");
    process.exit(1);
  }
  const [key, valuesStr] = spec.split("=");
  if (!key || !valuesStr) {
    console.error(`bad --sweep format: ${spec}`);
    process.exit(1);
  }
  const values = valuesStr.split(",").map((v) => parseFloat(v));

  // Import the named `balance` mutable object — NOT the namespace.
  const balanceMod = await import("../src/game/balance");
  const balance = balanceMod.balance as Record<string, number>;

  const results: Array<{ value: number; winRate: number; avgRounds: number; avgSlides: number }> = [];
  for (const v of values) {
    balance[key] = v;
    const games: GameResult[] = [];
    for (let seed = 1; seed <= 500; seed++) {
      games.push(playOne(seed));
    }
    const s = summarize(games);
    results.push({ value: v, winRate: s.winRate, avgRounds: s.avgRounds, avgSlides: s.avgSlides });
  }
  console.log(`=== Mode B sweep: ${key} ===`);
  console.log(`${key.padEnd(34)}  win%   avgRounds  avgSlides`);
  for (const r of results) {
    console.log(`${String(r.value).padEnd(34)}  ${(r.winRate * 100).toFixed(1)}%  ${r.avgRounds.toFixed(2).padEnd(8)}  ${r.avgSlides.toFixed(2)}`);
  }
} else {
  const wantReport = hasFlag("--report");
  const reportFile = wantReport
    ? join(ROOT, "docs", "balance", `${new Date().toISOString().slice(0, 10)}-run.md`)
    : undefined;
  modeA(reportFile);
}
