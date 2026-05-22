import { itemDefinition } from "../game/items";
import { getLevelConfig } from "../game/levels";
import type { Action, GameState } from "../game/types";
import { balance } from "../game/balance";

export function renderPlayerPanel(
  parent: HTMLElement,
  state: GameState,
  _dispatch: (a: Action) => void,
): void {
  if (!parent) return;

  parent.innerHTML = "";
  parent.className = "stone-panel player-panel";

  // 1. Heading
  const heading = document.createElement("h3");
  heading.style.display = "flex";
  heading.style.justifyContent = "space-between";
  heading.style.alignItems = "center";
  
  const titleSpan = document.createElement("span");
  titleSpan.innerHTML = `你 (登山者) <span style="font-size: 11px; opacity: 0.7; color: var(--highlight-blue);">PLAYER</span>`;
  heading.appendChild(titleSpan);

  const closeBtn = document.createElement("span");
  closeBtn.innerHTML = "✕";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.fontSize = "16px";
  closeBtn.style.color = "var(--danger-red)";
  closeBtn.addEventListener("click", () => {
    const overlay = document.getElementById("player-panel-overlay");
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
  img.src = "/src/assets/climber.png";
  img.alt = "Climber Portrait";
  portraitFrame.appendChild(img);

  const glow = document.createElement("div");
  glow.className = "portrait-glow";
  portraitFrame.appendChild(glow);

  card.appendChild(portraitFrame);

  // 4. Stats Detail Panel
  const stats = document.createElement("div");
  stats.className = "char-stats";

  const colorN = state.player.handDice.filter((d) => d.kind === "color").length;
  const madN = state.player.handDice.filter((d) => d.kind === "madness").length;
  const config = getLevelConfig(state.level);
  const items = state.player.items.map((item) => itemDefinition(item.id).shortName).join(" / ") || "无";

  stats.innerHTML = `
    <div class="char-stat-row">
      <span>关卡</span>
      <strong style="color: var(--warning-yellow); font-size: 14px;">${state.level} · ${config.name}</strong>
    </div>
    <div class="char-stat-row">
      <span>位置</span>
      <strong style="color: var(--highlight-blue); font-size: 14px;">${state.player.cell} / ${balance.GOAL_CELL}</strong>
    </div>
    <div class="char-stat-row">
      <span>疯狂骰</span>
      <strong style="color: var(--danger-red); font-size: 14px;">${madN}</strong>
    </div>
    <div class="char-stat-row">
      <span>可用骰</span>
      <strong style="color: var(--snow-grey); font-size: 14px;">${colorN}</strong>
    </div>
    <div class="char-stat-row">
      <span>道具</span>
      <strong style="color: var(--warning-yellow);">${items}</strong>
    </div>
    <div class="badge-tag">第 ${state.level} 关</div>
  `;

  card.appendChild(stats);
  parent.appendChild(card);

}
