import type { GameState } from "../game/types";
import { balance } from "../game/balance";

let cellsRendered = false;
let playerPawn: HTMLElement | null = null;
let demonPawn: HTMLElement | null = null;

// Serpentine climbing trail coordinates matching the mountain backdrop shape
const coords: Record<number, { left: number; bottom: number }> = {
  0:  { left: 50, bottom: 5 },
  1:  { left: 38, bottom: 11 },
  2:  { left: 28, bottom: 17 },
  3:  { left: 34, bottom: 23 },
  4:  { left: 50, bottom: 29 },
  5:  { left: 62, bottom: 35 },
  6:  { left: 68, bottom: 41 },
  7:  { left: 58, bottom: 47 }, // Death Zone starts
  8:  { left: 44, bottom: 53 },
  9:  { left: 34, bottom: 59 },
  10: { left: 38, bottom: 65 },
  11: { left: 50, bottom: 71 },
  12: { left: 60, bottom: 77 },
  13: { left: 50, bottom: 83 },
  14: { left: 50, bottom: 90 }, // GOAL
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
    alert.textContent = "死亡区域，6点禁用";
    parent.appendChild(alert);

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
}
