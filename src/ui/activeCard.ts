import { getLevelConfig } from "../game/levels";
import { turnScore } from "../game/rules";
import { itemDefinition } from "../game/items";
import type { DiceCondition, GameState, Task } from "../game/types";
import { cardArtUrl } from "./cardArt";

function conditionText(c: DiceCondition): string {
  switch (c.kind) {
    case "score-at-least":          return `攀登值 ≥ ${c.n}`;
    case "sum-at-least":            return `总和 ≥ ${c.n}`;
    case "sum-at-most":             return `总和 ≤ ${c.n}`;
    case "face-count":              return `至少 ${c.atLeast} 颗 ${c.face} 点`;
    case "same-face-groups":        return `${c.count} 组同点 (每组 ≥ ${c.groupSize} 颗)`;
    case "distinct-faces":          return `不同点数 ≥ ${c.atLeast} 种`;
    case "distinct-faces-at-most":  return `不同点数 ≤ ${c.n} 种`;
  }
}

function scoreTarget(task: Task): number | null {
  return task.requires.kind === "score-at-least" ? task.requires.n : null;
}

export function renderActiveCard(
  parent: HTMLElement,
  state: GameState,
  options: { statusPulse?: boolean } = {},
): void {
  if (!parent) return;

  const card = state.currentCard;
  parent.innerHTML = "";
  parent.className = `stone-panel active-card-container${options.statusPulse ? " status-pulse" : ""}`;

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
  title.className = "active-card-title";
  title.textContent = card.name;
  wrapper.appendChild(title);

  // 2. Artwork Frame
  const artUrl = cardArtUrl(card.id);
  if (artUrl) {
    const frame = document.createElement("div");
    frame.className = "card-illustration-frame";
    
    const img = document.createElement("img");
    img.src = artUrl;
    img.alt = card.name;
    frame.appendChild(img);
    
    wrapper.appendChild(frame);
  }

  // 3. Card Meta Details
  const meta = document.createElement("div");
  meta.className = "active-card-meta";
  const typeText = card.type === "event" ? "事件牌" : "普通牌";
  const score = turnScore(state);
  const diceLeft = state.player.handDice.length;
  meta.innerHTML = `
    <span>${typeText}</span>
    <span class="status-score">攀登值: <strong>${score}</strong></span>
    <span class="status-bag">骰袋: <strong>${diceLeft}</strong></span>
  `;
  wrapper.appendChild(meta);

  if (card.hint || card.eventRule) {
    const hint = document.createElement("div");
    hint.className = "active-card-hint";
    const reward = card.itemReward ? ` 成功奖励：${itemDefinition(card.itemReward).shortName}。` : "";
    hint.textContent = `${card.eventRule ?? card.hint ?? ""}${reward}`;
    wrapper.appendChild(hint);
  }

  // 4. Tasks/Conditions list
  const tasksList = document.createElement("div");
  tasksList.className = "active-card-tasks";

  const sorted = [...card.tasks].sort((a, b) => b.advance - a.advance);

  for (const t of sorted) {
    const item = document.createElement("div");
    const isSlide = t.advance < 0;
    const target = scoreTarget(t);
    
    item.className = "task-item " + (isSlide ? "penalty-cost" : "success-reward");
    if (!isSlide && target !== null && score >= target) {
      item.className += " achieved";
    }
    
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
    effect.textContent = `-${getLevelConfig(state.level).slideBackCells} 格`;
    defaultFail.appendChild(effect);
    
    tasksList.appendChild(defaultFail);
  }

  wrapper.appendChild(tasksList);

  const nextTier = [...card.tasks]
    .sort((a, b) => (scoreTarget(a) ?? 0) - (scoreTarget(b) ?? 0))
    .find((t) => {
      const target = scoreTarget(t);
      return t.advance > 0 && target !== null && score < target;
    });
  const readout = document.createElement("div");
  readout.className = "active-card-readout";
  const nextTarget = nextTier ? scoreTarget(nextTier) : null;
  if (state.player.rolled.length === 0) {
    readout.textContent = "聆听祂声，命运骰会写入攀登值。";
  } else if (nextTier && nextTarget !== null) {
    readout.textContent = `下一档还差 ${nextTarget - score} 点。再听深渊，或封印此刻。`;
  } else if (score > 0) {
    readout.textContent = "已经达成本牌最高可见收益，可以封印此刻。";
  } else {
    readout.textContent = "当前未达标，封印会滑落。";
  }
  wrapper.appendChild(readout);

  parent.appendChild(wrapper);
}
