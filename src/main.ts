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
import { renderStartMenu } from "./ui/startMenu";
import { renderEndScreen } from "./ui/endScreen";
import { renderActiveCard } from "./ui/activeCard";
import { renderCardIntro } from "./ui/cardIntro";
import type { Action, GameState } from "./game/types";

let state: GameState | null = null;
let acknowledgedRound = 0;
let rolling = false;

function startGame(): void {
  resetBoard();
  document.getElementById("board")!.innerHTML = "";
  acknowledgedRound = 0;
  rolling = false;
  state = initialState(Math.floor(Math.random() * 1e6));
  render();
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

function dispatch(a: Action): void {
  if (!state) return;
  const roundReady = acknowledgedRound === state.round;
  if (!roundReady || rolling) return;

  if (a.kind === "draw-die") {
    rolling = true;
    render();
    setTimeout(() => {
      if (!state) return;
      state = applyAction(state, a);
      rolling = false;
      render();
    }, 1000);
    return;
  }

  if (a.kind === "commit") {
    const postCommit = applyAction(state, a);
    
    // Set to the next round state but clamp phase to "resolving" (climbing active)
    state = { 
      ...postCommit, 
      phase: "resolving" 
    };
    render();
    
    // Allow pawns to complete their move animation and camera to zoom in/out
    setTimeout(() => {
      if (!state) return;
      
      // If the game is won or lost, proceed to the terminal screen
      if (postCommit.phase === "won" || postCommit.phase === "lost") {
        state = postCommit;
        render();
        handleTerminal(0);
        return;
      }
      
      // Otherwise, unlock the "await-select" phase, allowing card intro modal to trigger
      state = {
        ...postCommit,
        phase: "await-select"
      };
      render();
    }, 2500);
    return;
  }

  state = applyAction(state, a);
  render();
}

function render(): void {
  if (!state) return;
  const roundReady = acknowledgedRound === state.round;
  const appEl = document.getElementById("app");
  if (appEl) {
    appEl.className = `mobile-frame phase-${state.phase}${roundReady ? " round-ready" : " round-intro"}`;
  }
  renderTopBar(document.getElementById("top-bar")!, state, dispatch);
  renderBoard(document.getElementById("board")!, state);
  renderPlayerPanel(document.getElementById("player-panel")!, state, dispatch);
  renderDemonPanel(document.getElementById("demon-panel")!, state, dispatch);
  renderActiveCard(document.getElementById("active-card-panel")!, state);
  renderDicePool(document.getElementById("dice-pool")!, state, dispatch, {
    visible: roundReady && (rolling || state.player.rolled.length > 0),
    rolling,
  });
  renderActionRail(document.getElementById("action-rail")!, state, dispatch, {
    visible: roundReady && state.phase === "await-select",
    rolling,
  });
  renderEventLog(document.getElementById("event-log")!, state);

  const modalRoot = document.getElementById("modal-root");
  if (modalRoot && state.phase === "await-select" && state.currentCard && !roundReady) {
    renderCardIntro(modalRoot, state.currentCard, () => {
      if (!state) return;
      acknowledgedRound = state.round;
      modalRoot.innerHTML = "";
      render();
    });
  } else if (modalRoot?.firstElementChild?.classList.contains("card-intro-bg")) {
    modalRoot.innerHTML = "";
  }
}

document.addEventListener("open-card-modal", () => {
  if (state?.currentCard) openCardModal(state.currentCard);
});

showStart();
