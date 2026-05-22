import type { GameState, ItemId, Phase } from "./types";

export type ItemDefinition = {
  id: ItemId;
  name: string;
  shortName: string;
  description: string;
};

export const itemDefinitions: Record<ItemId, ItemDefinition> = {
  "rope-anchor": {
    id: "rope-anchor",
    name: "锚定绳",
    shortName: "锚绳",
    description: "本轮若失败，取消滑落与新增疯狂。",
  },
  "frost-ember": {
    id: "frost-ember",
    name: "霜火余烬",
    shortName: "余烬",
    description: "本轮攀登值 +3。",
  },
  "salt-needle": {
    id: "salt-needle",
    name: "盐银针",
    shortName: "盐针",
    description: "从骰袋或本轮骰中净化 1 颗疯狂骰。",
  },
  "black-seal": {
    id: "black-seal",
    name: "黑曜封印",
    shortName: "封印",
    description: "本轮雪魔推进 -1，最低为 0。",
  },
  "bone-piton": {
    id: "bone-piton",
    name: "骨质岩钉",
    shortName: "岩钉",
    description: "本轮成功时额外前进 1 格。",
  },
};

export function itemDefinition(id: ItemId): ItemDefinition {
  return itemDefinitions[id];
}

export function canUseItem(state: GameState, id: ItemId): boolean {
  const allowedPhases: Phase[] = ["await-select", "await-roll", "await-reroll", "await-commit"];
  if (!allowedPhases.includes(state.phase)) return false;
  if (!state.currentCard) return false;

  if (id === "salt-needle") {
    return [...state.player.handDice, ...state.player.rolled].some((d) => d.kind === "madness");
  }

  return true;
}

