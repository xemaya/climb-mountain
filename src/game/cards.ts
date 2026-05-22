import type { Card, DiceCondition, DieFace } from "./types";

export function conditionText(c: DiceCondition, short = false): string {
  if (short) {
    switch (c.kind) {
      case "score-at-least":          return `≥${c.n}`;
      case "sum-at-least":            return `总和≥${c.n}`;
      case "sum-at-most":             return `总和≤${c.n}`;
      case "face-count":              return `${c.face}点×${c.atLeast}`;
      case "same-face-groups":        return `${c.count}组同点`;
      case "distinct-faces":          return `${c.atLeast}种点数`;
      case "distinct-faces-at-most":  return `≤${c.n}种点数`;
    }
  }

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

export function evaluateCondition(cond: DiceCondition, scoreOrFaces: number | DieFace[], maybeFaces: DieFace[] = []): boolean {
  const score = Array.isArray(scoreOrFaces)
    ? scoreOrFaces.reduce<number>((a, b) => a + b, 0)
    : scoreOrFaces;
  const faces = Array.isArray(scoreOrFaces) ? scoreOrFaces : maybeFaces;

  switch (cond.kind) {
    case "score-at-least":
      return score >= cond.n;
    case "sum-at-least": {
      const sum = faces.reduce<number>((a, b) => a + b, 0);
      return sum >= cond.n;
    }
    case "sum-at-most": {
      const sum = faces.reduce<number>((a, b) => a + b, 0);
      return sum <= cond.n;
    }
    case "face-count": {
      const count = faces.filter((f) => f === cond.face).length;
      return count >= cond.atLeast;
    }
    case "same-face-groups": {
      const counts = new Map<DieFace, number>();
      for (const f of faces) counts.set(f, (counts.get(f) ?? 0) + 1);
      const groups = Array.from(counts.values()).filter((groupSize) => groupSize >= cond.groupSize).length;
      return groups >= cond.count;
    }
    case "distinct-faces": {
      return new Set(faces).size >= cond.atLeast;
    }
    case "distinct-faces-at-most": {
      return new Set(faces).size <= cond.n;
    }
  }
}

// Try tasks from highest-advance to lowest; return first match's advance.
// Returns null if nothing matches, which means the climber loses their footing.
export function resolveTask(card: Card, scoreOrFaces: number | DieFace[], faces: DieFace[] = []): number | null {
  const score = Array.isArray(scoreOrFaces)
    ? scoreOrFaces.reduce<number>((a, b) => a + b, 0)
    : scoreOrFaces;
  const resolvedFaces = Array.isArray(scoreOrFaces) ? scoreOrFaces : faces;
  const sorted = [...card.tasks].sort((a, b) => b.advance - a.advance);
  for (const t of sorted) {
    if (evaluateCondition(t.requires, score, resolvedFaces)) {
      return t.advance;
    }
  }
  return null;
}

export const allCards: Card[] = [
  // === Normal cards ===
  {
    id: "march-to-death",
    name: "迈向死亡",
    type: "normal",
    minDice: 1,
    hint: "低门槛危机。早收手能保命，继续赌可以争取更多步数。",
    lore: "远处的雪线像一排静默的葬旗，脚印在你身后被风迅速抹平。山体低鸣，仿佛在催促你继续向死亡迈步。",
    tasks: [
      { requires: { kind: "score-at-least", n: 4 }, advance: 1 },
      { requires: { kind: "score-at-least", n: 10 }, advance: 2 },
    ],
  },
  {
    id: "armata-stare",
    name: "阿玛塔的凝视",
    type: "normal",
    minDice: 3,
    hint: "标准攀登检定。8 点可保底，13 点是漂亮的一跃。",
    lore: "冰壁深处睁开一只不属于人间的眼。它没有瞳孔，却准确地凝视着你的每一次迟疑。",
    tasks: [
      { requires: { kind: "score-at-least", n: 8 }, advance: 1 },
      { requires: { kind: "score-at-least", n: 13 }, advance: 3 },
    ],
  },
  {
    id: "sasna-anomaly",
    name: "沙萨纳·异常",
    type: "normal",
    minDice: 3,
    hint: "异常地形需要更高攀登值，但高档收益更猛烈。",
    lore: "霜晶在岩缝中排成无法理解的几何。你越试图辨认它们，山路就越像梦境一样折叠。",
    tasks: [
      { requires: { kind: "score-at-least", n: 9 }, advance: 2 },
      { requires: { kind: "score-at-least", n: 14 }, advance: 4 },
      { requires: { kind: "score-at-least", n: 18 }, advance: 5 },
    ],
  },
  {
    id: "continuous-pain",
    name: "连续痛苦",
    type: "normal",
    minDice: 2,
    hint: "中等风险。拿到 7 点即可离开，12 点能稳步拉开距离。",
    lore: "疼痛从指节蔓延到脊背，像一根看不见的绳索拖慢你。继续攀登，或者承认身体已经开始背叛。",
    tasks: [
      { requires: { kind: "score-at-least", n: 7 }, advance: 1 },
      { requires: { kind: "score-at-least", n: 12 }, advance: 2 },
    ],
  },
  {
    id: "black-ice-traverse",
    name: "黑冰横切",
    type: "normal",
    minDice: 2,
    hint: "低分有路，高分才安全。别被第一颗好骰骗得太远。",
    lore: "冰面像无星的夜，鞋钉每一次落下都会听见玻璃下方的空响。",
    tasks: [
      { requires: { kind: "score-at-least", n: 6 }, advance: 1 },
      { requires: { kind: "score-at-least", n: 11 }, advance: 2 },
      { requires: { kind: "score-at-least", n: 16 }, advance: 3 },
    ],
  },
  {
    id: "thin-air",
    name: "稀薄之息",
    type: "normal",
    minDice: 2,
    hint: "中低门槛，但失败会很疼。适合用道具稳住。",
    lore: "空气被某种不可见的嘴吞掉了。你吸进胸腔的不是氧气，而是冷硬的空白。",
    tasks: [
      { requires: { kind: "score-at-least", n: 5 }, advance: 1 },
      { requires: { kind: "score-at-least", n: 12 }, advance: 3 },
    ],
  },
  {
    id: "dead-camp",
    name: "无人营地",
    type: "normal",
    minDice: 3,
    hint: "奖励偏高，但需要更贪一点。",
    lore: "帐篷仍然鼓着，却没有人影。炉灰里有新鲜的温度，也有不属于人类的指痕。",
    tasks: [
      { requires: { kind: "score-at-least", n: 9 }, advance: 2 },
      { requires: { kind: "score-at-least", n: 15 }, advance: 4 },
    ],
  },
  {
    id: "mirror-crevasse",
    name: "镜面裂隙",
    type: "normal",
    minDice: 2,
    hint: "疯狂骰越多越危险，尽量先净化骰袋。",
    lore: "裂隙深处映出一个比你快一步的人影。它每攀一寸，你的手指就冷一寸。",
    tasks: [
      { requires: { kind: "score-at-least", n: 7 }, advance: 1 },
      { requires: { kind: "score-at-least", n: 13 }, advance: 3 },
      { requires: { kind: "score-at-least", n: 17 }, advance: 4 },
    ],
  },
  {
    id: "choir-in-snow",
    name: "雪中合唱",
    type: "normal",
    minDice: 3,
    hint: "高风险高收益。适合在雪魔逼近前搏一把。",
    lore: "风声分裂成许多童声，它们用你母语之外的语调，为每一次坠落预先唱和。",
    tasks: [
      { requires: { kind: "score-at-least", n: 10 }, advance: 2 },
      { requires: { kind: "score-at-least", n: 16 }, advance: 4 },
      { requires: { kind: "score-at-least", n: 20 }, advance: 5 },
    ],
  },
  {
    id: "ashen-ladder",
    name: "灰烬天梯",
    type: "normal",
    minDice: 2,
    hint: "基础收益稳定，高档需要道具或好运。",
    lore: "岩壁上出现一串烧焦的手印，像有人从云层里一路爬下来，又倒着离开了世界。",
    tasks: [
      { requires: { kind: "score-at-least", n: 8 }, advance: 2 },
      { requires: { kind: "score-at-least", n: 14 }, advance: 3 },
    ],
  },
  // === Event cards ===
  {
    id: "hastur",
    name: "哈斯特",
    type: "event",
    minDice: "ALL",
    hint: "事件牌不会自动替你玩；它会改变本回合的心理压力。",
    lore: "黄色的影子在暴雪之后短暂显形。它没有靠近，却让所有方向都变得像通往同一个舞台。",
    eventRule: "挑战成功会获得道具。达到 15 点可获得一次大推进。",
    itemReward: "black-seal",
    tasks: [
      { requires: { kind: "score-at-least", n: 10 }, advance: 2 },
      { requires: { kind: "score-at-least", n: 15 }, advance: 4 },
    ],
  },
  {
    id: "ithaqua",
    name: "伊塔库亚",
    type: "event",
    minDice: "ALL",
    hint: "风暴会诱惑你多掷一颗。别忘了疯狂骰会直接扣分。",
    lore: "风中传来巨大脚步声，像天空本身正在下山。你必须借风前进，也可能被它直接带入深渊。",
    eventRule: "挑战成功会获得道具。目标较高，但收益也更大。",
    itemReward: "frost-ember",
    tasks: [
      { requires: { kind: "score-at-least", n: 9 }, advance: 2 },
      { requires: { kind: "score-at-least", n: 14 }, advance: 3 },
    ],
  },
  {
    id: "drowned-bell",
    name: "沉钟回响",
    type: "event",
    minDice: "ALL",
    hint: "中等挑战。成功后给你一根保命绳。",
    lore: "雪层下响起钟声，像有一座教堂被埋在山腹里。每一声都让冰层向内塌陷。",
    eventRule: "挑战成功会获得锚定绳。失败时雪魔照常逼近。",
    itemReward: "rope-anchor",
    tasks: [
      { requires: { kind: "score-at-least", n: 8 }, advance: 1 },
      { requires: { kind: "score-at-least", n: 13 }, advance: 3 },
    ],
  },
  {
    id: "red-aurora",
    name: "赤色极光",
    type: "event",
    minDice: "ALL",
    hint: "高分事件。成功后能获得额外推进型道具。",
    lore: "天空裂开一道红光，像有什么东西在苍穹后方用指甲划过。山影全部朝你跪伏。",
    eventRule: "挑战成功会获得骨质岩钉。高档收益非常可观。",
    itemReward: "bone-piton",
    tasks: [
      { requires: { kind: "score-at-least", n: 11 }, advance: 2 },
      { requires: { kind: "score-at-least", n: 17 }, advance: 5 },
    ],
  },
  {
    id: "salt-idol",
    name: "盐像低语",
    type: "event",
    minDice: "ALL",
    hint: "净化事件。成功后能拿到清理疯狂骰的道具。",
    lore: "一尊盐白色小像立在雪窝里，五官已经融化，却仍准确地朝着你开口。",
    eventRule: "挑战成功会获得盐银针，用来净化疯狂骰。",
    itemReward: "salt-needle",
    tasks: [
      { requires: { kind: "score-at-least", n: 7 }, advance: 1 },
      { requires: { kind: "score-at-least", n: 12 }, advance: 2 },
    ],
  },
  {
    id: "starless-summit",
    name: "无星峰顶",
    type: "event",
    minDice: "ALL",
    hint: "后期事件。成功收益大，失败会浪费关键回合。",
    lore: "山顶短暂从云层里露出，却没有任何星光落在其上。它像一个不该被看见的答案。",
    eventRule: "挑战成功会获得黑曜封印。越往后越需要控制雪魔推进。",
    itemReward: "black-seal",
    tasks: [
      { requires: { kind: "score-at-least", n: 12 }, advance: 3 },
      { requires: { kind: "score-at-least", n: 18 }, advance: 5 },
    ],
  },
];
