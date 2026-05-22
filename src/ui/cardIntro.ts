import type { Card } from "../game/types";
import { itemDefinition } from "../game/items";
import { conditionText } from "../game/cards";


export function renderCardIntro(root: HTMLElement, card: Card, onConfirm: () => void): void {
  root.innerHTML = "";
  let started = false;

  const bg = document.createElement("div");
  bg.className = "card-intro-bg";

  const modal = document.createElement("div");
  modal.className = "card-intro-modal omen-seal";
  modal.addEventListener("click", (e) => e.stopPropagation());

  const prompt = document.createElement("div");
  prompt.className = "scroll-open-prompt";
  prompt.textContent = "触碰封印";
  modal.appendChild(prompt);

  const content = document.createElement("div");
  content.className = "card-intro-content";

  const type = document.createElement("div");
  type.className = `card-intro-type ${card.type}`;
  type.textContent = card.type === "event" ? "事件牌" : "危机牌";
  content.appendChild(type);

  const title = document.createElement("h2");
  title.textContent = card.name;
  content.appendChild(title);

  const lore = document.createElement("p");
  lore.className = "card-intro-lore";
  lore.textContent = card.lore ?? card.hint ?? "";
  content.appendChild(lore);

  if (card.eventRule) {
    const rule = document.createElement("div");
    rule.className = "card-intro-rule";
    const reward = card.itemReward ? ` 成功奖励：${itemDefinition(card.itemReward).name}。` : "";
    rule.textContent = `${card.eventRule}${reward}`;
    content.appendChild(rule);
  }

  const target = document.createElement("div");
  target.className = "card-intro-targets";
  for (const task of [...card.tasks].sort((a, b) => b.advance - a.advance)) {
    const row = document.createElement("div");
    row.className = "card-intro-target";
    const sign = task.advance >= 0 ? "+" : "";
    row.innerHTML = `<span>${conditionText(task.requires)}</span><strong>${sign}${task.advance} 格</strong>`;
    target.appendChild(row);
  }
  content.appendChild(target);
  modal.appendChild(content);

  const openAndDock = (): void => {
    if (started) return;
    started = true;
    modal.classList.remove("omen-seal");
    modal.classList.add("omen-open");
    setTimeout(() => {
      bg.classList.add("card-intro-morphing");
      modal.classList.add("omen-etching");
    }, 1200);
    setTimeout(() => {
      onConfirm();
    }, 1620);
    setTimeout(() => {
      root.innerHTML = "";
    }, 1780);
  };

  modal.addEventListener("click", openAndDock);
  bg.addEventListener("click", openAndDock);

  bg.appendChild(modal);
  root.appendChild(bg);
}
