import { resolveTask } from "../game/cards";
import { canUseItem, itemDefinition } from "../game/items";
import { getLevelConfig } from "../game/levels";
import { turnScore } from "../game/rules";
import type { Action, GameState } from "../game/types";

function settleText(state: GameState): string {
  if (!state.currentCard || state.player.rolled.length === 0) return "先触碰命运";

  const score = turnScore(state);
  const advance = resolveTask(state.currentCard, score);
  if (advance === null) return state.roundEffects.preventSlide ? "锚住" : `退 ${getLevelConfig(state.level).slideBackCells} 格`;
  if (advance > 0) return `进 ${advance + state.roundEffects.extraAdvance} 格`;
  if (advance < 0) return `退 ${Math.abs(advance)} 格`;
  return "稳住当前";
}

export function renderActionRail(
  parent: HTMLElement,
  state: GameState,
  dispatch: (a: Action) => void,
  options: { visible: boolean; rolling: boolean } = { visible: true, rolling: false },
): void {
  if (!parent) return;

  parent.innerHTML = "";
  parent.className = "action-rail";

  const hasRolledDice = state.player.rolled.length > 0;

  if (!options.visible) {
    parent.className = "action-rail action-rail-hidden";
    return;
  }

  const renderAltar = (mode: "ready" | "rolling" | "waiting"): void => {
    const altar = document.createElement("div");
    altar.className = `ritual-altar mode-${mode}`;

    const drawBtn = document.createElement("button");
    drawBtn.className = "ritual-panel listen-panel";
    drawBtn.disabled = mode !== "ready" || state.player.handDice.length === 0;
    drawBtn.innerHTML = `
      <span class="ritual-icon">◈</span>
      <strong>${state.player.handDice.length === 0 ? "骰袋枯竭" : "聆听祂声"}</strong>
      <small>${mode === "rolling" ? "命运翻滚中" : "ROLL THE DICE"}</small>
    `;
    drawBtn.addEventListener("click", () => dispatch({ kind: "draw-die" }));
    altar.appendChild(drawBtn);

    const score = turnScore(state);
    const scoreOrb = document.createElement("div");
    scoreOrb.className = "ritual-score-orb";
    scoreOrb.innerHTML = `
      <span>攀登值</span>
      <strong>${score}</strong>
      <small>${state.player.rolled.length > 0 ? "CURRENT RITUAL" : "AWAITING DICE"}</small>
    `;
    altar.appendChild(scoreOrb);

    const settleBtn = document.createElement("button");
    const advance = state.currentCard ? resolveTask(state.currentCard, score) : null;
    const isFailure = advance === null || advance < 0;
    settleBtn.className = `ritual-panel end-panel${isFailure ? " danger" : " success"}`;
    settleBtn.disabled = mode !== "ready" || !hasRolledDice;
    const settleLabel = hasRolledDice
      ? (isFailure ? "结束仪式" : "封印此刻")
      : "结束仪式";
    settleBtn.innerHTML = `
      <span class="ritual-icon">${isFailure ? "⌛" : "✦"}</span>
      <strong>${settleLabel}</strong>
      <small>${settleText(state)}</small>
    `;
    settleBtn.addEventListener("click", () => dispatch({ kind: "commit" }));
    altar.appendChild(settleBtn);

    parent.appendChild(altar);
  };

  // 1. Loading/Resolving states
  if (state.phase === "resolving" || options.rolling) {
    renderAltar("rolling");
    return;
  }

  // 2. Waiting phase states
  if (state.phase !== "await-select") {
    renderAltar("waiting");
    return;
  }

  if (state.player.items.length > 0) {
    const itemRail = document.createElement("div");
    itemRail.className = "item-context-rail";
    for (const item of state.player.items) {
      const def = itemDefinition(item.id);
      const btn = document.createElement("button");
      btn.className = "item-chip";
      btn.textContent = def.shortName;
      btn.title = def.description;
      btn.disabled = !canUseItem(state, item.id);
      btn.addEventListener("click", () => dispatch({ kind: "use-item", uid: item.uid }));
      itemRail.appendChild(btn);
    }
    parent.appendChild(itemRail);
  }

  renderAltar("ready");
}
