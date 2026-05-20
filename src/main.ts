import { initialState } from "./game/state";
import { applyAction } from "./game/rules";
import { renderBoard, resetBoard } from "./ui/board";
import { renderTopBar } from "./ui/topBar";
import { renderPlayerPanel } from "./ui/playerPanel";
import { renderDemonPanel } from "./ui/demonPanel";
import { renderDicePool } from "./ui/dicePool";
import { renderActionRail } from "./ui/actionRail";
import { renderEventLog } from "./ui/eventLog";
import { openCardModal } from "./ui/cardModal";
import { openRulesModal } from "./ui/rulesModal";
import { renderStartMenu } from "./ui/startMenu";
import { renderEndScreen } from "./ui/endScreen";
import { renderActiveCard } from "./ui/activeCard";
import type { Action, GameState } from "./game/types";

let state: GameState | null = null;

function startGame(): void {
  resetBoard();
  document.getElementById("board")!.innerHTML = "";
  state = initialState(Math.floor(Math.random() * 1e6));
  render();
  maybeAutoResolveEvent();
}

function showStart(): void {
  state = null;
  document
    .querySelectorAll("#top-bar, #board, #player-panel, #demon-panel, #dice-pool, #action-rail, #event-log, #active-card-panel")
    .forEach((el) => {
      (el as HTMLElement).innerHTML = "";
    });
  renderStartMenu(startGame);
}

function handleTerminal(delayMs: number): boolean {
  if (!state) return false;
  if (state.phase === "won" || state.phase === "lost") {
    setTimeout(() => {
      renderEndScreen(state!, startGame, showStart);
    }, delayMs);
    return true;
  }
  return false;
}

function maybeAutoResolveEvent(): void {
  if (!state) return;
  if (state.phase !== "await-select" || state.currentCard?.type !== "event") return;
  setTimeout(() => {
    if (!state) return;
    const postEvent = applyAction(state, { kind: "advance-event-card" });
    state = { ...state, phase: "resolving" };
    render();
    setTimeout(() => {
      state = postEvent;
      render();
      if (handleTerminal(2000)) return;
      maybeAutoResolveEvent();
    }, 200);
  }, 600);
}

function dispatch(a: Action): void {
  if (!state) return;

  if (a.kind === "commit") {
    const postCommit = applyAction(state, a);
    state = { ...state, phase: "resolving" };
    render();
    setTimeout(() => {
      state = postCommit;
      render();
      if (handleTerminal(2000)) return;
      maybeAutoResolveEvent();
    }, 200);
    return;
  }

  state = applyAction(state, a);
  render();
}

function render(): void {
  if (!state) return;
  const appEl = document.getElementById("app");
  if (appEl) {
    appEl.className = `mobile-frame phase-${state.phase}`;
  }
  renderTopBar(document.getElementById("top-bar")!, state, dispatch);
  renderBoard(document.getElementById("board")!, state);
  renderPlayerPanel(document.getElementById("player-panel")!, state, dispatch);
  renderDemonPanel(document.getElementById("demon-panel")!, state, dispatch);
  renderActiveCard(document.getElementById("active-card-panel")!, state.currentCard);
  renderDicePool(document.getElementById("dice-pool")!, state, dispatch);
  renderActionRail(document.getElementById("action-rail")!, state, dispatch);
  renderEventLog(document.getElementById("event-log")!, state);
}

document.addEventListener("open-card-modal", () => {
  if (state?.currentCard) openCardModal(state.currentCard);
});

const helpBtn = document.createElement("button");
helpBtn.className = "btn";
helpBtn.textContent = "规则 ?";
helpBtn.style.position = "fixed";
helpBtn.style.right = "var(--s-16)";
helpBtn.style.top = "var(--s-16)";
helpBtn.style.zIndex = "50";
helpBtn.addEventListener("click", openRulesModal);
document.body.appendChild(helpBtn);

showStart();
