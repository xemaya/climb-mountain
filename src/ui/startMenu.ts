export function renderStartMenu(onStart: () => void): void {
  const root = document.getElementById("modal-root")!;
  if (!root) return;

  root.innerHTML = "";
  
  const bg = document.createElement("div");
  bg.className = "modal-bg";
  
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.textAlign = "center";

  const grid = document.createElement("div");
  grid.className = "start-menu-grid";

  // 1. Game Title
  const title = document.createElement("h2");
  title.textContent = "Dice of Madness";
  title.style.fontSize = "32px";
  title.style.letterSpacing = "3px";
  grid.appendChild(title);

  // 2. Beautiful circular artwork medallion
  const artwork = document.createElement("div");
  artwork.className = "start-menu-artwork";
  grid.appendChild(artwork);

  // 3. Subtitle / Theme descriptor
  const sub = document.createElement("p");
  sub.textContent = "克苏鲁雪山 ◈ 登山者 vs 雪魔";
  sub.style.color = "var(--highlight-blue)";
  sub.style.fontFamily = "var(--font-num)";
  sub.style.fontWeight = "700";
  grid.appendChild(sub);

  // 4. Action Buttons Container
  const btnRow = document.createElement("div");
  btnRow.style.display = "flex";
  btnRow.style.gap = "var(--s-12)";
  btnRow.style.justifyContent = "center";
  btnRow.style.width = "100%";

  const startBtn = document.createElement("button");
  startBtn.className = "btn primary";
  startBtn.style.flex = "1";
  startBtn.textContent = "开启攀登";
  startBtn.addEventListener("click", () => {
    root.innerHTML = "";
    onStart();
  });
  btnRow.appendChild(startBtn);

  const rulesBtn = document.createElement("button");
  rulesBtn.className = "btn";
  rulesBtn.style.flex = "1";
  rulesBtn.textContent = "规则查阅";
  rulesBtn.addEventListener("click", () => {
    import("./rulesModal").then(({ openRulesModal }) => openRulesModal());
  });
  btnRow.appendChild(rulesBtn);

  grid.appendChild(btnRow);
  modal.appendChild(grid);
  bg.appendChild(modal);
  root.appendChild(bg);
}
