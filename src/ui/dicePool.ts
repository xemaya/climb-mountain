import { climbScore } from "../game/rules";
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
  options: { visible: boolean; rolling: boolean } = { visible: true, rolling: false },
): void {
  if (!parent) return;

  parent.innerHTML = "";
  parent.className = `dice-pool${options.visible ? "" : " dice-pool-hidden"}${options.rolling ? " is-rolling" : ""}`;

  if (!options.visible) {
    void state;
    void dispatch;
    return;
  }

  const score = climbScore(state.player.rolled);
  const colorRolled = state.player.rolled.filter((d) => d.kind === "color" && d.face !== null);
  const madnessRolled = state.player.rolled.filter((d) => d.kind === "madness" && d.face !== null);
  const colorTotal = colorRolled.reduce((sum, d) => sum + (d.face ?? 0), 0);
  const madnessTotal = madnessRolled.reduce((sum, d) => sum + (d.face ?? 0), 0);
  const bagCount = state.player.handDice.length;

  const scorePanel = document.createElement("div");
  scorePanel.className = "dice-score-panel";
  scorePanel.innerHTML = `
    <div class="dice-score-label">当前攀登值</div>
    <div class="dice-score-value">${score}</div>
    <div class="dice-score-formula">+${colorTotal} / -${madnessTotal}</div>
  `;
  parent.appendChild(scorePanel);

  const tray = document.createElement("div");
  tray.className = "dice-tray-container";

  const label = document.createElement("div");
  label.className = "dice-tray-label";
  label.textContent = options.rolling
    ? "命运骰正在翻滚..."
    : state.player.rolled.length > 0
    ? "本回合已掷出的骰子"
    : "从骰袋里抽出下一颗";
  tray.appendChild(label);

  const dice = document.createElement("div");
  dice.className = "dice-tray";
  if (options.rolling) {
    const rollingDie = document.createElement("div");
    rollingDie.className = "die rolling-die";
    rollingDie.textContent = "?";
    dice.appendChild(rollingDie);
  } else if (state.player.rolled.length === 0) {
    const empty = document.createElement("span");
    empty.style.color = "var(--text-muted)";
    empty.style.fontSize = "12px";
    empty.textContent = "还没有掷骰";
    dice.appendChild(empty);
  } else {
    for (const d of state.player.rolled) {
      dice.appendChild(dieElement(d));
    }
  }
  tray.appendChild(dice);
  parent.appendChild(tray);

  const bag = document.createElement("div");
  bag.className = "mini-dice-pack-container";
  const bagLabel = document.createElement("div");
  bagLabel.className = "mini-pack-label";
  bagLabel.textContent = "骰袋";
  bag.appendChild(bagLabel);

  const pack = document.createElement("div");
  pack.className = "mini-dice-pack";

  const countBadge = document.createElement("div");
  countBadge.className = "mini-die-badge color";
  countBadge.textContent = `${bagCount}`;
  pack.appendChild(countBadge);

  bag.appendChild(pack);
  parent.appendChild(bag);

  void dispatch;
}
