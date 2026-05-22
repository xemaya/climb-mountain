const RULES_HTML = `
<h2>规则速查 (Rules)</h2>
<p style="text-align: center; color: var(--highlight-blue); font-weight: 700; margin-bottom: var(--s-16);">
  ◈ 你是登山者，目标是抢先抵达终点 (GOAL)。雪魔在身后紧追，若它追上或超过你，你将被吞噬淘汰！
</p>
<ol style="padding-left: var(--s-24); line-height: 1.8; font-size: 13px; display: flex; flex-direction: column; gap: var(--s-8);">
  <li>每回合翻开一张<strong>危机牌/事件牌</strong>，牌面会列出攀登值目标。</li>
  <li>你只有两个核心动作：<strong>继续掷骰</strong>，或<strong>收手结算</strong>。</li>
  <li>继续掷骰时，系统会从骰袋里随机抽出 1 颗骰并投出；本回合抽出的骰不会重复出现。</li>
  <li><strong>普通骰</strong>增加攀登值，<strong style="color: var(--madness-purple);">疯狂骰</strong>扣除攀登值。</li>
  <li><strong>攀登值</strong> = 普通骰点数总和 - 疯狂骰点数总和。达到牌面目标即可前进。</li>
  <li>如果收手时没有达成任何目标，你会<strong>滑落 2 格</strong>并获得 1 颗疯狂骰。</li>
  <li><strong>雪魔推进</strong>：每回合雪魔基线推进 +1；你滑落 +1；事件牌 +1。新增疯狂骰会污染骰袋，但不额外推进雪魔。</li>
</ol>
<p style="color: var(--danger-red); text-align: center; font-weight: 700; margin-top: var(--s-16); font-size: 12px; border: 1px dashed var(--danger-red); padding: var(--s-8); border-radius: var(--s-4);">
  ⚠ 关键法则：在同一回合内，若雪魔的位置追上你，雪魔将直接获胜，即使你该回合同时登顶！
</p>
`;

export function openRulesModal(): void {
  const root = document.getElementById("modal-root")!;
  if (!root) return;

  const bg = document.createElement("div");
  bg.className = "modal-bg";
  
  const close = () => {
    if (bg.parentNode === root) {
      root.removeChild(bg);
    }
  };
  bg.addEventListener("click", close);
  
  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.maxHeight = "90vh";
  modal.style.overflowY = "auto";
  modal.addEventListener("click", (e) => e.stopPropagation());
  
  // Render rules markup
  modal.innerHTML = RULES_HTML;

  // Add Close Button
  const closeBtn = document.createElement("button");
  closeBtn.className = "btn primary";
  closeBtn.style.width = "100%";
  closeBtn.style.marginTop = "var(--s-24)";
  closeBtn.textContent = "明晰规则";
  closeBtn.addEventListener("click", close);
  modal.appendChild(closeBtn);

  bg.appendChild(modal);
  root.appendChild(bg);
}
