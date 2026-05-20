import type { Card, DiceCondition, DieFace } from "./types";

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
  // === Normal cards (4) ===
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
  // === Event cards (2) ===
  {
    id: "hastur",
    name: "哈斯特",
    type: "event",
    minDice: "ALL",
    hint: "事件牌不会自动替你玩；它会改变本回合的心理压力。",
    lore: "黄色的影子在暴雪之后短暂显形。它没有靠近，却让所有方向都变得像通往同一个舞台。",
    eventRule: "收手失败会额外招来雪魔。达到 15 点可获得一次大推进。",
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
    eventRule: "目标较高，但成功会把你快速推离雪魔。",
    tasks: [
      { requires: { kind: "score-at-least", n: 9 }, advance: 2 },
      { requires: { kind: "score-at-least", n: 14 }, advance: 3 },
    ],
  },
];
