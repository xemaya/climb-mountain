import type { Action, GameState } from "../game/types";
import { balance } from "../game/balance";

export function renderDemonPanel(
  parent: HTMLElement,
  state: GameState,
  _dispatch: (a: Action) => void,
): void {
  if (!parent) return;

  parent.innerHTML = "";
  parent.className = "stone-panel demon-panel";

  // 1. Heading
  const heading = document.createElement("h3");
  heading.style.display = "flex";
  heading.style.justifyContent = "space-between";
  heading.style.alignItems = "center";
  
  const titleSpan = document.createElement("span");
  titleSpan.innerHTML = `雪魔 (AI 对手) <span style="font-size: 11px; opacity: 0.7; color: var(--danger-red);">DEMON</span>`;
  heading.appendChild(titleSpan);

  const closeBtn = document.createElement("span");
  closeBtn.innerHTML = "✕";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.fontSize = "16px";
  closeBtn.style.color = "var(--danger-red)";
  closeBtn.addEventListener("click", () => {
    const overlay = document.getElementById("demon-panel-overlay");
    if (overlay) overlay.style.display = "none";
  });
  heading.appendChild(closeBtn);
  
  parent.appendChild(heading);

  // 2. Character Card Frame
  const card = document.createElement("div");
  card.className = "character-card";

  // 3. Portrait Frame
  const portraitFrame = document.createElement("div");
  portraitFrame.className = "portrait-frame";

  const img = document.createElement("img");
  img.src = "/src/assets/snow_demon.png";
  img.alt = "Snow Demon Portrait";
  portraitFrame.appendChild(img);

  const glow = document.createElement("div");
  glow.className = "portrait-glow";
  portraitFrame.appendChild(glow);

  card.appendChild(portraitFrame);

  // 4. Stats Detail Panel
  const stats = document.createElement("div");
  stats.className = "char-stats";

  const dist = state.player.cell - state.demon.cell;

  stats.innerHTML = `
    <div class="char-stat-row">
      <span>位置</span>
      <strong style="color: var(--danger-red); font-size: 14px;">${state.demon.cell} / ${balance.GOAL_CELL}</strong>
    </div>
    <div class="char-stat-row">
      <span>距离登山者</span>
      <strong style="color: var(--warning-yellow); font-size: 14px;">${dist} 格</strong>
    </div>
    <div class="badge-tag">扭曲存在</div>
  `;

  card.appendChild(stats);
  parent.appendChild(card);

}
