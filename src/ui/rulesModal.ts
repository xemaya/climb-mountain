const RULES_HTML = `
<h2>规则速查 (Rules)</h2>
<p style="text-align: center; color: var(--highlight-blue); font-weight: 700; margin-bottom: var(--s-16);">
  ◈ 你是登山者，目标是抢先抵达终点 (GOAL)。雪魔在身后紧追，若它追上或超过你，你将被吞噬淘汰！
</p>
<ol style="padding-left: var(--s-24); line-height: 1.8; font-size: 13px; display: flex; flex-direction: column; gap: var(--s-8);">
  <li>每回合翻开一张<strong>挑战牌/事件牌</strong>。</li>
  <li><strong>A 阶段 (选骰)</strong>：点击备用池的骰股选中它们，放入“已选区”，必须满足卡牌最少要求。</li>
  <li><strong>B 阶段 (掷骰)</strong>：投掷已选骰子，随后可选择部分骰股<strong>重新投掷</strong>最多 2 次。</li>
  <li><strong>C 阶段 (理智检查)</strong>：所有投出的<strong style="color: var(--madness-purple);">疯狂股</strong>以及与疯狂股点数相同的<strong style="color: #A569BD;">彩色股</strong>均被<strong>污染</strong>，结算时飞回手牌不计入移动！</li>
  <li><strong>D 阶段 (攀登移动)</strong>：剩余洁净彩色股之和若能满足卡牌任务，即可<strong>前进</strong>对应格数；若均未满足，则<strong>滑落 2 格</strong>并被迫获得 1 颗疯狂骰。</li>
  <li><strong>事件挑战</strong>：事件发生时自动投掷全部骰股，无重投直接结算。</li>
  <li><strong>雪魔推进</strong>：每回合雪魔基线推进 +1；你滑落 +1；你获得疯狂骰 +1；事件牌 +2。</li>
</ol>
<p style="color: var(--danger-red); text-align: center; font-weight: 700; margin-top: var(--s-16); font-size: 12px; border: 1px dashed var(--danger-red); padding: var(--s-8); border-radius: var(--s-4);">
  ⚠ 关键法则：在同一回合内，若雪魔的位置追上你，雪魔将直接获胜，即使你该回合同时登顶！
</p>
`;

export function openRulesModal(): void {
  const root = document.getElementById("modal-root")!;
  if (!root) return;

  root.innerHTML = "";
  
  const bg = document.createElement("div");
  bg.className = "modal-bg";
  bg.addEventListener("click", () => { root.innerHTML = ""; });
  
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.addEventListener("click", (e) => e.stopPropagation());
  
  // Render rules markup
  modal.innerHTML = RULES_HTML;

  // Add Close Button
  const closeBtn = document.createElement("button");
  closeBtn.className = "btn primary";
  closeBtn.style.width = "100%";
  closeBtn.style.marginTop = "var(--s-24)";
  closeBtn.textContent = "明晰规则";
  closeBtn.addEventListener("click", () => { root.innerHTML = ""; });
  modal.appendChild(closeBtn);

  bg.appendChild(modal);
  root.appendChild(bg);
}
