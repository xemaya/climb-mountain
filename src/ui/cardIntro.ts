import type { Card, DiceCondition } from "../game/types";
import { cardArtUrl } from "./cardArt";

function conditionText(c: DiceCondition): string {
  switch (c.kind) {
    case "score-at-least":          return `攀登值 ≥ ${c.n}`;
    case "sum-at-least":            return `总和 ≥ ${c.n}`;
    case "sum-at-most":             return `总和 ≤ ${c.n}`;
    case "face-count":              return `至少 ${c.atLeast} 颗 ${c.face} 点`;
    case "same-face-groups":        return `${c.count} 组同点`;
    case "distinct-faces":          return `不同点数 ≥ ${c.atLeast} 种`;
    case "distinct-faces-at-most":  return `不同点数 ≤ ${c.n} 种`;
  }
}

export function renderCardIntro(root: HTMLElement, card: Card, onConfirm: () => void): void {
  root.innerHTML = "";

  const bg = document.createElement("div");
  bg.className = "modal-bg card-intro-bg";

  const modal = document.createElement("div");
  modal.className = "modal card-intro-modal";
  modal.addEventListener("click", (e) => e.stopPropagation());

  const art = cardArtUrl(card.id);
  if (art) {
    const frame = document.createElement("div");
    frame.className = "card-intro-art-frame";
    const img = document.createElement("img");
    img.className = "card-intro-art";
    img.src = art;
    img.alt = card.name;
    frame.appendChild(img);
    modal.appendChild(frame);
  }

  const type = document.createElement("div");
  type.className = `card-intro-type ${card.type}`;
  type.textContent = card.type === "event" ? "事件牌" : "危机牌";
  modal.appendChild(type);

  const title = document.createElement("h2");
  title.textContent = card.name;
  modal.appendChild(title);

  const lore = document.createElement("p");
  lore.className = "card-intro-lore";
  lore.textContent = card.lore ?? card.hint ?? "";
  modal.appendChild(lore);

  if (card.eventRule) {
    const rule = document.createElement("div");
    rule.className = "card-intro-rule";
    rule.textContent = card.eventRule;
    modal.appendChild(rule);
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
  modal.appendChild(target);

  const confirm = document.createElement("button");
  confirm.className = "btn primary card-intro-confirm";
  confirm.textContent = "确认，开始本轮";
  confirm.addEventListener("click", onConfirm);
  modal.appendChild(confirm);

  bg.appendChild(modal);
  root.appendChild(bg);
}
