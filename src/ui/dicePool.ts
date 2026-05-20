import type { Action, Die, GameState } from "../game/types";
import { renderActionRail } from "./actionRail";

// Track the last round we auto-preselected color dice to prevent infinite preselection loops on manual clear
let lastPreselectedRound = 0;
let lastPhase = "";

export let selectedRerollIds: string[] = [];

export function clearSelectedRerollIds(): void {
  selectedRerollIds = [];
}

function dieElement(
  die: Die,
  selected: boolean,
  polluted: boolean,
  isRerollSelected: boolean,
  onClick?: () => void,
): HTMLElement {
  const el = document.createElement("div");
  
  let stateClass = "normal";
  if (die.kind === "madness") {
    stateClass = "madness";
  }
  if (selected) {
    stateClass = "selected";
  }
  if (polluted) {
    stateClass = "polluted";
  }
  if (isRerollSelected) {
    stateClass = "reroll-selected";
  }
  
  el.className = `die ${stateClass}`;
  el.textContent = die.face !== null ? String(die.face) : "·";
  
  if (onClick) {
    el.addEventListener("click", onClick);
  }
  
  return el;
}

export function renderDicePool(
  parent: HTMLElement,
  state: GameState,
  dispatch: (a: Action) => void,
): void {
  if (!parent) return;

  // Reset selected reroll dice if we transition away from reroll phase
  if (state.phase !== lastPhase) {
    if (state.phase !== "await-reroll") {
      selectedRerollIds = [];
    }
    lastPhase = state.phase;
  }

  // ===== 1. Zero-Clumsy Auto Pre-selection Logic =====
  if (state.phase === "await-select" && lastPreselectedRound !== state.round) {
    const allColorIds = state.player.handDice.filter(d => d.kind === "color").map(d => d.id);
    lastPreselectedRound = state.round;
    if (allColorIds.length > 0) {
      setTimeout(() => dispatch({ kind: "select-dice", ids: allColorIds }), 0);
      return; // Skip current render pass since state is immediately updating
    }
  }

  // Clear tracking if player resets to home
  if (state.round === 1 && state.phase === "await-select" && state.player.selected.length === 0) {
    lastPreselectedRound = 0;
  }

  parent.innerHTML = "";
  parent.className = "dice-pool";

  // Compute pollution flags proactively
  const rolledMadnessFaces = new Set<number>();
  for (const d of state.player.rolled) {
    if (d.kind === "madness" && d.face !== null) {
      rolledMadnessFaces.add(d.face);
    }
  }

  // ===== Dynamic Progressive Content based on state.phase =====
  if (state.phase === "await-select" || state.phase === "await-roll") {
    // 2. Select/Roll Phase: Render selected dice package in miniature
    const container = document.createElement("div");
    container.className = "mini-dice-pack-container";

    const label = document.createElement("div");
    label.className = "mini-pack-label";
    label.textContent = "待投掷骰包：";
    container.appendChild(label);

    const pack = document.createElement("div");
    pack.className = "mini-dice-pack";

    for (const id of state.player.selected) {
      const d = state.player.handDice.find((x) => x.id === id);
      if (!d) continue;
      
      const badge = document.createElement("div");
      badge.className = `mini-die-badge ${d.kind}`;
      badge.textContent = d.kind === "madness" ? "紫" : "石";
      pack.appendChild(badge);
    }

    if (state.player.selected.length === 0) {
      const empty = document.createElement("span");
      empty.style.color = "var(--text-muted)";
      empty.style.fontSize = "11px";
      empty.textContent = "空骰包，请选择骰子";
      pack.appendChild(empty);
    }

    container.appendChild(pack);
    parent.appendChild(container);

    // 3. Madness gambling toggle button
    const madnessInHand = state.player.handDice.filter((d) => d.kind === "madness");
    if (madnessInHand.length > 0) {
      const selectedMadness = state.player.selected.filter(id => {
        const d = state.player.handDice.find(x => x.id === id);
        return d && d.kind === "madness";
      });
      const isGabling = selectedMadness.length > 0;

      const gambleBtn = document.createElement("button");
      gambleBtn.className = "gamble-toggle-btn" + (isGabling ? " active" : "");
      gambleBtn.innerHTML = isGabling 
        ? `🔮 疯狂已注入 (+${selectedMadness.length} 骰)` 
        : `🎲 赌一把！注入疯狂 (${madnessInHand.length} 颗可用)`;
      
      gambleBtn.addEventListener("click", () => {
        const colorIds = state.player.handDice.filter(d => d.kind === "color").map(d => d.id);
        const madnessIds = madnessInHand.map(d => d.id);
        if (isGabling) {
          // Unselect madness dice, keep only color
          dispatch({ kind: "select-dice", ids: colorIds });
        } else {
          // Select both color and madness dice!
          dispatch({ kind: "select-dice", ids: [...colorIds, ...madnessIds] });
        }
      });
      parent.appendChild(gambleBtn);
    }
  } 
  else if (state.phase === "await-reroll" || state.phase === "await-commit" || state.phase === "resolving") {
    // 4. Reroll/Commit/Resolving Phase: Show rolled dice in Dice Cup
    const container = document.createElement("div");
    container.className = "dice-tray-container";

    const label = document.createElement("div");
    label.className = "dice-tray-label";
    label.textContent = state.phase === "await-reroll" 
      ? "点击骰子以重投 (重投将共同结算) ：" 
      : (state.phase === "resolving" ? "理智检测与格数计算中..." : "骰股已锁定，准备结算");
    container.appendChild(label);

    const tray = document.createElement("div");
    tray.className = "dice-tray";

    for (const d of state.player.rolled) {
      const isDeathZone = state.player.cell >= 7;
      const isPolluted =
        d.kind === "color" &&
        d.face !== null &&
        (rolledMadnessFaces.has(d.face) || (d.face === 6 && isDeathZone));

      const isRerollSel = selectedRerollIds.includes(d.id);

      if (state.phase === "await-reroll") {
        tray.appendChild(
          dieElement(d, false, isPolluted, isRerollSel, () => {
            const idx = selectedRerollIds.indexOf(d.id);
            if (idx >= 0) {
              selectedRerollIds.splice(idx, 1);
            } else {
              selectedRerollIds.push(d.id);
            }
            // Trigger in-place instant redrawing of dice tray and action button
            renderDicePool(parent, state, dispatch);
            const actionRailParent = document.getElementById("action-rail");
            if (actionRailParent) {
              renderActionRail(actionRailParent, state, dispatch);
            }
          }),
        );
      } else {
        tray.appendChild(dieElement(d, false, isPolluted, false));
      }
    }
    
    container.appendChild(tray);
    parent.appendChild(container);
  }
}
