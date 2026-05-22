import type { GameState } from "../game/types";

export function renderEndScreen(state: GameState, onRestart: () => void, onHome: () => void): void {
  const root = document.getElementById("modal-root")!;
  if (!root) return;

  root.innerHTML = "";
  
  const bg = document.createElement("div");
  bg.className = "modal-bg";
  
  const modal = document.createElement("div");
  modal.className = "modal end-screen " + state.phase;

  // 1. Victory/Defeat Cinematic Title (§10)
  const title = document.createElement("div");
  title.className = "title";
  title.innerHTML = state.phase === "won" 
    ? "◈ 成功登顶！◈<br><span style='font-size: 14px; color: var(--text-muted);'>Summit Ascended</span>" 
    : "☠ 被雪魔吞噬... ☠<br><span style='font-size: 14px; color: var(--danger-red);'>Devoured by the Snow Demon</span>";
  modal.appendChild(title);

  // 2. Beautiful circular artwork showcase matching outcome
  const artMedallion = document.createElement("div");
  artMedallion.style.width = "100px";
  artMedallion.style.height = "100px";
  artMedallion.style.borderRadius = "50%;";
  artMedallion.style.margin = "var(--s-16) auto";
  artMedallion.style.border = "3px solid var(--border-stone)";
  artMedallion.style.overflow = "hidden";
  artMedallion.style.boxShadow = state.phase === "won" 
    ? "0 0 20px rgba(123, 167, 198, 0.5)" 
    : "0 0 20px rgba(209, 78, 55, 0.5)";
  
  const artImg = document.createElement("img");
  artImg.src = state.phase === "won" ? "/src/assets/climber.png" : "/src/assets/snow_demon.png";
  artImg.alt = "Outcome Art";
  artImg.style.width = "100%";
  artImg.style.height = "100%";
  artImg.style.objectFit = "cover";
  artMedallion.appendChild(artImg);
  modal.appendChild(artMedallion);

  // 3. Stats Summary
  const summary = document.createElement("div");
  summary.style.fontFamily = "var(--font-num)";
  summary.style.marginTop = "var(--s-16)";
  summary.style.lineHeight = "2";
  summary.style.fontSize = "13px";
  
  const madCount = state.player.handDice.filter((d) => d.kind === "madness").length;
  summary.innerHTML = `
    <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed rgba(42, 58, 70, 0.4); padding: 4px 0;">
      <span>抵达关卡</span>
      <strong style="color: var(--warning-yellow);">${state.level} / 10</strong>
    </div>
    <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed rgba(42, 58, 70, 0.4); padding: 4px 0;">
      <span>攀登时长</span>
      <strong>${state.round} 回合</strong>
    </div>
    <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed rgba(42, 58, 70, 0.4); padding: 4px 0;">
      <span>登山者终点格子</span>
      <strong style="color: var(--highlight-blue);">${state.player.cell} 格</strong>
    </div>
    <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed rgba(42, 58, 70, 0.4); padding: 4px 0;">
      <span>雪魔终点格子</span>
      <strong style="color: var(--danger-red);">${state.demon.cell} 格</strong>
    </div>
    <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed rgba(42, 58, 70, 0.4); padding: 4px 0;">
      <span>累计疯狂股</span>
      <strong style="color: var(--madness-purple);">${madCount} 颗</strong>
    </div>
  `;
  modal.appendChild(summary);

  // 4. Action buttons
  const btnRow = document.createElement("div");
  btnRow.style.marginTop = "var(--s-24)";
  btnRow.style.display = "flex";
  btnRow.style.gap = "var(--s-12)";
  btnRow.style.justifyContent = "center";

  const restart = document.createElement("button");
  restart.className = "btn primary";
  restart.style.flex = "1";
  restart.textContent = "再次尝试";
  restart.addEventListener("click", () => {
    root.innerHTML = "";
    onRestart();
  });
  btnRow.appendChild(restart);

  const home = document.createElement("button");
  home.className = "btn";
  home.style.flex = "1";
  home.textContent = "主菜单";
  home.addEventListener("click", () => {
    root.innerHTML = "";
    onHome();
  });
  btnRow.appendChild(home);

  modal.appendChild(btnRow);
  bg.appendChild(modal);
  root.appendChild(bg);
}
