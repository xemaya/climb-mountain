import { resolveTask } from "../game/cards";
import { climbScore } from "../game/rules";
import type { Action, GameState } from "../game/types";

function settleText(state: GameState): string {
  if (!state.currentCard || state.player.rolled.length === 0) return "先触碰命运";

  const score = climbScore(state.player.rolled);
  const advance = resolveTask(state.currentCard, score);
  if (advance === null) return `封印失败：坠 ${2} 格`;
  if (advance > 0) return `封印此刻：进 ${advance} 格`;
  if (advance < 0) return `封印失败：坠 ${Math.abs(advance)} 格`;
  return "封印此刻：稳住";
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

  const container = document.createElement("div");
  const hasRolledDice = state.player.rolled.length > 0;
  container.className = hasRolledDice ? "btn-group" : "btn-group single-action";

  if (!options.visible) {
    parent.className = "action-rail action-rail-hidden";
    parent.appendChild(container);
    return;
  }

  if (state.phase === "resolving" || options.rolling) {
    const btn = document.createElement("button");
    btn.className = "btn disabled pulse-yellow";
    btn.disabled = true;
    btn.innerHTML = `<span>${options.rolling ? "命运正在翻滚..." : "雪线正在吞吐..."}</span>`;
    container.appendChild(btn);
    parent.appendChild(container);
    return;
  }

  if (state.phase !== "await-select") {
    const btn = document.createElement("button");
    btn.className = "btn disabled";
    btn.disabled = true;
    btn.textContent = "等待当前动作完成";
    container.appendChild(btn);
    parent.appendChild(container);
    return;
  }

  const drawBtn = document.createElement("button");
  drawBtn.className = "btn primary pulse-green";
  drawBtn.disabled = state.player.handDice.length === 0 || options.rolling;
  drawBtn.innerHTML = state.player.handDice.length === 0
    ? "<span>骰袋枯竭</span>"
    : "<span>聆听深渊 🎲</span>";
  drawBtn.addEventListener("click", () => dispatch({ kind: "draw-die" }));
  container.appendChild(drawBtn);

  if (hasRolledDice) {
    const settleBtn = document.createElement("button");
    settleBtn.className = "btn danger pulse-red";
    settleBtn.disabled = options.rolling;
    settleBtn.innerHTML = `<span>${settleText(state)} ◈</span>`;
    settleBtn.addEventListener("click", () => dispatch({ kind: "commit" }));
    container.appendChild(settleBtn);
  }

  parent.appendChild(container);

}
