import type { Action, GameState } from "../game/types";

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
  dispatch: (a: Action) => void,
): void {
  if (!parent) return;

  parent.innerHTML = "";
  parent.className = "top-bar";

  // 1. Logo Brand
  const logo = document.createElement("div");
  logo.className = "logo";
  logo.textContent = "MADNESS";
  parent.appendChild(logo);

  // 2. Avatar Triggers Group
  const triggers = document.createElement("div");
  triggers.className = "avatar-triggers";

  // Player Avatar Trigger
  const pAvatar = document.createElement("div");
  pAvatar.className = "avatar-badge player";
  pAvatar.innerHTML = `
    <img src="/src/assets/climber.png" alt="Player">
    <span class="cell-num">${state.player.cell}</span>
  `;
  pAvatar.addEventListener("click", () => toggleOverlay("player-panel-overlay"));
  triggers.appendChild(pAvatar);

  // Demon Avatar Trigger
  const dAvatar = document.createElement("div");
  dAvatar.className = "avatar-badge demon";
  dAvatar.innerHTML = `
    <img src="/src/assets/snow_demon.png" alt="Demon">
    <span class="cell-num">${state.demon.cell}</span>
  `;
  dAvatar.addEventListener("click", () => toggleOverlay("demon-panel-overlay"));
  triggers.appendChild(dAvatar);

  parent.appendChild(triggers);

  // 3. Beautiful Runic Round counter badge
  const roundBadge = document.createElement("div");
  roundBadge.className = "round-badge";
  roundBadge.textContent = `R ${state.round}`;
  parent.appendChild(roundBadge);

  void dispatch;
}
