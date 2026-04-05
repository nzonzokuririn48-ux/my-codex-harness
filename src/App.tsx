import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import { BoardView } from './components/BoardView';
import { HandTray } from './components/HandTray';
import { MoveHistory } from './components/MoveHistory';
import { Piece as PieceView } from './components/Piece';
import { StartPrompt } from './components/StartPrompt';
import {
  type CpuAction,
  createInitialGameState,
  dropPiece,
  type GameState,
  getLegalActions,
  isCheckmate,
  isInCheck,
  getLegalDrops,
  getLegalMoves,
  getPromotionState,
  getWinner,
  movePiece,
  type HandPieceType,
  type Piece,
  type Player,
  type Position,
  type SetupMode,
} from './engine/shogi';
import {
  clearPersistedGameState,
  loadPersistedGameState,
  persistGameState,
} from './lib/persistence';
import { chooseCpuAction } from './lib/cpu';
import { buildMoveHistoryExportText } from './lib/moveHistory';

type PendingMove = {
  from: Position;
  to: Position;
};

type StartFlowState = {
  requiresChoice: boolean;
  savedGame: GameState | null;
};

type GameMode = 'local' | 'cpu';

type DragPointerPayload = {
  pointerId: number;
  clientX: number;
  clientY: number;
  button: number;
  isPrimary: boolean;
};

type BaseDragSession = {
  pointerId: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isActive: boolean;
};

type BoardDragSession = BaseDragSession & {
  kind: 'board';
  from: Position;
  piece: Piece;
};

type HandDragSession = BaseDragSession & {
  kind: 'hand';
  owner: Player;
  pieceType: HandPieceType;
};

type DragSession = BoardDragSession | HandDragSession;
type PieceMotion = {
  id: number;
  from: Position;
  to: Position;
} | null;

const GAME_MODE_STORAGE_KEY = 'shogi-app-mode';
const SETUP_MODE_STORAGE_KEY = 'shogi-app-setup-mode';
const DRAG_START_DISTANCE = 8;
const DRAG_CLICK_GUARD_MS = 250;
const PIECE_MOTION_DURATION_MS = 200;

function getPieceStatusText(piece: Piece | null | undefined): string {
  if (!piece) {
    return 'none';
  }

  return piece.isPromoted ? `+${piece.type}` : piece.type;
}

function getSelectionStatusText(
  piece: Piece | null | undefined,
  handPiece: HandPieceType | null,
): string {
  if (handPiece) {
    return `${handPiece} (hand)`;
  }

  return getPieceStatusText(piece);
}

function getPlayerLabel(player: Player): string {
  return player === 'black' ? 'Black' : 'White';
}

function getGameModeLabel(mode: GameMode): string {
  return mode === 'cpu' ? 'Vs CPU' : 'Local';
}

function getSetupModeLabel(mode: SetupMode): string {
  return mode === 'random' ? 'Random' : 'Standard';
}

function positionsMatch(left: Position | null, right: Position): boolean {
  return Boolean(left && left.row === right.row && left.col === right.col);
}

function isTargetPosition(positions: Position[], target: Position): boolean {
  return positions.some((position) => position.row === target.row && position.col === target.col);
}

function getBoardPositionFromPoint(clientX: number, clientY: number): Position | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const element = document.elementFromPoint(clientX, clientY);
  const squareElement = element?.closest('[data-board-square="true"]');

  if (!(squareElement instanceof HTMLElement)) {
    return null;
  }

  const row = Number(squareElement.dataset.row);
  const col = Number(squareElement.dataset.col);

  if (Number.isNaN(row) || Number.isNaN(col)) {
    return null;
  }

  return { row, col };
}

function getInteractionHint(args: {
  selectedPosition: Position | null;
  selectedHandPiece: HandPieceType | null;
  showPromotionChoice: boolean;
  isCpuTurn: boolean;
  winner: Player | null;
}): { title: string; detail: string; tone: 'neutral' | 'attention' | 'info' } | null {
  const {
    selectedPosition,
    selectedHandPiece,
    showPromotionChoice,
    isCpuTurn,
    winner,
  } = args;

  if (winner) {
    return null;
  }

  if (showPromotionChoice) {
    return {
      title: 'Promotion choice',
      detail: 'Choose whether to promote before play continues.',
      tone: 'attention',
    };
  }

  if (isCpuTurn) {
    return {
      title: 'CPU turn',
      detail: 'The board and hands are temporarily locked while White is choosing a move.',
      tone: 'info',
    };
  }

  if (selectedHandPiece) {
    return {
      title: 'Drop mode',
      detail: `Place the selected ${selectedHandPiece} on a highlighted square.`,
      tone: 'attention',
    };
  }

  if (selectedPosition) {
    return {
      title: 'Move mode',
      detail: 'Choose one of the highlighted destination squares.',
      tone: 'neutral',
    };
  }

  return {
    title: 'Ready',
    detail: 'Select one of the active player\'s pieces or choose a piece from hand.',
    tone: 'neutral',
  };
}

function createStartFlowState(): StartFlowState {
  const savedGame = loadPersistedGameState();

  return {
    requiresChoice: savedGame !== null,
    savedGame,
  };
}

function loadPersistedGameMode(): GameMode {
  if (typeof window === 'undefined') {
    return 'local';
  }

  const savedMode = window.localStorage.getItem(GAME_MODE_STORAGE_KEY);
  return savedMode === 'cpu' ? 'cpu' : 'local';
}

function persistGameMode(mode: GameMode): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(GAME_MODE_STORAGE_KEY, mode);
  } catch {
    // Ignore persistence failures and keep the live game usable.
  }
}

function loadPersistedSetupMode(): SetupMode {
  if (typeof window === 'undefined') {
    return 'standard';
  }

  const savedMode = window.localStorage.getItem(SETUP_MODE_STORAGE_KEY);
  return savedMode === 'random' ? 'random' : 'standard';
}

function persistSetupMode(mode: SetupMode): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(SETUP_MODE_STORAGE_KEY, mode);
  } catch {
    // Ignore persistence failures and keep the live app usable.
  }
}

function App() {
  const [startFlowState, setStartFlowState] = useState(() => createStartFlowState());
  const [gameMode, setGameMode] = useState<GameMode>(() => loadPersistedGameMode());
  const [setupMode, setSetupMode] = useState<SetupMode>(() => loadPersistedSetupMode());
  const [gameState, setGameState] = useState(() => createInitialGameState(setupMode));
  const [previousStates, setPreviousStates] = useState<GameState[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [selectedHandPiece, setSelectedHandPiece] = useState<HandPieceType | null>(null);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const [dragSession, setDragSession] = useState<DragSession | null>(null);
  const [pieceMotion, setPieceMotion] = useState<PieceMotion>(null);
  const dragSessionRef = useRef<DragSession | null>(null);
  const ignoreClicksUntilRef = useRef(0);
  const previousHistoryLengthRef = useRef<number | null>(null);
  const pieceMotionIdRef = useRef(0);
  const pieceMotionTimeoutRef = useRef<number | null>(null);
  const captureWinner = getWinner(gameState);
  const showPromotionChoice = pendingMove !== null;
  const otherPlayer = gameState.currentPlayer === 'black' ? 'white' : 'black';
  const checkmateWinner =
    captureWinner || !isCheckmate(gameState, gameState.currentPlayer)
      ? null
      : otherPlayer;
  const winner = captureWinner ?? checkmateWinner;
  const currentPlayerCheck = winner ? false : isInCheck(gameState, gameState.currentPlayer);
  const otherPlayerCheck = isInCheck(gameState, otherPlayer);
  const checkedPlayer = winner
    ? null
    : currentPlayerCheck
      ? gameState.currentPlayer
      : otherPlayerCheck
        ? otherPlayer
        : null;
  const isCpuTurn =
    gameMode === 'cpu' &&
    gameState.currentPlayer === 'white' &&
    winner === null &&
    !showPromotionChoice &&
    !startFlowState.requiresChoice;
  const isInteractionLocked = showPromotionChoice || isCpuTurn || winner !== null;

  const legalTargets = selectedPosition
    ? getLegalMoves(gameState, selectedPosition)
    : selectedHandPiece
      ? getLegalDrops(gameState, selectedHandPiece)
      : [];
  const draggableBoardPositions = isInteractionLocked
    ? []
    : gameState.board.flatMap((row, rowIndex) =>
        row.flatMap((piece, colIndex) => {
          if (!piece || piece.owner !== gameState.currentPlayer) {
            return [];
          }

          const position = { row: rowIndex, col: colIndex };
          return getLegalMoves(gameState, position).length > 0 ? [position] : [];
        }),
      );
  const draggableHandPieceTypes = isInteractionLocked
    ? []
    : (Object.entries(gameState.hands[gameState.currentPlayer]) as Array<[HandPieceType, number]>)
        .filter(([pieceType, count]) => count > 0 && getLegalDrops(gameState, pieceType).length > 0)
        .map(([pieceType]) => pieceType);
  const canUndo = previousStates.length > 0 && !showPromotionChoice && !isCpuTurn;
  const interactionHint = getInteractionHint({
    selectedPosition,
    selectedHandPiece,
    showPromotionChoice,
    isCpuTurn,
    winner,
  });

  useEffect(() => {
    dragSessionRef.current = dragSession;
  }, [dragSession]);

  useEffect(() => {
    if (pieceMotionTimeoutRef.current !== null) {
      window.clearTimeout(pieceMotionTimeoutRef.current);
      pieceMotionTimeoutRef.current = null;
    }

    if (previousHistoryLengthRef.current === null) {
      previousHistoryLengthRef.current = gameState.history.length;
      return;
    }

    if (gameState.history.length <= previousHistoryLengthRef.current) {
      previousHistoryLengthRef.current = gameState.history.length;
      setPieceMotion(null);
      return;
    }

    const latestEntry = gameState.history[gameState.history.length - 1];

    previousHistoryLengthRef.current = gameState.history.length;

    if (!latestEntry || latestEntry.from === 'drop') {
      setPieceMotion(null);
      return;
    }

    pieceMotionIdRef.current += 1;
    const nextMotion = {
      id: pieceMotionIdRef.current,
      from: latestEntry.from,
      to: latestEntry.to,
    };

    setPieceMotion(nextMotion);
    pieceMotionTimeoutRef.current = window.setTimeout(() => {
      setPieceMotion((current) => (current?.id === nextMotion.id ? null : current));
      pieceMotionTimeoutRef.current = null;
    }, PIECE_MOTION_DURATION_MS);
  }, [gameState.history]);

  useEffect(() => () => {
    if (pieceMotionTimeoutRef.current !== null) {
      window.clearTimeout(pieceMotionTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (startFlowState.requiresChoice) {
      return;
    }

    persistGameState(gameState);
  }, [gameState, startFlowState.requiresChoice]);

  useEffect(() => {
    persistGameMode(gameMode);
  }, [gameMode]);

  useEffect(() => {
    persistSetupMode(setupMode);
  }, [setupMode]);

  useEffect(() => {
    if (!dragSession) {
      return;
    }

    const activateDragSelection = (session: DragSession) => {
      if (session.kind === 'board') {
        setSelectedHandPiece(null);
        setSelectedPosition(session.from);
        return;
      }

      setSelectedPosition(null);
      setSelectedHandPiece(session.pieceType);
    };

    const finalizeDrag = (event: PointerEvent, cancelDrop: boolean) => {
      const session = dragSessionRef.current;

      if (!session || event.pointerId !== session.pointerId) {
        return;
      }

      const droppedPosition =
        !cancelDrop && session.isActive
          ? getBoardPositionFromPoint(event.clientX, event.clientY)
          : null;
      let committed = false;

      if (session.isActive && droppedPosition) {
        if (session.kind === 'board') {
          const legalMoves = getLegalMoves(gameState, session.from);

          if (isTargetPosition(legalMoves, droppedPosition)) {
            const draggedPiece = gameState.board[session.from.row][session.from.col];

            if (draggedPiece) {
              const promotionState = getPromotionState(
                draggedPiece,
                session.from.row,
                droppedPosition.row,
              );

              if (promotionState === 'required') {
                setPreviousStates((states) => [...states, gameState]);
                setGameState(movePiece(gameState, session.from, droppedPosition, true));
                setSelectedPosition(null);
                setSelectedHandPiece(null);
                setPendingMove(null);
                committed = true;
              } else if (promotionState === 'optional') {
                setPendingMove({
                  from: session.from,
                  to: droppedPosition,
                });
                setSelectedPosition(null);
                setSelectedHandPiece(null);
                committed = true;
              } else {
                setPreviousStates((states) => [...states, gameState]);
                setGameState(movePiece(gameState, session.from, droppedPosition));
                setSelectedPosition(null);
                setSelectedHandPiece(null);
                setPendingMove(null);
                committed = true;
              }
            }
          }
        } else {
          const legalDrops = getLegalDrops(gameState, session.pieceType);

          if (isTargetPosition(legalDrops, droppedPosition)) {
            setPreviousStates((states) => [...states, gameState]);
            setGameState(dropPiece(gameState, session.pieceType, droppedPosition));
            setSelectedPosition(null);
            setSelectedHandPiece(null);
            setPendingMove(null);
            committed = true;
          }
        }
      }

      if (session.isActive && !committed) {
        activateDragSelection(session);
      }

      if (session.isActive) {
        ignoreClicksUntilRef.current = Date.now() + DRAG_CLICK_GUARD_MS;
      }

      setDragSession(null);
    };

    const handlePointerMove = (event: PointerEvent) => {
      const session = dragSessionRef.current;

      if (!session || event.pointerId !== session.pointerId) {
        return;
      }

      const distance = Math.hypot(
        event.clientX - session.startX,
        event.clientY - session.startY,
      );
      const shouldActivate = !session.isActive && distance >= DRAG_START_DISTANCE;

      if (!session.isActive && !shouldActivate) {
        return;
      }

      if (shouldActivate) {
        activateDragSelection(session);
      }

      event.preventDefault();
      setDragSession((current) => {
        if (!current || current.pointerId !== event.pointerId) {
          return current;
        }

        return {
          ...current,
          isActive: true,
          currentX: event.clientX,
          currentY: event.clientY,
        };
      });
    };

    const handlePointerUp = (event: PointerEvent) => {
      finalizeDrag(event, false);
    };

    const handlePointerCancel = (event: PointerEvent) => {
      finalizeDrag(event, true);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
    };
  }, [dragSession !== null, gameState]);

  const resetInteractionState = () => {
    setSelectedPosition(null);
    setSelectedHandPiece(null);
    setPendingMove(null);
    setDragSession(null);
  };

  const shouldIgnoreSyntheticClick = () => Date.now() < ignoreClicksUntilRef.current;

  const applyCpuAction = (action: CpuAction) => {
    setPreviousStates((states) => [...states, gameState]);

    if (action.kind === 'move') {
      setGameState(movePiece(gameState, action.from, action.to, action.promote));
    } else {
      setGameState(dropPiece(gameState, action.pieceType, action.to));
    }

    resetInteractionState();
  };

  const resetGame = () => {
    setGameState(createInitialGameState(setupMode));
    setPreviousStates([]);
    resetInteractionState();
  };

  const handleContinueSavedGame = () => {
    if (!startFlowState.savedGame) {
      setStartFlowState({
        requiresChoice: false,
        savedGame: null,
      });
      return;
    }

    setGameState(startFlowState.savedGame);
    setPreviousStates([]);
    resetInteractionState();
    setStartFlowState({
      requiresChoice: false,
      savedGame: null,
    });
  };

  const handleStartNewGame = () => {
    clearPersistedGameState();
    setGameState(createInitialGameState(setupMode));
    setPreviousStates([]);
    resetInteractionState();
    setStartFlowState({
      requiresChoice: false,
      savedGame: null,
    });
  };

  const handleGameModeChange = (nextMode: GameMode) => {
    if (gameMode === nextMode) {
      return;
    }

    setGameMode(nextMode);
    setGameState(createInitialGameState(setupMode));
    setPreviousStates([]);
    resetInteractionState();
  };

  const handleSetupModeChange = (nextMode: SetupMode) => {
    if (setupMode === nextMode) {
      return;
    }

    setSetupMode(nextMode);
    setGameState(createInitialGameState(nextMode));
    setPreviousStates([]);
    resetInteractionState();
  };

  const applyMove = (from: Position, to: Position, promote?: boolean) => {
    setPreviousStates((states) => [...states, gameState]);
    setGameState(movePiece(gameState, from, to, promote));
    resetInteractionState();
  };

  const applyDrop = (pieceType: HandPieceType, to: Position) => {
    setPreviousStates((states) => [...states, gameState]);
    setGameState(dropPiece(gameState, pieceType, to));
    resetInteractionState();
  };

  const handleUndo = () => {
    if (!canUndo) {
      return;
    }

    const previousState = previousStates[previousStates.length - 1];

    if (!previousState) {
      return;
    }

    setGameState(previousState);
    setPreviousStates((states) => states.slice(0, -1));
    resetInteractionState();
  };

  const handlePromotionChoice = (promote: boolean) => {
    if (!pendingMove) {
      return;
    }

    applyMove(pendingMove.from, pendingMove.to, promote);
  };

  const commitBoardMove = (from: Position, to: Position): boolean => {
    const legalMoves = getLegalMoves(gameState, from);

    if (!isTargetPosition(legalMoves, to)) {
      return false;
    }

    const selectedPiece = gameState.board[from.row][from.col];

    if (!selectedPiece) {
      return false;
    }

    const promotionState = getPromotionState(
      selectedPiece,
      from.row,
      to.row,
    );

    if (promotionState === 'required') {
      applyMove(from, to, true);
      return true;
    }

    if (promotionState === 'optional') {
      setPendingMove({
        from,
        to,
      });
      setSelectedPosition(null);
      return true;
    }

    applyMove(from, to);
    return true;
  };

  const commitHandDrop = (pieceType: HandPieceType, to: Position): boolean => {
    const legalDrops = getLegalDrops(gameState, pieceType);

    if (!isTargetPosition(legalDrops, to)) {
      return false;
    }

    applyDrop(pieceType, to);
    return true;
  };

  const handleSquareClick = (position: Position) => {
    if (shouldIgnoreSyntheticClick()) {
      return;
    }

    if (winner || showPromotionChoice || isCpuTurn) {
      return;
    }

    const clickedPiece = gameState.board[position.row][position.col];

    if (
      clickedPiece &&
      clickedPiece.owner === gameState.currentPlayer
    ) {
      setSelectedHandPiece(null);
      setSelectedPosition(position);
      return;
    }

    if (selectedHandPiece) {
      if (!commitHandDrop(selectedHandPiece, position)) {
        setSelectedHandPiece(null);
      }
      return;
    }

    if (!selectedPosition) {
      return;
    }

    if (!commitBoardMove(selectedPosition, position)) {
      setSelectedPosition(null);
    }
  };

  const handleHandPieceSelect = (pieceType: HandPieceType) => {
    if (shouldIgnoreSyntheticClick()) {
      return;
    }

    if (winner || showPromotionChoice || isCpuTurn) {
      return;
    }

    setSelectedPosition(null);
    setSelectedHandPiece((currentPiece) => (currentPiece === pieceType ? null : pieceType));
  };

  const handleBoardPiecePointerDown = (position: Position, pointer: DragPointerPayload) => {
    if (
      isInteractionLocked ||
      dragSessionRef.current ||
      !pointer.isPrimary ||
      pointer.button !== 0
    ) {
      return;
    }

    const piece = gameState.board[position.row][position.col];

    if (
      !piece ||
      piece.owner !== gameState.currentPlayer ||
      getLegalMoves(gameState, position).length === 0
    ) {
      return;
    }

    setDragSession({
      kind: 'board',
      pointerId: pointer.pointerId,
      startX: pointer.clientX,
      startY: pointer.clientY,
      currentX: pointer.clientX,
      currentY: pointer.clientY,
      isActive: false,
      from: position,
      piece,
    });
  };

  const handleHandPiecePointerDown = (
    pieceType: HandPieceType,
    owner: Player,
    pointer: DragPointerPayload,
  ) => {
    if (
      isInteractionLocked ||
      dragSessionRef.current ||
      !pointer.isPrimary ||
      pointer.button !== 0 ||
      owner !== gameState.currentPlayer ||
      gameState.hands[owner][pieceType] <= 0 ||
      getLegalDrops(gameState, pieceType).length === 0
    ) {
      return;
    }

    setDragSession({
      kind: 'hand',
      pointerId: pointer.pointerId,
      startX: pointer.clientX,
      startY: pointer.clientY,
      currentX: pointer.clientX,
      currentY: pointer.clientY,
      isActive: false,
      owner,
      pieceType,
    });
  };

  useEffect(() => {
    if (!isCpuTurn) {
      return;
    }

    const legalActions = getLegalActions(gameState);

    if (legalActions.length === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const action = chooseCpuAction(gameState, legalActions);

      if (!action) {
        return;
      }

      applyCpuAction(action);
    }, 450);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [gameState, isCpuTurn]);

  const handleExportMoves = () => {
    if (gameState.history.length === 0) {
      return;
    }

    const exportText = buildMoveHistoryExportText(gameState.history);
    const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = blobUrl;
    link.download = 'shogi-kifu.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  };

  const activePiece = selectedPosition
    ? gameState.board[selectedPosition.row][selectedPosition.col]
    : null;
  const pendingPromotionPiece = pendingMove
    ? gameState.board[pendingMove.from.row][pendingMove.from.col]
    : null;
  const draggedBoardPosition =
    dragSession?.kind === 'board' && dragSession.isActive ? dragSession.from : null;
  const draggedHandPiece =
    dragSession?.kind === 'hand' && dragSession.isActive ? dragSession.pieceType : null;

  if (startFlowState.requiresChoice) {
    return (
      <StartPrompt
        onContinue={handleContinueSavedGame}
        onStartNew={handleStartNewGame}
        onSetupModeChange={handleSetupModeChange}
        setupMode={setupMode}
      />
    );
  }

  return (
    <main className="app-shell">
      <section className={['app-panel', isInteractionLocked ? 'is-locked' : ''].filter(Boolean).join(' ')}>
        <header className="app-header">
          <div>
            <p className="eyebrow">Local Shogi</p>
            <h1>Shogi App</h1>
          </div>
          <div className="header-actions">
            <div className="mode-toggle" role="group" aria-label="Game mode">
              <button
                className={`mode-button${gameMode === 'local' ? ' is-active' : ''}`}
                onClick={() => handleGameModeChange('local')}
                type="button"
              >
                Local
              </button>
              <button
                className={`mode-button${gameMode === 'cpu' ? ' is-active' : ''}`}
                onClick={() => handleGameModeChange('cpu')}
                type="button"
              >
                Vs CPU
              </button>
            </div>
            <div className="mode-toggle" role="group" aria-label="Setup mode">
              <button
                className={`mode-button${setupMode === 'standard' ? ' is-active' : ''}`}
                onClick={() => handleSetupModeChange('standard')}
                type="button"
              >
                Standard
              </button>
              <button
                className={`mode-button${setupMode === 'random' ? ' is-active' : ''}`}
                onClick={() => handleSetupModeChange('random')}
                type="button"
              >
                Random
              </button>
            </div>
            <button
              className="secondary-button"
              disabled={!canUndo}
              onClick={handleUndo}
              type="button"
            >
              Undo
            </button>
            <button
              className="reset-button"
              onClick={resetGame}
              type="button"
            >
              Reset game
            </button>
          </div>
        </header>

        <div className="status-bar">
          <div>
            <span className="status-label">Turn</span>
            <strong>{winner ? 'Game Over' : getPlayerLabel(gameState.currentPlayer)}</strong>
          </div>
          <div>
            <span className="status-label">Selected</span>
            <strong>{getSelectionStatusText(activePiece, selectedHandPiece)}</strong>
          </div>
          <div>
            <span className="status-label">Result</span>
            <strong>
              {captureWinner
                ? `${getPlayerLabel(captureWinner)} wins`
                : checkmateWinner
                  ? `${getPlayerLabel(checkmateWinner)} wins by checkmate`
                  : 'in progress'}
            </strong>
          </div>
          <div>
            <span className="status-label">Mode</span>
            <strong>{getGameModeLabel(gameMode)}</strong>
          </div>
          <div>
            <span className="status-label">Setup</span>
            <strong>{getSetupModeLabel(setupMode)}</strong>
          </div>
        </div>

        {winner ? (
          <div className="game-banner game-banner-success">
            <strong>
              {captureWinner
                ? `${getPlayerLabel(captureWinner)} wins`
                : `${getPlayerLabel(checkmateWinner!)} wins by checkmate`}
            </strong>
            <button className="play-again-button" onClick={resetGame} type="button">
              Play again
            </button>
          </div>
        ) : checkedPlayer ? (
          <div className="game-banner game-banner-warning">
            <strong>{getPlayerLabel(checkedPlayer)} is in check</strong>
          </div>
        ) : isCpuTurn ? (
          <div className="game-banner game-banner-info">
            <strong>CPU is thinking...</strong>
          </div>
        ) : null}

        {interactionHint ? (
          <div className={`interaction-strip is-${interactionHint.tone}`}>
            <strong>{interactionHint.title}</strong>
            <span>{interactionHint.detail}</span>
          </div>
        ) : null}

        <div className="hand-layout">
          <HandTray
            draggablePieceTypes={gameState.currentPlayer === 'white' ? draggableHandPieceTypes : []}
            draggedPieceType={gameState.currentPlayer === 'white' ? draggedHandPiece : null}
            hand={gameState.hands.white}
            isActive={gameState.currentPlayer === 'white'}
            isDisabled={isInteractionLocked}
            onPiecePointerDown={handleHandPiecePointerDown}
            onSelectPiece={handleHandPieceSelect}
            owner="white"
            selectedPiece={gameState.currentPlayer === 'white' ? selectedHandPiece : null}
          />
          <HandTray
            draggablePieceTypes={gameState.currentPlayer === 'black' ? draggableHandPieceTypes : []}
            draggedPieceType={gameState.currentPlayer === 'black' ? draggedHandPiece : null}
            hand={gameState.hands.black}
            isActive={gameState.currentPlayer === 'black'}
            isDisabled={isInteractionLocked}
            onPiecePointerDown={handleHandPiecePointerDown}
            onSelectPiece={handleHandPieceSelect}
            owner="black"
            selectedPiece={gameState.currentPlayer === 'black' ? selectedHandPiece : null}
          />
        </div>

        <BoardView
          animatedMove={pieceMotion}
          board={gameState.board}
          draggablePositions={draggableBoardPositions}
          draggedFrom={draggedBoardPosition}
          interactionDisabled={isInteractionLocked}
          legalMoves={legalTargets}
          overlayContent={
            showPromotionChoice && pendingMove && pendingPromotionPiece ? (
              <div
                className={[
                  'promotion-choice',
                  pendingMove.to.row <= 2 ? 'is-below-anchor' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                aria-label="Promotion choice"
                style={{
                  '--promotion-col': String(pendingMove.to.col),
                  '--promotion-row': String(pendingMove.to.row),
                } as CSSProperties}
              >
                <span className="promotion-choice-title">Choose the piece face</span>
                <div className="promotion-choice-options">
                  <button
                    className="promotion-piece-button is-promote"
                    onClick={() => handlePromotionChoice(true)}
                    type="button"
                  >
                    <span className="promotion-piece-visual">
                      <PieceView
                        isPromoted={true}
                        owner={pendingPromotionPiece.owner}
                        type={pendingPromotionPiece.type}
                      />
                    </span>
                    <span className="promotion-piece-label">Promote</span>
                  </button>
                  <button
                    className="promotion-piece-button"
                    onClick={() => handlePromotionChoice(false)}
                    type="button"
                  >
                    <span className="promotion-piece-visual">
                      <PieceView
                        isPromoted={false}
                        owner={pendingPromotionPiece.owner}
                        type={pendingPromotionPiece.type}
                      />
                    </span>
                    <span className="promotion-piece-label">Keep</span>
                  </button>
                </div>
              </div>
            ) : null
          }
          onPiecePointerDown={handleBoardPiecePointerDown}
          onSquareClick={handleSquareClick}
          selectedPosition={selectedPosition}
          selectionMode={selectedHandPiece ? 'drop' : selectedPosition ? 'move' : 'idle'}
        />

        <MoveHistory history={gameState.history} onExport={handleExportMoves} />

        <p className="help-text">
          Select one of the active player&apos;s pieces, then choose a highlighted square.
          The app supports standard movement, captures, promotion choice, hand drops,
          move history, local two-player play, and a simple CPU. Random mode shuffles
          the back rank symmetrically while keeping pawns, rook, and bishop fixed.
        </p>
      </section>

      {dragSession?.isActive ? (
        <div
          aria-hidden="true"
          className="drag-piece-preview"
          style={{
            left: `${dragSession.currentX}px`,
            top: `${dragSession.currentY}px`,
          }}
        >
          <PieceView
            isPromoted={dragSession.kind === 'board' ? dragSession.piece.isPromoted : false}
            owner={dragSession.kind === 'board' ? dragSession.piece.owner : dragSession.owner}
            type={dragSession.kind === 'board' ? dragSession.piece.type : dragSession.pieceType}
          />
        </div>
      ) : null}
    </main>
  );
}

export default App;
