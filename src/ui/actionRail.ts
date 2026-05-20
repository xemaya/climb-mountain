import type { Action, GameState } from "../game/types";
import { selectedRerollIds, clearSelectedRerollIds } from "./dicePool";

export function renderActionRail(
  parent: HTMLElement,
  state: GameState,
  dispatch: (a: Action) => void,
): void {
  if (!parent) return;

  parent.innerHTML = "";
  parent.className = "action-rail";

  const container = document.createElement("div");
  container.className = "btn-group";

  // Calculate dice requirement limits
  const min = state.currentCard?.minDice === "ALL"
    ? state.player.handDice.length
    : (state.currentCard?.minDice ?? 0) as number;

  const currentSelectionCount = state.player.selected.length;

  if (state.phase === "resolving") {
    const btn = document.createElement("button");
    btn.className = "btn disabled pulse-yellow";
    btn.disabled = true;
    btn.innerHTML = "<span>⚙ 邪神结算中...</span>";
    container.appendChild(btn);
  }
  else if (state.phase === "await-select") {
    const btn = document.createElement("button");
    if (currentSelectionCount >= min) {
      btn.className = "btn primary pulse-green";
      btn.innerHTML = "<span>确认选择并掷骰 🎲</span>";
      btn.addEventListener("click", () => {
        dispatch({ kind: "select-dice", ids: state.player.selected });
      });
    } else {
      btn.className = "btn disabled";
      btn.disabled = true;
      btn.innerHTML = `<span>请选择骰子以开始挑战 (${currentSelectionCount}/${min}) 🎲</span>`;
    }
    container.appendChild(btn);
  }
  else if (state.phase === "await-roll") {
    const btn = document.createElement("button");
    btn.className = "btn primary pulse-green";
    btn.innerHTML = "<span>投掷开始挑战 🎲 (Roll)</span>";
    btn.addEventListener("click", () => dispatch({ kind: "roll" }));
    container.appendChild(btn);
  }
  else if (state.phase === "await-reroll") {
    const btn = document.createElement("button");
    if (selectedRerollIds.length > 0) {
      // If 1 or more dice are selected to reroll
      btn.className = "btn pulse-yellow";
      btn.innerHTML = `<span>确认重投已选 🔄 (Reroll, 剩 ${state.player.rerollsLeft} 次)</span>`;
      btn.addEventListener("click", () => {
        const idsToReroll = [...selectedRerollIds];
        clearSelectedRerollIds();
        dispatch({ kind: "reroll", ids: idsToReroll });
      });
    } else {
      // If 0 dice are selected, the button becomes "Settle"
      btn.className = "btn danger pulse-red";
      btn.innerHTML = "<span>锁定并结算投掷 ◈ (Settle)</span>";
      btn.addEventListener("click", () => {
        clearSelectedRerollIds();
        dispatch({ kind: "reroll", ids: [] });
      });
    }
    container.appendChild(btn);
  }
  else if (state.phase === "await-commit") {
    const btn = document.createElement("button");
    btn.className = "btn danger pulse-red";
    btn.innerHTML = "<span>结算本次投掷 ◈ (Commit)</span>";
    btn.addEventListener("click", () => dispatch({ kind: "commit" }));
    container.appendChild(btn);
  }

  parent.appendChild(container);
}

