import { resolveTask } from "../game/cards";
import { climbScore } from "../game/rules";
import type { Action, GameState } from "../game/types";

function settleText(state: GameState): string {
  if (!state.currentCard || state.player.rolled.length === 0) return "先触碰命运";

  const score = climbScore(state.player.rolled);
  const advance = resolveTask(state.currentCard, score);
  if (advance === null) return "退 2 格";
  if (advance > 0) return `进 ${advance} 格`;
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

  const container = document.createElement("div");
  const hasRolledDice = state.player.rolled.length > 0;
  container.className = hasRolledDice ? "btn-group" : "btn-group single-action";

  if (!options.visible) {
    parent.className = "action-rail action-rail-hidden";
    parent.appendChild(container);
    return;
  }

  // 1. Loading/Resolving states
  if (state.phase === "resolving" || options.rolling) {
    const wrapper = document.createElement("div");
    wrapper.className = "action-btn-wrapper";

    const btn = document.createElement("button");
    btn.className = "btn disabled listen-deity-btn pulse-blue";
    btn.disabled = true;
    wrapper.appendChild(btn);

    const label = document.createElement("div");
    label.className = "action-btn-label loading";
    label.textContent = options.rolling ? "命运翻滚中" : "结算仪式中";
    wrapper.appendChild(label);

    container.appendChild(wrapper);
    parent.appendChild(container);
    return;
  }

  // 2. Waiting phase states
  if (state.phase !== "await-select") {
    const wrapper = document.createElement("div");
    wrapper.className = "action-btn-wrapper";

    const btn = document.createElement("button");
    btn.className = "btn disabled listen-deity-btn";
    btn.disabled = true;
    wrapper.appendChild(btn);

    const label = document.createElement("div");
    label.className = "action-btn-label";
    label.textContent = "等待仪式开端";
    wrapper.appendChild(label);

    container.appendChild(wrapper);
    parent.appendChild(container);
    return;
  }

  // 3. Draw Button wrapper (Left button)
  const drawWrapper = document.createElement("div");
  drawWrapper.className = "action-btn-wrapper";

  const drawBtn = document.createElement("button");
  if (state.player.handDice.length === 0) {
    drawBtn.className = "btn primary disabled listen-deity-btn";
    drawBtn.disabled = true;
  } else {
    drawBtn.className = "btn primary listen-deity-btn";
    drawBtn.disabled = options.rolling;
  }
  drawBtn.addEventListener("click", () => dispatch({ kind: "draw-die" }));
  drawWrapper.appendChild(drawBtn);

  const drawLabel = document.createElement("div");
  drawLabel.className = "action-btn-label";
  drawLabel.textContent = state.player.handDice.length === 0 ? "骰袋枯竭" : "聆听祂声";
  drawWrapper.appendChild(drawLabel);

  container.appendChild(drawWrapper);

  // 4. Settle Button wrapper (Right button - visible only after rolling)
  if (hasRolledDice) {
    const settleWrapper = document.createElement("div");
    settleWrapper.className = "action-btn-wrapper";

    const settleBtn = document.createElement("button");
    const score = climbScore(state.player.rolled);
    const advance = state.currentCard ? resolveTask(state.currentCard, score) : null;
    const isFailure = advance === null || advance < 0;

    if (isFailure) {
      settleBtn.className = "btn danger backfire-btn";
    } else {
      // Both use circular buttons, but success state has success-seal-btn (green hue rotated in CSS)
      settleBtn.className = "btn success backfire-btn success-seal-btn";
    }
    settleBtn.disabled = options.rolling;
    settleBtn.addEventListener("click", () => dispatch({ kind: "commit" }));
    settleWrapper.appendChild(settleBtn);

    const settleLabel = document.createElement("div");
    settleLabel.className = "action-btn-label";
    
    // Label text dynamically reflects the outcome
    const textPrefix = isFailure ? "仪式反噬:" : "封印此刻:";
    settleLabel.textContent = `${textPrefix} ${settleText(state)}`;
    settleWrapper.appendChild(settleLabel);

    container.appendChild(settleWrapper);
  }

  parent.appendChild(container);
}
