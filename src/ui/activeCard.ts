import type { Card, DiceCondition } from "../game/types";

function conditionText(c: DiceCondition): string {
  switch (c.kind) {
    case "sum-at-least":            return `总和 ≥ ${c.n}`;
    case "sum-at-most":             return `总和 ≤ ${c.n}`;
    case "face-count":              return `至少 ${c.atLeast} 颗 ${c.face} 点`;
    case "same-face-groups":        return `${c.count} 组同点 (每组 ≥ ${c.groupSize} 颗)`;
    case "distinct-faces":          return `不同点数 ≥ ${c.atLeast} 种`;
    case "distinct-faces-at-most":  return `不同点数 ≤ ${c.n} 种`;
  }
}

export function renderActiveCard(parent: HTMLElement, card: Card | null): void {
  if (!parent) return;

  parent.innerHTML = "";
  parent.className = "stone-panel active-card-container";

  // Heading
  const heading = document.createElement("h3");
  heading.innerHTML = `<span>当前危机</span> <span style="font-size: 11px; opacity: 0.7; color: var(--warning-yellow);">CHALLENGE</span>`;
  parent.appendChild(heading);

  if (!card) {
    const placeholder = document.createElement("div");
    placeholder.style.textAlign = "center";
    placeholder.style.padding = "var(--s-48) 0";
    placeholder.style.opacity = "0.5";
    placeholder.textContent = "无活动卡牌";
    parent.appendChild(placeholder);
    return;
  }

  // Active Card Content Wrapper
  const wrapper = document.createElement("div");
  wrapper.className = "active-card-wrapper";

  // 1. Title/Name
  const title = document.createElement("div");
  title.style.fontFamily = "var(--font-title)";
  title.style.fontSize = "18px";
  title.style.color = "var(--warning-yellow)";
  title.style.letterSpacing = "1px";
  title.textContent = card.name;
  wrapper.appendChild(title);

  // 2. Artwork Frame
  const artMap: Record<string, string> = {
    "march-to-death":  "card_march_to_death.png",
    "armata-stare":    "card_armata_stare.png",
    "sasna-anomaly":   "card_sasna_anomaly.png",
    "continuous-pain": "card_continuous_pain.png",
    "hastur":          "card_hastur.png",
    "ithaqua":         "card_ithaqua.png",
  };
  
  if (artMap[card.id]) {
    const frame = document.createElement("div");
    frame.className = "card-illustration-frame";
    
    const img = document.createElement("img");
    img.src = `/src/assets/${artMap[card.id]}`;
    img.alt = card.name;
    frame.appendChild(img);
    
    wrapper.appendChild(frame);
  }

  // 3. Card Meta Details
  const meta = document.createElement("div");
  meta.className = "active-card-meta";
  const typeText = card.type === "event" ? "事件牌 (自动骰)" : "普通牌";
  const minText = card.minDice === "ALL" ? "全部" : `${card.minDice} 颗`;
  meta.innerHTML = `<span>类型: ${typeText}</span> <span>最少需投: ${minText}</span>`;
  wrapper.appendChild(meta);

  // 4. Tasks/Conditions list
  const tasksList = document.createElement("div");
  tasksList.className = "active-card-tasks";

  const sorted = card.type === "normal"
    ? [...card.tasks].sort((a, b) => b.advance - a.advance)
    : card.tasks;

  for (const t of sorted) {
    const item = document.createElement("div");
    const isSlide = t.advance < 0;
    
    item.className = "task-item " + (isSlide ? "penalty-cost" : "success-reward");
    
    const req = document.createElement("span");
    req.className = "task-req";
    req.textContent = conditionText(t.requires);
    item.appendChild(req);
    
    const effect = document.createElement("span");
    effect.className = "task-effect" + (isSlide ? " slide" : "");
    const sign = t.advance >= 0 ? "+" : "";
    effect.textContent = `${sign}${t.advance} 格`;
    
    item.appendChild(effect);
    tasksList.appendChild(item);
  }

  // If normal card, show default failure outcome (since resolveTask returns null on default slide)
  if (card.type === "normal") {
    const defaultFail = document.createElement("div");
    defaultFail.className = "task-item penalty-cost";
    
    const req = document.createElement("span");
    req.className = "task-req";
    req.textContent = "未能满足上述条件 (滑落)";
    defaultFail.appendChild(req);
    
    const effect = document.createElement("span");
    effect.className = "task-effect slide";
    effect.textContent = "-2 格";
    defaultFail.appendChild(effect);
    
    tasksList.appendChild(defaultFail);
  }

  wrapper.appendChild(tasksList);
  parent.appendChild(wrapper);
}
