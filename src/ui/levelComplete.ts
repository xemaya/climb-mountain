import type { GameState } from "../game/types";
import { getLevelConfig } from "../game/levels";

// Celebratory transition shown when the climber summits a non-final level.
// `onContinue` should dispatch the next-level action.
export function renderLevelComplete(state: GameState, onContinue: () => void): void {
  const root = document.getElementById("modal-root");
  if (!root) return;

  root.innerHTML = "";

  const bg = document.createElement("div");
  bg.className = "modal-bg";

  const modal = document.createElement("div");
  modal.className = "modal end-screen level-clear";

  const clearedName = getLevelConfig(state.level).name;
  const nextConfig = getLevelConfig(state.level + 1);

  const title = document.createElement("div");
  title.className = "title";
  title.innerHTML =
    `◈ 第 ${state.level} 关 登顶！◈` +
    `<br><span style="font-size: 14px; color: var(--text-muted);">${clearedName}</span>`;
  modal.appendChild(title);

  const next = document.createElement("div");
  next.style.fontFamily = "var(--font-num)";
  next.style.marginTop = "var(--s-16)";
  next.style.lineHeight = "2";
  next.style.fontSize = "13px";
  next.innerHTML = `
    <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed rgba(42, 58, 70, 0.4); padding: 4px 0;">
      <span>进度</span>
      <strong style="color: var(--warning-yellow);">${state.level} / 10</strong>
    </div>
    <div style="display: flex; justify-content: space-between; padding: 4px 0;">
      <span>下一关</span>
      <strong style="color: var(--highlight-blue);">${state.level + 1} · ${nextConfig.name}</strong>
    </div>
  `;
  modal.appendChild(next);

  const btn = document.createElement("button");
  btn.className = "btn primary";
  btn.style.marginTop = "var(--s-24)";
  btn.style.width = "100%";
  btn.textContent = "继续攀登";
  btn.addEventListener("click", () => {
    root.innerHTML = "";
    onContinue();
  });
  modal.appendChild(btn);

  bg.appendChild(modal);
  root.appendChild(bg);
}
