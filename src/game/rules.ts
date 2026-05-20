import { balance } from "./balance";
import { resolveTask } from "./cards";
import { applyDemonAdvance, computeDemonAdvance } from "./demon";
import { nextInt } from "./rng";
import type { Action, Die, DieFace, DieId, GameState } from "./types";

// Shallow clone helpers — keep state immutable in shape
function clonePlayer(p: GameState["player"]): GameState["player"] {
  return {
    ...p,
    handDice: p.handDice.map((d) => ({ ...d })),
    selected: [...p.selected],
    rolled: p.rolled.map((d) => ({ ...d })),
  };
}

function clone(s: GameState): GameState {
  return {
    ...s,
    player: clonePlayer(s.player),
    demon: { ...s.demon },
    deck: [...s.deck],
    discard: [...s.discard],
    log: [...s.log],
    rng: { ...s.rng },
  };
}

function rollFace(s: GameState): DieFace {
  return (nextInt(s.rng, 6) + 1) as DieFace;
}

export function climbScore(dice: Die[]): number {
  return dice.reduce((total, d) => {
    if (d.face === null) return total;
    return total + (d.kind === "madness" ? -d.face : d.face);
  }, 0);
}

function cleanRolled(dice: Die[]): Die[] {
  return dice.map((d) => ({ ...d, face: null }));
}

function drawNextCard(next: GameState, currentCard: NonNullable<GameState["currentCard"]>): void {
  next.discard.push(currentCard);
  if (next.deck.length === 0) {
    const reshuffled = [...next.discard];
    for (let i = reshuffled.length - 1; i > 0; i--) {
      const j = nextInt(next.rng, i + 1);
      [reshuffled[i], reshuffled[j]] = [reshuffled[j], reshuffled[i]];
    }
    next.deck = reshuffled;
    next.discard = [];
    next.log.push({ round: next.round, text: `难度牌组洗回` });
  }
  next.currentCard = next.deck.shift()!;
  next.round += 1;
  next.phase = "await-select";
  next.player.selected = [];
  next.player.rerollsLeft = 0;
}

export function applyAction(state: GameState, action: Action): GameState {
  switch (action.kind) {
    case "start-game":
      return state;

    case "draw-die": {
      if (state.phase !== "await-select") return state;
      if (!state.currentCard || state.player.handDice.length === 0) return state;

      const next = clone(state);
      const index = nextInt(next.rng, next.player.handDice.length);
      const [die] = next.player.handDice.splice(index, 1);
      next.player.rolled.push({ ...die, face: rollFace(next) });
      next.log.push({
        round: next.round,
        text: `你掷出 1 颗${die.kind === "madness" ? "疯狂骰" : "普通骰"}`,
      });
      return next;
    }

    case "select-dice": {
      if (state.phase !== "await-select") return state;
      const card = state.currentCard;
      if (!card) return state;
      if (card.minDice !== "ALL") {
        const min = card.minDice;
        if (action.ids.length < min) return state;
      }
      const handIds = new Set(state.player.handDice.map((d) => d.id));
      for (const id of action.ids) {
        if (!handIds.has(id)) return state;
      }
      const next = clone(state);
      next.player.selected = [...action.ids];
      next.phase = "await-roll";
      return next;
    }

    case "roll": {
      if (state.phase !== "await-roll") return state;
      const next = clone(state);
      const selectedSet = new Set(state.player.selected);
      const movedToRolled: Die[] = [];
      next.player.handDice = next.player.handDice.filter((d) => {
        if (selectedSet.has(d.id)) {
          movedToRolled.push({ ...d, face: rollFace(next) });
          return false;
        }
        return true;
      });
      next.player.rolled = movedToRolled;
      next.player.selected = [];
      next.player.rerollsLeft = balance.MAX_REROLLS;
      next.phase = "await-reroll";
      return next;
    }

    case "reroll": {
      if (state.phase !== "await-reroll") return state;
      const next = clone(state);
      const rerollSet = new Set<DieId>(action.ids);
      for (const d of next.player.rolled) {
        if (rerollSet.has(d.id)) d.face = rollFace(next);
      }
      next.player.rerollsLeft = next.player.rerollsLeft - 1;
      if (next.player.rerollsLeft <= 0 || action.ids.length === 0) {
        next.phase = "await-commit";
      }
      return next;
    }

    case "commit": {
      if (state.phase !== "await-select" && state.phase !== "await-commit") return state;
      const card = state.currentCard;
      if (!card) return state;
      if (state.player.rolled.length === 0) return state;
      const next = clone(state);

      const score = climbScore(next.player.rolled);
      const facesForResolve: DieFace[] = next.player.rolled
        .map((d) => d.face)
        .filter((f): f is DieFace => f !== null);

      const taskResult = resolveTask(card, score, facesForResolve);
      let slid = false;
      let newMadness = false;

      if (taskResult === null) {
        const newCell = Math.max(1, next.player.cell - balance.SLIDE_BACK_CELLS);
        next.player.cell = newCell;
        slid = true;
        if (next.madnessStock > 0) {
          const newMadId = `m_drawn_r${next.round}_${next.madnessStock}`;
          next.player.handDice.push({ id: newMadId, kind: "madness", face: null });
          next.madnessStock -= 1;
          newMadness = true;
        }
        next.log.push({ round: next.round, text: `攀登值 ${score} 未达标，你滑落 ${balance.SLIDE_BACK_CELLS} 格${newMadness ? "、获得 1 颗疯狂骰" : ""}` });
      } else if (taskResult < 0) {
        const newCell = Math.max(1, next.player.cell + taskResult);
        next.player.cell = newCell;
        slid = true;
        if (next.madnessStock > 0) {
          const newMadId = `m_drawn_r${next.round}_${next.madnessStock}`;
          next.player.handDice.push({ id: newMadId, kind: "madness", face: null });
          next.madnessStock -= 1;
          newMadness = true;
        }
        next.log.push({ round: next.round, text: `攀登值 ${score} 触发事件滑落 ${-taskResult} 格${newMadness ? "、获得 1 颗疯狂骰" : ""}` });
      } else {
        next.player.cell = next.player.cell + taskResult;
        next.log.push({ round: next.round, text: `攀登值 ${score}，你前进 ${taskResult} 格` });
      }

      // Return rolled dice to the bag, face cleared. New madness from failure stays too.
      next.player.handDice.push(...cleanRolled(next.player.rolled));
      next.player.rolled = [];

      // ===== Demon advance =====
      const isEvent = card.type === "event";
      const advance = computeDemonAdvance({ slid, newMadness, isEvent });
      next.demon.cell = applyDemonAdvance(next.demon.cell, next.player.cell, advance);
      next.log.push({
        round: next.round,
        text: `雪魔推进 +${advance}（基线 1${slid ? "、滑落 1" : ""}${newMadness && balance.DEMON_BONUS_ON_NEW_MADNESS > 0 ? `、新疯狂 ${balance.DEMON_BONUS_ON_NEW_MADNESS}` : ""}${isEvent ? "、事件 1" : ""}）`,
      });

      // ===== Win/Lose check (LOSE wins tiebreak) =====
      if (next.demon.cell >= next.player.cell) {
        next.phase = "lost";
        return next;
      }
      if (next.player.cell >= balance.GOAL_CELL) {
        next.phase = "won";
        return next;
      }

      // ===== Draw next card =====
      drawNextCard(next, card);
      return next;
    }

    case "advance-event-card": {
      if (state.phase !== "await-select") return state;
      const card = state.currentCard;
      if (!card || card.type !== "event") return state;
      let next = state;
      while (next.phase === "await-select" && next.player.handDice.length > 0) {
        next = applyAction(next, { kind: "draw-die" });
      }
      return applyAction(next, { kind: "commit" });
    }
  }
}
