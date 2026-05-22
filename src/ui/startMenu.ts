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

  const startBtn = document.createElement("button");
  startBtn.className = "start-ritual-btn";
  startBtn.textContent = "踏入风雪";
  startBtn.addEventListener("click", () => {
    root.innerHTML = "";
    onStart();
  });
  btnRow.appendChild(startBtn);

  grid.appendChild(btnRow);
  modal.appendChild(grid);
  bg.appendChild(modal);
  root.appendChild(bg);
}
