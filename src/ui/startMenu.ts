import { openRulesModal } from "./rulesModal";

export function renderStartMenu(onStart: () => void): void {
  const root = document.getElementById("modal-root")!;
  if (!root) return;

  root.innerHTML = "";
  
  const bg = document.createElement("div");
  bg.className = "modal-bg start-screen-bg";
  
  const modal = document.createElement("div");
  modal.className = "start-screen-panel";

  const grid = document.createElement("div");
  grid.className = "start-menu-grid";

  const title = document.createElement("h2");
  title.textContent = "MADNESS";
  grid.appendChild(title);

  const artwork = document.createElement("div");
  artwork.className = "start-menu-artwork";
  grid.appendChild(artwork);

  const sub = document.createElement("p");
  sub.textContent = "雪魔在追。比祂先登顶。骰子是你的武器，道具只是短暂的庇护。";
  grid.appendChild(sub);

  const btnRow = document.createElement("div");
  btnRow.className = "start-menu-actions";
  btnRow.style.flexDirection = "column";
  btnRow.style.gap = "var(--s-12)";

  const startBtn = document.createElement("button");
  startBtn.className = "start-ritual-btn";
  startBtn.textContent = "踏入风雪";
  startBtn.addEventListener("click", () => {
    root.innerHTML = "";
    onStart();
  });
  btnRow.appendChild(startBtn);

  const rulesBtn = document.createElement("button");
  rulesBtn.className = "start-ritual-btn";
  rulesBtn.textContent = "查看规则";
  rulesBtn.style.minHeight = "48px";
  rulesBtn.style.fontSize = "16px";
  rulesBtn.style.background = "linear-gradient(180deg, rgba(42, 58, 70, 0.3), rgba(20, 28, 35, 0.8))";
  rulesBtn.style.borderColor = "rgba(0, 240, 255, 0.2)";
  rulesBtn.style.boxShadow = "none";
  rulesBtn.addEventListener("click", () => {
    openRulesModal();
  });
  btnRow.appendChild(rulesBtn);

  grid.appendChild(btnRow);
  modal.appendChild(grid);
  bg.appendChild(modal);
  root.appendChild(bg);
}
