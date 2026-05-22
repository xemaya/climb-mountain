import type { GameState } from "../game/types";
import { balance } from "../game/balance";
import { itemDefinition } from "../game/items";
import { conditionText } from "../game/cards";
import { openRulesModal } from "./rulesModal";

let cellsRendered = false;
let playerPawn: HTMLElement | null = null;
let demonPawn: HTMLElement | null = null;
let eventMarker: HTMLButtonElement | null = null;

// Serpentine summit path: wide left-right swing so the trail reads as a winding climb,
// not a packed vertical column. Goal is recentred at the top.
const coords: Record<number, { left: number; bottom: number }> = {
  0:  { left: 50, bottom: 15 },
  1:  { left: 36, bottom: 21 },
  2:  { left: 64, bottom: 27 },
  3:  { left: 35, bottom: 33 },
  4:  { left: 65, bottom: 39 },
  5:  { left: 35, bottom: 45 },
  6:  { left: 65, bottom: 51 },
  7:  { left: 35, bottom: 57 }, // Death Zone starts
  8:  { left: 65, bottom: 63 },
  9:  { left: 36, bottom: 69 },
  10: { left: 64, bottom: 74 },
  11: { left: 40, bottom: 80 },
  12: { left: 60, bottom: 85 },
  13: { left: 47, bottom: 89 },
  14: { left: 50, bottom: 92 }, // GOAL
};

export function renderBoard(parent: HTMLElement, state: GameState): void {
  if (!parent) return;

  if (parent.className !== "board") {
    parent.className = "board";
  }

  if (!cellsRendered) {
    parent.innerHTML = "";

    // 1. Render the Death Zone alert text (§05)
    const alert = document.createElement("div");
    alert.className = "board-death-alert";
    alert.innerHTML = "<strong>DEATH ZONE</strong><span>死亡区域，6点禁用</span>";
    parent.appendChild(alert);

    const lorePanel = document.createElement("button");
    lorePanel.className = "board-side-panel lore-panel";
    lorePanel.innerHTML = "<strong>LORE</strong><span>日志</span><small>点击查看</small>";
    lorePanel.addEventListener("click", () => {
      const overlay = document.getElementById("event-log-overlay");
      if (overlay) {
        document.querySelectorAll(".overlay-modal-container").forEach((el) => {
          (el as HTMLElement).style.display = "none";
        });
        overlay.style.display = "flex";
      }
    });
    parent.appendChild(lorePanel);

    const omenPanel = document.createElement("div");
    omenPanel.className = "board-side-panel omen-panel";
    omenPanel.innerHTML = "<strong>BLIZZARD</strong><span>-1</span><small>TO NEXT ROLL</small>";
    parent.appendChild(omenPanel);

    eventMarker = document.createElement("button");
    eventMarker.className = "board-event-marker";
    eventMarker.addEventListener("click", () => {
      document.dispatchEvent(new CustomEvent("open-card-modal"));
    });
    parent.appendChild(eventMarker);

    // 1.5. Render Event Log floating trigger (📜)
    const logTrigger = document.createElement("div");
    logTrigger.className = "floating-log-trigger";
    logTrigger.innerHTML = "📜";
    logTrigger.title = "查看危机历史";
    logTrigger.addEventListener("click", () => {
      const overlay = document.getElementById("event-log-overlay");
      if (overlay) {
        const isHidden = overlay.style.display === "none";
        document.querySelectorAll(".overlay-modal-container").forEach((el) => {
          (el as HTMLElement).style.display = "none";
        });
        if (isHidden) {
          overlay.style.display = "flex";
          overlay.onclick = (e) => {
            if (e.target === overlay) {
              overlay.style.display = "none";
            }
          };
        }
      }
    });
    parent.appendChild(logTrigger);

    // 1.6. Render Rules floating trigger (📖)
    const rulesTrigger = document.createElement("div");
    rulesTrigger.className = "floating-log-trigger";
    rulesTrigger.style.right = "auto";
    rulesTrigger.style.left = "var(--s-16)";
    rulesTrigger.innerHTML = "📖";
    rulesTrigger.title = "查看游戏规则";
    rulesTrigger.addEventListener("click", () => {
      openRulesModal();
    });
    parent.appendChild(rulesTrigger);

    // 2. Render serpentine step nodes from 0 up to GOAL (14)
    const goalCell = balance.GOAL_CELL;
    for (let cell = 0; cell <= goalCell; cell++) {
      const coord = coords[cell] || { left: 50, bottom: cell * 6 };
      
      const node = document.createElement("div");
      const isGoal = cell === goalCell;
      const isDeath = cell >= 7 && !isGoal;
      
      node.className = "step-node" + (isGoal ? " goal" : "") + (isDeath ? " death-zone" : "");
      node.dataset.cell = String(cell);
      
      // Position node in percentages
      node.style.left = `${coord.left}%`;
      node.style.bottom = `${coord.bottom}%`;
      
      node.textContent = isGoal ? "GOAL" : String(cell);
      
      parent.appendChild(node);
    }

    // 3. Create Player Pawn (Climber)
    playerPawn = document.createElement("div");
    playerPawn.className = "pawn-token player";
    
    const playerImg = document.createElement("img");
    playerImg.src = "/src/assets/climber.png";
    playerImg.alt = "Climber";
    playerPawn.appendChild(playerImg);
    
    parent.appendChild(playerPawn);

    // 4. Create Demon Pawn (Snow Demon)
    demonPawn = document.createElement("div");
    demonPawn.className = "pawn-token demon";
    
    const demonImg = document.createElement("img");
    demonImg.src = "/src/assets/snow_demon.png";
    demonImg.alt = "Snow Demon";
    demonPawn.appendChild(demonImg);
    
    parent.appendChild(demonPawn);

    cellsRendered = true;
  }

  // 5. Update pawn positions based on state cell index
  const pCell = state.player.cell;
  const dCell = state.demon.cell;

  const pCoord = coords[pCell] || { left: 50, bottom: pCell * 6 };
  const dCoord = coords[dCell] || { left: 50, bottom: dCell * 6 };

  // Offset logic to prevent overlap if standing on identical cells
  let pOffsetLeft = 0;
  let dOffsetLeft = 0;
  if (pCell === dCell) {
    pOffsetLeft = -14;
    dOffsetLeft = 14;
  }

  if (playerPawn) {
    playerPawn.style.left = `calc(${pCoord.left}% + ${pOffsetLeft}px)`;
    playerPawn.style.bottom = `${pCoord.bottom}%`;
  }

  if (demonPawn) {
    demonPawn.style.left = `calc(${dCoord.left}% + ${dOffsetLeft}px)`;
    demonPawn.style.bottom = `${dCoord.bottom}%`;
  }

  if (eventMarker && state.currentCard) {
    const card = state.currentCard;
    const sorted = [...card.tasks].sort((a, b) => b.advance - a.advance);
    const primary = sorted
      .filter((task) => task.advance > 0)
      .slice(0, 2)
      .map((task) => {
        const sign = task.advance >= 0 ? "+" : "";
        return `<span>${conditionText(task.requires, true)} <strong>${sign}${task.advance}</strong></span>`;
      })
      .join("");
    const reward = card.itemReward ? `<small>奖励：${itemDefinition(card.itemReward).shortName}</small>` : "";
    eventMarker.innerHTML = `
      <span class="event-marker-kicker">${card.type === "event" ? "EVENT" : "OMEN"}</span>
      <strong>${card.name}</strong>
      <div>${primary}</div>
      ${reward}
    `;
  }

  // 6. Camera zoom focus during the resolving (climbing) phase
  if (state.phase === "resolving") {
    parent.classList.add("climbing-zoom");
    const avgLeft = (pCoord.left + dCoord.left) / 2;
    const avgBottom = (pCoord.bottom + dCoord.bottom) / 2;
    parent.style.transformOrigin = `${avgLeft}% ${100 - avgBottom}%`;
  } else {
    parent.classList.remove("climbing-zoom");
    parent.style.transformOrigin = "";
  }
}

export function resetBoard(): void {
  cellsRendered = false;
  playerPawn = null;
  demonPawn = null;
  eventMarker = null;
}
