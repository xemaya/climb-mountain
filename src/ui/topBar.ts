import type { Action, GameState } from "../game/types";
import { balance } from "../game/balance";

function toggleOverlay(id: string): void {
  const overlay = document.getElementById(id);
  if (overlay) {
    const isHidden = overlay.style.display === "none";
    // Close all overlays first
    document.querySelectorAll(".overlay-modal-container").forEach((el) => {
      (el as HTMLElement).style.display = "none";
    });
    if (isHidden) {
      overlay.style.display = "flex";
      // Wire up click-backdrop to close
      overlay.onclick = (e) => {
        if (e.target === overlay) {
          overlay.style.display = "none";
        }
      };
    }
  }
}

export function renderTopBar(
  parent: HTMLElement,
  state: GameState,
  _dispatch: (a: Action) => void,
): void {
  if (!parent) return;

  parent.innerHTML = "";
  parent.className = "top-bar";

  const playerPct = Math.min(100, Math.max(0, (state.player.cell / balance.GOAL_CELL) * 100));
  const demonPct = Math.min(100, Math.max(0, (state.demon.cell / balance.GOAL_CELL) * 100));

  const pAvatar = document.createElement("button");
  pAvatar.className = "summit-orb player";
  pAvatar.innerHTML = `
    <img src="/src/assets/climber.png" alt="Player">
    <span class="orb-label">YOU</span>
    <strong>${state.player.cell}</strong>
  `;
  pAvatar.addEventListener("click", () => toggleOverlay("player-panel-overlay"));
  parent.appendChild(pAvatar);

  const progress = document.createElement("div");
  progress.className = "summit-progress";
  progress.innerHTML = `
    <div class="summit-title">DISTANCE TO SUMMIT</div>
    <div class="summit-count">${state.player.cell} / ${balance.GOAL_CELL}</div>
    <div class="summit-track">
      <div class="summit-fill player" style="width: ${playerPct}%"></div>
      <div class="summit-fill beast" style="width: ${demonPct}%"></div>
      <div class="summit-marker" style="left: ${playerPct}%"></div>
    </div>
    <div class="summit-round">L ${state.level} · R ${state.round}</div>
  `;
  parent.appendChild(progress);

  const dAvatar = document.createElement("button");
  dAvatar.className = "summit-orb beast";
  dAvatar.innerHTML = `
    <img src="/src/assets/snow_demon.png" alt="Demon">
    <span class="orb-label">BEAST</span>
    <strong>${state.demon.cell}</strong>
  `;
  dAvatar.addEventListener("click", () => toggleOverlay("demon-panel-overlay"));
  parent.appendChild(dAvatar);

}
