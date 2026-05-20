# Dice of Madness · 克苏鲁雪山追兵版 — 设计规格

源材料：
- 原桌游规则书：`climb_mountain/0.jpeg` 到 `0 (7).jpeg`（Brekeke Games《Dice of Madness》8 页规则）
- 视觉概念板：`climb_mountain/concept.png`（ChatGPT 多轮对话后产出的电子化概念）
- 工程经验：sibling 项目 `zomboy/`（已上线试玩，Vite + TS plain DOM + harness + DeerAPI 出图）

本规格只覆盖 Phase 1 walking skeleton 的边界与设计决策。Phase 2 是 gate 后的开放清单，不是承诺。

---

## 1. 框架与范围

### 1.1 核心转向：从 2-4P 竞技到 1v 雪魔追兵
原桌游是 2-4 玩家爬山竞速，靠"谁先登顶"分胜负。本作放弃多人，转为：
- **玩家** = 登山者，单人。
- **雪魔（AI）** = 追兵。在同一座山的同一根轨道上，从山脚往上追。
- **胜** = 玩家先到 GOAL。**负** = 雪魔追上玩家所在格。

放弃多人是为了让"追兵紧张感"成为唯一张力来源，避免和"竞速对手"混合稀释。

### 1.2 交付节奏
"Walking skeleton + gate 迭代"。先出最小可玩，试玩拿信号，再决定加什么。不一次堆全功能。

### 1.3 Phase 1 IN
- 浏览器单页，Vite + TypeScript plain DOM，端口 `1425`
- 棋盘：垂直 10 格轨道（起点 1 → GOAL 10）
- 玩家骰池：7 颗"通用彩色骰"（点数 1-6，不区分颜色，简化原桌游 5 色）
- 疯狂骰：库存 16 颗，玩家初始 2 颗
- 难度牌：**只 I 段 6 张**（普通 ×4 + 事件 ×2），抽完洗回
- 一局长度：无回合上限，自然结束
- 玩家流程 A → B → C → D（决定骰量 / 掷骰 / 理智值检查 / 移动）
- 雪魔每回合自动推进（基线 + 玩家触发的额外推进）
- DeerAPI gpt-image-2 出图：至少 9 张（背景 ×1、玩家头像 ×1、雪魔头像 ×1、6 张难度牌插画）
- harness `scripts/simulate.ts` 三种 mode 都齐
- vitest 单测覆盖游戏逻辑 ≥ 70% 行

### 1.4 Phase 1 OUT（Phase 2 候选）
- II 段难度牌（4 张）
- 治疗行动（×4 弃骰退格）
- 冰斧牌
- 死亡区 6 点骰禁用规则
- 雪魔主动出招卡
- WIN/LOSE 分享功能（类似 wordle）
- 难度选择 / 多周目 / 存档 / 音效
- SWAS 部署上线

### 1.5 故意削减
- 原桌游"领队牌+顺位"在 1v1 无意义，删
- 原桌游"事件牌全员同投"在 1v1 退化为"玩家自动投，雪魔按推进表反应"，简化
- 治疗机制和滑落精确退格延后，理由是它们和雪魔追逐机制的交互需要试玩决定

---

## 2. 核心循环与规则

### 2.1 牌池与抽牌
- I 段牌组：6 张（普通 ×4 + 事件 ×2），开局洗一次
- 顶牌翻到"当前牌"位置；抽完整摞洗回继续
- 每张牌结构：

```ts
type Card = {
  id: string;
  name: string;
  type: 'normal' | 'event';
  minDice: number | 'ALL';   // 'ALL' = 自动用全部骰（事件牌）
  tasks: Task[];             // 普通牌 2-3 等级；事件牌 1 个综合公式
};

type Task = {
  requires: DiceCondition;
  advance: number;           // 命中后推进格数。负数 = 滑落
};

// 离散 union；后续 cards.ts 实现 6 张牌时落地具体形
type DiceCondition =
  | { kind: 'sum-at-least'; n: number }                                  // 点数和 ≥ n
  | { kind: 'sum-at-most'; n: number }                                   // 点数和 ≤ n（事件牌的"低端惩罚"用）
  | { kind: 'face-count'; face: 1 | 2 | 3 | 4 | 5 | 6; atLeast: number } // 某点至少 m 颗
  | { kind: 'same-face-groups'; count: number; groupSize: number }       // 出现 count 组、每组 groupSize 颗同点
  | { kind: 'distinct-faces'; atLeast: number };                         // 不同点数至少 m 种
```

- 普通牌：必须**先尝试最高等级**；命中最高就按最高 advance；否则掉到次高；任何等级都不命中 → 滑落
- 事件牌：跳过 A-D，自动按"点数总和"映射到牌上 advance/slide 公式

### 2.2 玩家回合 A — 决定骰量
- UI 显示当前牌 `minDice`
- 玩家从"可掷"区点选骰子到"已选"区
- `selected.length ≥ minDice` 才能进 B
- 玩家可少投不能低于 minDice；疯狂骰也算骰量

### 2.3 玩家回合 B — 掷骰
- 已选区骰子一次性掷出
- 重投：最多 2 次，每次可选任意子集，疯狂骰可重投
- Phase 1 不实现冰斧

### 2.4 玩家回合 C — 理智值检查
**规则**：本回合掷出的骰子中，疯狂骰 + "彩色骰中与该疯狂骰点数相同的骰"，全部归还到玩家手牌（不计入 D 的点数累加）。

例：投出 1(疯狂) + 1 + 4 + 6（彩色骰不分颜色，按点数标识）
→ 1(疯狂) 和 同点数的 1(彩) 归还到手牌
→ 剩 4 + 6 进 D，点数和 = 10

归还到手牌 = 下一回合 A 时可再选。这一步在 UI 上要有视觉反馈（疯狂骰发光 → 飞回"可掷"区）。

### 2.5 玩家回合 D — 移动棋子
- 用 C 剩余骰子的点数总和与当前牌的 task 比较
- 命中最高 task → 按该 task `advance` 推进
- 命中较低 task → 按较低 `advance`
- 一档都没命中 → **滑落**（Phase 1 简化为退 2 格固定，底部封死在格 1）
- 滑落同时**触发雪魔额外 +1**
- 滑落同时**触发疯狂骰获得**：库存有就拿 1 颗到玩家手牌

### 2.6 事件牌结算
- 事件牌翻出后跳过 A-D
- 系统自动用玩家"全部彩色 + 全部疯狂"骰投一次（无重投），按 C 做理智值检查
- 用 C 剩余骰子的点数总和与事件牌上的**绝对阈值**比较得出 advance 或 slide
  - 注：原桌游事件牌是多人按点数和**排名**比较，1v1 下无对手可比，本作改为**绝对阈值**
- 玩家无操作（只看动画）
- 事件牌额外触发雪魔 +2（与可能的滑落 +1 叠加）

### 2.7 雪魔结算（玩家 D 结束后立即）
推进格数 = 基线 + 触发 bonus 求和：

| 触发 | bonus |
|------|-------|
| 每回合基线 | +1 |
| 玩家本回合滑落 | +1 |
| 玩家本回合获得新疯狂骰 | +1（一次性，不按颗数累加） |
| 当前牌是事件牌 | +2 |

雪魔最远只能到玩家所在格 ── 到的瞬间游戏结束（判 LOSE）。

### 2.8 胜负判定（每回合末）
- 玩家格 ≥ 10 → **WIN**
- 雪魔格 ≥ 玩家格 → **LOSE**
- 同回合双触 → 优先 LOSE（雪魔扑到登顶不算赢，影院感更对）

### 2.9 起始状态
- 玩家格 = 1，雪魔格 = 0
- 玩家手牌：7 颗通用彩色骰（点数 1-6） + 2 颗疯狂骰
- 难度牌组：I 段 6 张洗好

### 2.10 平衡常量（`src/game/balance.ts` 单文件）
```ts
export const START_PLAYER_CELL          = 1;
export const START_DEMON_CELL           = 0;
export const START_MADNESS_DICE         = 2;
export const PLAYER_COLOR_DICE          = 7;
export const MADNESS_STOCK              = 16;
export const GOAL_CELL                  = 10;
export const DEMON_BASELINE_PER_ROUND   = 1;
export const DEMON_BONUS_ON_SLIDE       = 1;
export const DEMON_BONUS_ON_NEW_MADNESS = 1;
export const DEMON_BONUS_ON_EVENT       = 2;
export const SLIDE_BACK_CELLS           = 2;
export const MAX_REROLLS                = 2;
```

所有数值集中在这一个文件 = harness 可扫 = 平衡决策可回溯。

---

## 3. 架构与文件结构

参考 zomboy 模板，三层切：游戏纯函数核心 / UI 渲染 / harness 脚本。

```
climb-mountain/
├── index.html
├── package.json                    # vite + ts + vitest + tsx
├── tsconfig.json
├── vite.config.ts                  # 端口 1425
├── vitest.config.ts
├── docs/
│   ├── balance/                    # simulate.ts --report 输出落这
│   └── superpowers/
│       ├── plans/                  # writing-plans skill 出的实现计划
│       └── specs/
│           └── 2026-05-20-climb-mountain-design.md
├── src/
│   ├── main.ts                     # 启动、装 UI、串 rules
│   ├── game/
│   │   ├── types.ts                # Cell, Die, Card, GameState, Action, Phase
│   │   ├── balance.ts              # 全部可调常量（§2.10）
│   │   ├── cards.ts                # I 段 6 张牌的纯数据 + task 解析
│   │   ├── state.ts                # initialState(seed), 不可变快照
│   │   ├── rules.ts                # 单一入口 applyAction(state, action) → state'
│   │   ├── demon.ts                # 雪魔推进结算（纯函数）
│   │   └── ai.ts                   # Phase 1 占位，Phase 2 雪魔出招卡用
│   ├── ui/
│   │   ├── style.css               # 色卡 / 字体 / 间距（§4.5）
│   │   ├── board.ts                # 10 格山轨 + 双棋子渲染
│   │   ├── topBar.ts               # 标志区 + 当前难度牌
│   │   ├── playerPanel.ts          # 玩家骰池 4 区（可掷/已选/已用/治疗-Phase2 占位）
│   │   ├── demonPanel.ts           # 雪魔区（距离、推进 log）
│   │   ├── actionRail.ts           # 用 N 颗骰 / 掷骰 / 重新选 / 结算
│   │   ├── eventLog.ts             # 一行滚动文字
│   │   ├── cardModal.ts            # 难度牌详情弹窗
│   │   ├── rulesModal.ts           # 规则书弹窗
│   │   └── startMenu.ts            # 开局菜单
│   └── assets/                     # DeerAPI 出的 9 张图 + 字体
├── scripts/
│   ├── simulate.ts                 # harness：三 mode 合并到一文件
│   ├── gen_sprites.py              # 调 DeerAPI gpt-image-2 出 9 张图（沿用 zomboy）
│   └── chromakey.py                # #FF00FF 透明背景后处理（沿用 zomboy）
└── tests/                          # vitest
    ├── rules.test.ts
    ├── demon.test.ts
    ├── cards.test.ts
    ├── state-flow.test.ts
    └── eval-edge.test.ts
```

### 3.1 单一入口 applyAction
```ts
export type Action =
  | { kind: 'select-dice'; ids: DieId[] }
  | { kind: 'roll' }
  | { kind: 'reroll'; ids: DieId[] }
  | { kind: 'commit' }            // 玩家 D 结算，触发 C → D → demon
  | { kind: 'next-card' };        // 翻下张牌

export function applyAction(state: GameState, action: Action): GameState;
```

UI 和 harness 都通过 `applyAction` 改状态。**禁止从 UI 直接 mutate state**。

### 3.2 GameState 形态
```ts
export type GameState = {
  phase:
    | 'await-select'
    | 'await-roll'
    | 'await-reroll'
    | 'await-commit'
    | 'demon-advancing'
    | 'won'
    | 'lost';
  player: {
    cell: number;
    handDice: Die[];       // 还在玩家手里的骰
    selected: DieId[];     // 已选未投
    rolled: DieFace[];     // 已投显示点数
    rerollsLeft: number;
  };
  demon: { cell: number };
  deck: Card[];            // 待抽
  discard: Card[];         // 已用
  currentCard: Card | null;
  round: number;           // 第 N 回合（从 1 起）
  log: LogEntry[];         // 给 eventLog UI
  rng: RngState;           // seedable，供 harness
};
```

`rng` 显式持有 → harness 可复现 → 平衡报告可信。

### 3.3 模块依赖
```
main.ts → ui/* → applyAction(state, action) from rules.ts
                                ↓
                          state.ts / demon.ts / cards.ts / balance.ts (all pure)
scripts/simulate.ts → rules.ts 直接调（绕过 UI）
tests/*.test.ts     → rules.ts + 各 game/* 模块
```

---

## 4. UI 屏幕与布局

### 4.1 单屏布局
浏览器单页，三大区竖向堆叠（不滚动）：

```
┌──────────────────────────────────────────────────────────────┐
│  TopBar:  [DICE OF MADNESS · 克苏鲁雪山]      [当前难度牌]    │  ~80px
├──────────┬───────────────────────────┬───────────────────────┤
│  PlayerPanel (左)                    │  DemonPanel (右)      │
│   你 · 登山者                        │   雪魔 · AI 追兵      │
│   骰子 7  疯狂 2                     │   距离 7 格           │
│   ┌─────────────┐                   │   ▲ 本回合推进 +2     │
│   │ Board (中)  │                   │   触发: 滑落, 新疯狂  │
│   │  GOAL 10    │                    │                       │
│   │  9 ★        │                    │                       │
│   │  8 ★        │ ← 玩家棋子          │                       │
│   │  7 ◯ 雪魔→ │                     │                       │
│   │  6          │                    │                       │
│   │  5          │                    │                       │
│   │  4          │                    │                       │
│   │  3          │                    │                       │
│   │  2          │                    │                       │
│   │  1 ⬣ start  │                    │                       │
│   └─────────────┘                    │                       │
├──────────────────────────────────────────────────────────────┤
│  DicePool: 可掷 [⚀⚂⚄..]  已选 [..]  已用 [..]  ⚡疯狂 [..]   │  ~140px
│  ActionRail: [用 4 颗骰] [掷骰] [重新选] [结算]              │  ~56px
│  EventLog:   一行滚动文字，最新在右                          │  ~32px
└──────────────────────────────────────────────────────────────┘
```

棋盘是**一根垂直 10 格轨道，玩家和雪魔都在同一根上**。雪魔在玩家下方某一格用红色三角箭头标记；玩家用蓝色山形标记。

### 4.2 模态弹窗
- **CardModal**：点击"当前难度牌"放大看完整任务表 + 推进数
- **RulesModal**：右上"?"按钮永远可见，简化玩家手册 ≤ 300 字
- **StartMenu**：开局画面 `[开始游戏]` `[规则]`；输给雪魔后 StartMenu 顶部加 `[重开]`

### 4.3 关键交互
- **选骰**：可掷区点骰子 → 飞到"已选"区（CSS transition 200ms）
- **掷骰**：已选区骰子原地震动 → 1.0s 内停在新点数；疯狂骰用红色边框
- **重选/重投**：已选区任意子集点击 → 重投（rerollsLeft 减一）
- **结算**：触发 C → D → demon-advance 三段动画
  1. C：疯狂骰 + 同点数彩色骰发光 → 飞回"可掷"区
  2. D：剩余骰子点数累加显示 → 玩家棋子上跳 N 格（或滑落 2 格）
  3. demon-advance：雪魔棋子上跳 K 格，DemonPanel log "+1 基线 / +1 滑落 / ..."
- **总时长 ≤ 2 秒**；动画期间所有按钮 disabled

### 4.4 WIN / LOSE 屏
- **WIN**：玩家棋子触 GOAL → 全屏淡入"登顶"字样 + 摘要（K 回合、雪魔最近 M 格、累得 N 颗疯狂骰）
- **LOSE**：雪魔追上玩家 → 全屏淡入"被雪魔扑倒" + 同样摘要
- 两屏都有 `[重开]` `[回到主菜单]` 按钮

### 4.5 视觉规范（从 concept.png 抓）
- 主色：底 `#0F1820` / 面板 `#1B2C3C` / 边 `#25364A` / 强调（青） `#00A3B5` / 文字 `#C8D6E4`
- 红色仅用于：雪魔棋子、滑落 log、疯狂骰边框、LOSE 屏 → 高冲击保留
- 字体：标题 `Chakra Petch Bold` / 数字 `IBM Plex Mono Bold` / 正文 `Noto Sans SC Regular`
- 间距阶梯：`4 / 6 / 8 / 16 / 24 / 36 / 48 px`

### 4.6 美术资产
Phase 1 就调 DeerAPI gpt-image-2，**不用 SVG/CSS 凑**。最少 9 张：

| # | 资产 | 用途 |
|---|------|------|
| 1 | 山轨背景 | 棋盘中央的雪山长图 |
| 2 | 玩家头像 | PlayerPanel 顶部 |
| 3 | 雪魔头像 | DemonPanel 顶部 |
| 4-9 | 6 张难度牌插画 | 每张普通/事件牌一张 |

透明背景按 memory `feedback_deerapi_gpt_image_2_transparency.md`：#FF00FF chroma-key + PIL 后处理。生图脚本沿用 zomboy 的 `scripts/gen_sprites.py` + `scripts/chromakey.py` 思路。

---

## 5. 平衡 harness 与测试策略

### 5.1 simulate.ts 三 mode
单文件，Node 直跑 `tsx scripts/simulate.ts`：

**Mode A — 数值扫描（默认）**
跑 1000 局，seed 自递增。输出：
- 胜率
- 平均回合数
- 最终 player-demon 距离均值
- rounds-to-lose 分布
- 每张牌的抽到频次
- 平均滑落次数/局

**Mode B — 参数扫描**
```
$ tsx scripts/simulate.ts --sweep DEMON_BASELINE_PER_ROUND=0.5,0.8,1,1.2,1.5
```
对单常量扫描，每格点 1000 局，输出胜率曲线，找拐点。

**Mode C — 单局回放（调试）**
```
$ tsx scripts/simulate.ts --seed 42 --verbose
```
逐回合 log，可读 trace。

### 5.2 harness 不依赖 UI
`simulate.ts` 直接构造 `initialState({ seed })` → 循环 `pickAction(state)` → `applyAction(state, action)` 到 `phase ∈ {won, lost}`。

`pickAction` 是朴素 baseline：选所有可掷骰、不重投、自动 commit。这不模拟真实玩家但跑出"难度下限"。

**纪律**：只要 simulate.ts 直接调 `applyAction`，UI 改了不影响 harness。

### 5.3 单元测试（vitest）
| 文件 | 覆盖 |
|------|------|
| `rules.test.ts` | 每个 Action × 每个 phase 的合法/非法分支 |
| `demon.test.ts` | 推进公式：基线 + 各 bonus 加法、上限到玩家格 |
| `cards.test.ts` | 6 张牌 task 解析、最高等级优先、滑落分支 |
| `state-flow.test.ts` | 起手到 WIN / 起手到 LOSE 各一条 golden path |
| `eval-edge.test.ts` | 边界：seed 复现、双触判 LOSE、抽完牌洗回 |

目标：游戏逻辑 70% 行覆盖。UI 不强求。

### 5.4 Balance gate（试玩前必过）
- 胜率 ∈ [35%, 60%]（中位 45% 最理想）
- 平均回合数 ∈ [6, 12]
- 滑落事件平均 ≥ 1 次/局

不满足 → 调 `balance.ts` → 再跑，直到过 gate 才进试玩。

### 5.5 平衡报告归档
`simulate.ts --report` 多写一个：当前 `balance.ts` snapshot + 这次跑的统计 dump 到 `docs/balance/YYYY-MM-DD-run-N.md`，方便回看是哪次调到了哪个数。

---

## 6. Phase 2 准入门槛

### 6.1 Phase 1 完工标准
- 浏览器 `localhost:1425` 进得去
- 5 分钟内能玩完一局（不卡死、无 console error）
- WIN / LOSE 两条路都能走通
- vitest 全绿、simulate.ts 三 mode 全能跑
- DeerAPI 出齐 9 张图

### 6.2 playtest 信号（≥ 6 局）
回答 3 个二元问题：
1. **追兵紧张感**：每局有没有至少 1 次心跳加速的瞬间？
2. **决策有意义**：A 阶段选骰量犹豫过吗？还是无脑全选？
3. **再来一把**：输了之后想立刻重开吗？

**全 YES → Phase 2 启动**。任意 NO → 不加新功能，先修当前。

### 6.3 Phase 2 候选优先级
| 优先级 | 功能 | 触发依据 |
|--------|------|----------|
| P0 | 治疗行动 | 试玩反馈"疯狂骰堆得没办法处理" |
| P0 | 滑落退到棋盘数字（精确版） | 试玩反馈"滑落 2 格太机械" |
| P1 | II 段难度牌（+4 张） | P1 通过后想加深 |
| P1 | 冰斧牌 | 配合 II 段；给玩家一个"稳住"工具 |
| P2 | 死亡区 6 点骰禁用 | 仅在 II 段进了才有意义 |
| P2 | 雪魔出招卡 | 让 AI 有人格 |
| P3 | SWAS 部署上线 | 同 zomboy 流程 |
| P3 | WIN/LOSE 分享 | 类 wordle 文本 |

### 6.4 杀项目条件
- 三轮试玩（6 + 6 + 6 局）后核心问题仍有 ≥ 1 个 NO → 停项目
- 调了 ≥ 6 次 `balance.ts` 仍过不了 balance gate → 机制本身有问题，不是数值

### 6.5 文档与 commit 节奏
- 本规格：`docs/superpowers/specs/2026-05-20-climb-mountain-design.md`
- Phase 1 实现计划：`docs/superpowers/plans/2026-05-20-climb-mountain-plan-1-skeleton.md`（writing-plans skill 出）
- 每轮 balance run / playtest：`docs/balance/YYYY-MM-DD-run-N.md`
- commit 前缀：`feat(climb-mountain): ...` / `balance(climb-mountain): ...` / `docs(climb-mountain): ...`

---

## 附录 A — 难度牌素材（Phase 1 用 6 张）

从原桌游 I 段牌挑选 + 改造，对齐 1v1 节奏。具体数值留给实现阶段在 `cards.ts` 落地，本节只列骨架。

| # | 名 | 类型 | minDice | task 大致 |
|---|-----|------|---------|-----------|
| 1 | 迈向死亡 | 普通 | 1 | 出现 0 点 1 个→ +1；2+ 个→ +2 |
| 2 | 阿玛塔的凝视 | 普通 | 3 | 点数和 ≥6→ +1；≥13→ +3 |
| 3 | 沙萨纳·异常 | 普通 | 3 | 2 个同点→ +2；3 个同点→ +3；4 个同点→ +5 |
| 4 | 连续痛苦 | 普通 | 2 | 出现两个连续相同点 → 1 对 +1, 2 对 +2 |
| 5 | 哈斯特 | 事件 | ALL | 点数和 ≥ 15 → +3；≤ 5 → slide -2；中间不动 |
| 6 | 伊塔库亚 | 事件 | ALL | 不同点数 ≥ 5 种 → +3；≤ 2 种 → slide -2；中间不动 |

实际 task 精确数值与 `balance.ts` 平衡 gate 一起调，可能与原桌游有偏差。

---

## 附录 B — 决策溯源

| 决策 | 理由 |
|------|------|
| 雪魔=追兵而非镜像对手 | 用户在 brainstorming 时选定；最贴 concept.png 的两角色框架且不退化为多人 |
| Walking skeleton + gate 迭代 | 用户选定；防 banwei 项目堆功能拖死的复发 |
| concept.png 风格参考、非严格约束 | 用户选定；为追兵机制 HUD 留余地 |
| Phase 1 不做治疗 / 冰斧 / II 段 | 它们与追逐机制的交互需要试玩验证 |
| Phase 1 即调 DeerAPI 出图 | 用户明确"svg 很丑"；视觉品质是质量门槛 |
| 端口 1425 | 错开 zomboy 1424 |
| 同根 10 格轨双棋子 | 比 concept.png 双栏更省横向、追兵语义更直接 |
| 玩家初始疯狂 2 颗 | 桌游 2P 规则起点，比 3-4P 的 1 颗刺激 |
| 双触优先判 LOSE | 影院感更对 |
| 通用彩色骰不分 5 色 | Phase 1 无颜色任务条件，5 色是冗余 |
