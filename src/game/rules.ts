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

export function applyAction(state: GameState, action: Action): GameState {
  switch (action.kind) {
    case "start-game":
      return state;

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
      if (state.phase !== "await-commit") return state;
      const card = state.currentCard;
      if (!card) return state;
      const next = clone(state);

      // ===== C-phase: sanity check =====
      const madnessFaces = new Set<DieFace>();
      for (const d of next.player.rolled) {
        if (d.kind === "madness" && d.face !== null) madnessFaces.add(d.face);
      }
      const remaining: Die[] = [];
      for (const d of next.player.rolled) {
        const returnToHand =
          d.kind === "madness" ||
          (d.kind === "color" && d.face !== null && madnessFaces.has(d.face));
        if (returnToHand) {
          next.player.handDice.push({ ...d, face: null });
        } else {
          remaining.push(d);
        }
      }
      next.player.rolled = remaining;

      // ===== D-phase: move pawn =====
      const facesForResolve: DieFace[] = remaining
        .map((d) => d.face)
        .filter((f): f is DieFace => f !== null);

      const taskResult = resolveTask(card, facesForResolve);
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
        next.log.push({ round: next.round, text: `你滑落 ${balance.SLIDE_BACK_CELLS} 格${newMadness ? "、获得 1 颗疯狂骰" : ""}` });
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
        next.log.push({ round: next.round, text: `事件滑落 ${-taskResult} 格${newMadness ? "、获得 1 颗疯狂骰" : ""}` });
      } else {
        next.player.cell = next.player.cell + taskResult;
        next.log.push({ round: next.round, text: `你前进 ${taskResult} 格` });
      }

      // Move remaining rolled dice back to hand (face cleared)
      for (const d of remaining) {
        next.player.handDice.push({ ...d, face: null });
      }
      next.player.rolled = [];

      // ===== Demon advance =====
      const isEvent = card.type === "event";
      const advance = computeDemonAdvance({ slid, newMadness, isEvent });
      next.demon.cell = applyDemonAdvance(next.demon.cell, next.player.cell, advance);
      next.log.push({ round: next.round, text: `雪魔推进 +${advance}（基线 1${slid ? "、滑落 1" : ""}${newMadness ? "、新疯狂 1" : ""}${isEvent ? "、事件 2" : ""}）` });

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
      next.discard.push(card);
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
      return next;
    }

    case "advance-event-card": {
      if (state.phase !== "await-select") return state;
      const card = state.currentCard;
      if (!card || card.type !== "event") return state;
      const allIds = state.player.handDice.map((d) => d.id);
      const sSel = applyAction(state, { kind: "select-dice", ids: allIds });
      const sRoll = applyAction(sSel, { kind: "roll" });
      const sSkip = applyAction(sRoll, { kind: "reroll", ids: [] });
      const sCommit = applyAction(sSkip, { kind: "commit" });
      return sCommit;
    }
  }
}
