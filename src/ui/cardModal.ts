import type { Card, DiceCondition } from "../game/types";
import { cardArtUrl } from "./cardArt";

function conditionText(c: DiceCondition): string {
  switch (c.kind) {
    case "score-at-least":          return `攀登值 ≥ ${c.n}`;
    case "sum-at-least":            return `点数总和 ≥ ${c.n}`;
    case "sum-at-most":             return `点数总和 ≤ ${c.n}`;
    case "face-count":              return `至少 ${c.atLeast} 颗 ${c.face} 点`;
    case "same-face-groups":        return `出现 ${c.count} 组、每组 ${c.groupSize} 颗同点`;
    case "distinct-faces":          return `不同点数 ≥ ${c.atLeast} 种`;
    case "distinct-faces-at-most":  return `不同点数 ≤ ${c.n} 种`;
  }
}

export function openCardModal(card: Card): void {
  const root = document.getElementById("modal-root")!;
  root.innerHTML = "";
  const bg = document.createElement("div");
  bg.className = "modal-bg";
  bg.addEventListener("click", () => { root.innerHTML = ""; });

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.addEventListener("click", (e) => e.stopPropagation());

  const title = document.createElement("h2");
  title.textContent = card.name;
  modal.appendChild(title);

  const artUrl = cardArtUrl(card.id);
  if (artUrl) {
    const cardArt = document.createElement("img");
    cardArt.src = artUrl;
    cardArt.alt = card.name;
    cardArt.style.width = "100%";
    cardArt.style.maxHeight = "280px";
    cardArt.style.objectFit = "cover";
    cardArt.style.borderRadius = "var(--s-6)";
    cardArt.style.marginBottom = "var(--s-16)";
    modal.appendChild(cardArt);
  }

  const meta = document.createElement("div");
  meta.style.fontFamily = "var(--font-num)";
  meta.style.fontSize = "12px";
  meta.style.opacity = "0.8";
  meta.style.marginBottom = "var(--s-16)";
  meta.textContent = `${card.type === "event" ? "事件牌" : "普通牌"} · 最少 ${card.minDice}`;
  modal.appendChild(meta);

  const tasks = document.createElement("ol");
  tasks.style.paddingLeft = "var(--s-24)";
  const sorted = card.type === "normal"
    ? [...card.tasks].sort((a, b) => b.advance - a.advance)
    : card.tasks;
  for (const t of sorted) {
    const li = document.createElement("li");
    const sign = t.advance >= 0 ? "+" : "";
    li.textContent = `${conditionText(t.requires)} → ${sign}${t.advance} 格`;
    if (t.advance < 0) li.style.color = "var(--danger)";
    tasks.appendChild(li);
  }
  modal.appendChild(tasks);

  bg.appendChild(modal);
  root.appendChild(bg);
}
