import type { Action, Die, GameState } from "../game/types";

export let selectedRerollIds: string[] = [];

export function clearSelectedRerollIds(): void {
  selectedRerollIds = [];
}

function dieElement(die: Die): HTMLElement {
  const el = document.createElement("div");
  const kindClass = die.kind === "madness" ? "negative" : "positive";
  el.className = `die ${kindClass}`;
  el.textContent = die.face !== null ? `${die.kind === "madness" ? "-" : "+"}${die.face}` : "·";
  el.title = die.kind === "madness" ? "负面点数：会扣除攀登值" : "正面点数：会加入攀登值";
  return el;
}

export function renderDicePool(
  parent: HTMLElement,
  state: GameState,
  dispatch: (a: Action) => void,
  options: { visible: boolean; rolling: boolean; flyUp?: boolean } = { visible: true, rolling: false },
): void {
  if (!parent) return;

  parent.innerHTML = "";
  parent.className = `dice-pool${options.visible ? "" : " dice-pool-hidden"}${options.rolling ? " is-rolling" : ""}${options.flyUp ? " dice-fly-up" : ""}`;

  if (!options.visible) {
    void state;
    void dispatch;
    return;
  }

  const tray = document.createElement("div");
  tray.className = "dice-tray-container";

  const label = document.createElement("div");
  label.className = "dice-tray-label";
  label.textContent = options.rolling ? "命运翻滚中" : options.flyUp ? "攀登值上升" : "命运落定";
  tray.appendChild(label);

  const dice = document.createElement("div");
  dice.className = "dice-tray";
  if (options.rolling) {
    const rollingDie = document.createElement("div");
    rollingDie.className = "die rolling-die";
    rollingDie.textContent = "?";
    dice.appendChild(rollingDie);
  } else {
    const last = state.player.rolled[state.player.rolled.length - 1];
    if (last) dice.appendChild(dieElement(last));
  }
  tray.appendChild(dice);
  parent.appendChild(tray);

  void dispatch;
}
