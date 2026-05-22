import { balance } from "./balance";
import { resolveTask } from "./cards";
import { applyDemonAdvance, computeDemonAdvance } from "./demon";
import { canUseItem, itemDefinition } from "./items";
import { getLevelConfig, isFinalLevel } from "./levels";
import { nextInt } from "./rng";
import { emptyRoundEffects, makeLevelDice } from "./state";
import type { Action, Die, DieFace, DieId, GameState, InventoryItem, ItemId } from "./types";

// Shallow clone helpers — keep state immutable in shape
function clonePlayer(p: GameState["player"]): GameState["player"] {
  return {
    ...p,
    handDice: p.handDice.map((d) => ({ ...d })),
    selected: [...p.selected],
    rolled: p.rolled.map((d) => ({ ...d })),
    items: p.items.map((item) => ({ ...item })),
  };
}

function clone(s: GameState): GameState {
  return {
    ...s,
    player: clonePlayer(s.player),
    demon: { ...s.demon },
    deck: [...s.deck],
    discard: [...s.discard],
    roundEffects: { ...s.roundEffects },
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

export function turnScore(state: GameState): number {
  return climbScore(state.player.rolled) + state.roundEffects.scoreBonus;
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
  next.roundEffects = emptyRoundEffects();
}

function drawFreshCard(next: GameState): void {
  if (next.deck.length === 0) {
    const reshuffled = [...next.discard];
    for (let i = reshuffled.length - 1; i > 0; i--) {
      const j = nextInt(next.rng, i + 1);
      [reshuffled[i], reshuffled[j]] = [reshuffled[j], reshuffled[i]];
    }
    next.deck = reshuffled;
    next.discard = [];
  }
  next.currentCard = next.deck.shift() ?? null;
}

function makeInventoryItem(state: GameState, id: ItemId): InventoryItem {
  return {
    uid: `${id}_${state.level}_${state.round}_${state.player.items.length}_${nextInt(state.rng, 100000)}`,
    id,
  };
}

function grantItem(next: GameState, id: ItemId): void {
  const item = makeInventoryItem(next, id);
  next.player.items.push(item);
  next.log.push({
    round: next.round,
    text: `事件挑战成功，获得道具「${itemDefinition(id).name}」`,
  });
}

function removeInventoryItem(next: GameState, uid: string): InventoryItem | null {
  const index = next.player.items.findIndex((item) => item.uid === uid);
  if (index < 0) return null;
  const [item] = next.player.items.splice(index, 1);
  return item ?? null;
}

function removeOneMadnessDie(next: GameState): boolean {
  const handIndex = next.player.handDice.findIndex((d) => d.kind === "madness");
  if (handIndex >= 0) {
    next.player.handDice.splice(handIndex, 1);
    next.madnessStock += 1;
    return true;
  }

  const rolledIndex = next.player.rolled.findIndex((d) => d.kind === "madness");
  if (rolledIndex >= 0) {
    next.player.rolled.splice(rolledIndex, 1);
    next.madnessStock += 1;
    return true;
  }

  return false;
}

function advanceToNextLevel(next: GameState): void {
  next.level += 1;
  const config = getLevelConfig(next.level);
  const levelDice = makeLevelDice(next.level);
  next.player = {
    ...next.player,
    cell: config.startPlayerCell,
    handDice: levelDice.handDice,
    selected: [],
    rolled: [],
    rerollsLeft: 0,
  };
  next.demon.cell = config.startDemonCell;
  next.madnessStock = levelDice.madnessStock;
  next.roundEffects = emptyRoundEffects();
  next.phase = "await-select";
  drawFreshCard(next);
  next.round += 1;
  next.log.push({
    round: next.round,
    text: `进入第 ${next.level} 关：${config.name}`,
  });
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
      next.player.rolled = [...next.player.rolled, ...movedToRolled];
      next.player.selected = [];
      next.player.rerollsLeft = balance.MAX_REROLLS;
      next.phase = "await-reroll";
      return next;
    }

    case "reroll": {
      if (state.phase !== "await-reroll") return state;
      const next = clone(state);
      if (action.ids.length === 0) {
        next.phase = "await-commit";
        return next;
      }
      const rerollSet = new Set<DieId>(action.ids);
      for (const d of next.player.rolled) {
        if (rerollSet.has(d.id)) d.face = rollFace(next);
      }
      next.player.rerollsLeft = next.player.rerollsLeft - 1;
      if (next.player.rerollsLeft <= 0) {
        next.phase = "await-commit";
      }
      return next;
    }

    case "use-item": {
      const item = state.player.items.find((entry) => entry.uid === action.uid);
      if (!item || !canUseItem(state, item.id)) return state;

      const next = clone(state);
      const used = removeInventoryItem(next, action.uid);
      if (!used) return state;

      const name = itemDefinition(used.id).name;
      switch (used.id) {
        case "rope-anchor":
          next.roundEffects.preventSlide = true;
          next.log.push({ round: next.round, text: `使用「${name}」：本轮失败不会滑落或新增疯狂` });
          break;
        case "frost-ember":
          next.roundEffects.scoreBonus += 3;
          next.log.push({ round: next.round, text: `使用「${name}」：本轮攀登值 +3` });
          break;
        case "black-seal":
          next.roundEffects.demonAdvanceDelta -= 1;
          next.log.push({ round: next.round, text: `使用「${name}」：本轮雪魔推进 -1` });
          break;
        case "bone-piton":
          next.roundEffects.extraAdvance += 1;
          next.log.push({ round: next.round, text: `使用「${name}」：本轮成功额外前进 1 格` });
          break;
        case "salt-needle":
          if (!removeOneMadnessDie(next)) return state;
          next.log.push({ round: next.round, text: `使用「${name}」：净化 1 颗疯狂骰` });
          break;
      }

      return next;
    }

    case "commit": {
      if (state.phase !== "await-select" && state.phase !== "await-commit") return state;
      const card = state.currentCard;
      if (!card) return state;
      if (state.player.rolled.length === 0) return state;
      const next = clone(state);

      const config = getLevelConfig(next.level);
      const score = turnScore(next);
      const facesForResolve: DieFace[] = next.player.rolled
        .map((d) => d.face)
        .filter((f): f is DieFace => f !== null);

      const taskResult = resolveTask(card, score, facesForResolve);
      let slid = false;
      let newMadness = false;

      if (taskResult === null) {
        if (next.roundEffects.preventSlide) {
          next.log.push({ round: next.round, text: `攀登值 ${score} 未达标，锚定绳固定住了你` });
        } else {
          const newCell = Math.max(1, next.player.cell - config.slideBackCells);
          next.player.cell = newCell;
          slid = true;
        }
        if (!next.roundEffects.preventSlide && next.madnessStock > 0) {
          const newMadId = `m_drawn_r${next.round}_${next.madnessStock}`;
          next.player.handDice.push({ id: newMadId, kind: "madness", face: null });
          next.madnessStock -= 1;
          newMadness = true;
        }
        if (!next.roundEffects.preventSlide) {
          next.log.push({ round: next.round, text: `攀登值 ${score} 未达标，你滑落 ${config.slideBackCells} 格${newMadness ? "、获得 1 颗疯狂骰" : ""}` });
        }
      } else if (taskResult < 0) {
        if (next.roundEffects.preventSlide) {
          next.log.push({ round: next.round, text: `攀登值 ${score} 触发滑落，锚定绳固定住了你` });
        } else {
          const newCell = Math.max(1, next.player.cell + taskResult);
          next.player.cell = newCell;
          slid = true;
        }
        if (!next.roundEffects.preventSlide && next.madnessStock > 0) {
          const newMadId = `m_drawn_r${next.round}_${next.madnessStock}`;
          next.player.handDice.push({ id: newMadId, kind: "madness", face: null });
          next.madnessStock -= 1;
          newMadness = true;
        }
        if (!next.roundEffects.preventSlide) {
          next.log.push({ round: next.round, text: `攀登值 ${score} 触发事件滑落 ${-taskResult} 格${newMadness ? "、获得 1 颗疯狂骰" : ""}` });
        }
      } else {
        const advance = taskResult + next.roundEffects.extraAdvance;
        next.player.cell = Math.min(balance.GOAL_CELL, next.player.cell + advance);
        next.log.push({ round: next.round, text: `攀登值 ${score}，你前进 ${advance} 格${next.roundEffects.extraAdvance > 0 ? "（道具 +1）" : ""}` });
        if (card.type === "event" && card.itemReward) {
          grantItem(next, card.itemReward);
        }
      }

      // Return rolled dice to the bag, face cleared. New madness from failure stays too.
      next.player.handDice.push(...cleanRolled(next.player.rolled));
      next.player.rolled = [];

      // ===== Demon advance =====
      const isEvent = card.type === "event";
      const advance = Math.max(0, computeDemonAdvance({ slid, newMadness, isEvent }, config) + next.roundEffects.demonAdvanceDelta);
      next.demon.cell = applyDemonAdvance(next.demon.cell, next.player.cell, advance);
      next.log.push({
        round: next.round,
        text: `雪魔推进 +${advance}（基线 ${config.demonBaseline}${slid ? `、滑落 ${config.demonSlideBonus}` : ""}${newMadness && config.demonNewMadnessBonus > 0 ? `、新疯狂 ${config.demonNewMadnessBonus}` : ""}${isEvent ? `、事件 ${config.demonEventBonus}` : ""}${next.roundEffects.demonAdvanceDelta < 0 ? "、封印 -1" : ""}）`,
      });

      // ===== Win/Lose check (LOSE wins tiebreak) =====
      if (next.demon.cell >= next.player.cell) {
        next.phase = "lost";
        return next;
      }
      if (next.player.cell >= balance.GOAL_CELL) {
        if (!isFinalLevel(next.level)) {
          // Hold at the summit so the climb animation and "level cleared" feedback can
          // play; the next-level action performs the actual reset/advance.
          next.phase = "level-cleared";
          next.log.push({ round: next.round, text: `第 ${next.level} 关登顶！` });
          return next;
        }
        next.phase = "won";
        return next;
      }

      // ===== Draw next card =====
      drawNextCard(next, card);
      return next;
    }

    case "next-level": {
      if (state.phase !== "level-cleared") return state;
      const next = clone(state);
      advanceToNextLevel(next);
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
