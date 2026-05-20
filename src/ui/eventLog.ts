import type { GameState } from "../game/types";

export function renderEventLog(parent: HTMLElement, state: GameState): void {
  if (!parent) return;

  parent.innerHTML = "";
  parent.className = "stone-panel event-log-container";

  // 1. Heading
  const heading = document.createElement("h3");
  heading.style.display = "flex";
  heading.style.justifyContent = "space-between";
  heading.style.alignItems = "center";
  
  const titleSpan = document.createElement("span");
  titleSpan.innerHTML = `危机记录 <span style="font-size: 11px; opacity: 0.7; color: var(--highlight-blue);">EVENT LOG</span>`;
  heading.appendChild(titleSpan);

  const closeBtn = document.createElement("span");
  closeBtn.innerHTML = "✕";
  closeBtn.style.cursor = "pointer";
  closeBtn.style.fontSize = "16px";
  closeBtn.style.color = "var(--danger-red)";
  closeBtn.addEventListener("click", () => {
    const overlay = document.getElementById("event-log-overlay");
    if (overlay) overlay.style.display = "none";
  });
  heading.appendChild(closeBtn);
  
  parent.appendChild(heading);

  // 2. Scrollable log area
  const scrollArea = document.createElement("div");
  scrollArea.className = "log-scroll-area";

  for (const entry of state.log) {
    const line = document.createElement("div");
    
    // Choose semantic color styling based on message keywords
    let statusClass = "";
    if (entry.text.includes("前进") || entry.text.includes("成功") || entry.text.includes("登顶")) {
      statusClass = "highlight-blue";
    } else if (entry.text.includes("滑落") || entry.text.includes("雪魔推进") || entry.text.includes("崩溃") || entry.text.includes("失败")) {
      statusClass = "highlight-red";
    } else if (entry.text.includes("洗回") || entry.text.includes("获得 1 颗疯狂骰") || entry.text.includes("重投")) {
      statusClass = "highlight-yellow";
    }

    line.className = "log-entry-line " + statusClass;
    line.textContent = `回合 ${entry.round} ◈ ${entry.text}`;
    scrollArea.appendChild(line);
  }

  // Fallback if empty log
  if (state.log.length === 0) {
    const placeholder = document.createElement("div");
    placeholder.style.textAlign = "center";
    placeholder.style.padding = "var(--s-24) 0";
    placeholder.style.opacity = "0.4";
    placeholder.textContent = "攀登开始，暂无事件...";
    scrollArea.appendChild(placeholder);
  }

  parent.appendChild(scrollArea);

  // Auto-scroll to the absolute bottom to show latest action
  setTimeout(() => {
    scrollArea.scrollTop = scrollArea.scrollHeight;
  }, 50);
}
