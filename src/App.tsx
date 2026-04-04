import { useEffect, useState } from 'react';
import { BoardView } from './components/BoardView';
import { HandTray } from './components/HandTray';
import { MoveHistory } from './components/MoveHistory';
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

const GAME_MODE_STORAGE_KEY = 'shogi-app-mode';

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

function App() {
  const [startFlowState, setStartFlowState] = useState(() => createStartFlowState());
  const [gameMode, setGameMode] = useState<GameMode>(() => loadPersistedGameMode());
  const [gameState, setGameState] = useState(() => createInitialGameState());
  const [previousStates, setPreviousStates] = useState<GameState[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [selectedHandPiece, setSelectedHandPiece] = useState<HandPieceType | null>(null);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
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

  const legalTargets = selectedPosition
    ? getLegalMoves(gameState, selectedPosition)
    : selectedHandPiece
      ? getLegalDrops(gameState, selectedHandPiece)
      : [];
  const canUndo = previousStates.length > 0 && !showPromotionChoice && !isCpuTurn;

  useEffect(() => {
    if (startFlowState.requiresChoice) {
      return;
    }

    persistGameState(gameState);
  }, [gameState, startFlowState.requiresChoice]);

  useEffect(() => {
    persistGameMode(gameMode);
  }, [gameMode]);

  const resetInteractionState = () => {
    setSelectedPosition(null);
    setSelectedHandPiece(null);
    setPendingMove(null);
  };

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
    setGameState(createInitialGameState());
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
    setGameState(createInitialGameState());
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
    setGameState(createInitialGameState());
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

  const handleSquareClick = (position: Position) => {
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
      const isDropTarget = legalTargets.some(
        (move) => move.row === position.row && move.col === position.col,
      );

      if (!isDropTarget) {
        setSelectedHandPiece(null);
        return;
      }

      applyDrop(selectedHandPiece, position);
      return;
    }

    if (!selectedPosition) {
      return;
    }

    const isMoveTarget = legalTargets.some(
      (move) => move.row === position.row && move.col === position.col,
    );

    if (!isMoveTarget) {
      setSelectedPosition(null);
      return;
    }

    const selectedPiece = gameState.board[selectedPosition.row][selectedPosition.col];

    if (!selectedPiece) {
      setSelectedPosition(null);
      return;
    }

    const promotionState = getPromotionState(
      selectedPiece,
      selectedPosition.row,
      position.row,
    );

    if (promotionState === 'required') {
      applyMove(selectedPosition, position, true);
      return;
    }

    if (promotionState === 'optional') {
      setPendingMove({
        from: selectedPosition,
        to: position,
      });
      setSelectedPosition(null);
      return;
    }

    applyMove(selectedPosition, position);
  };

  const handleHandPieceSelect = (pieceType: HandPieceType) => {
    if (winner || showPromotionChoice || isCpuTurn) {
      return;
    }

    setSelectedPosition(null);
    setSelectedHandPiece((currentPiece) => (currentPiece === pieceType ? null : pieceType));
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

  if (startFlowState.requiresChoice) {
    return (
      <StartPrompt
        onContinue={handleContinueSavedGame}
        onStartNew={handleStartNewGame}
      />
    );
  }

  return (
    <main className="app-shell">
      <section className="app-panel">
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
            <strong>{winner ? 'Game over' : gameState.currentPlayer}</strong>
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
            <strong>{gameMode === 'cpu' ? 'vs CPU' : 'local'}</strong>
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

        <div className="hand-layout">
          <HandTray
            hand={gameState.hands.white}
            isActive={gameState.currentPlayer === 'white'}
            isDisabled={showPromotionChoice || winner !== null || isCpuTurn}
            onSelectPiece={handleHandPieceSelect}
            owner="white"
            selectedPiece={gameState.currentPlayer === 'white' ? selectedHandPiece : null}
          />
          <HandTray
            hand={gameState.hands.black}
            isActive={gameState.currentPlayer === 'black'}
            isDisabled={showPromotionChoice || winner !== null || isCpuTurn}
            onSelectPiece={handleHandPieceSelect}
            owner="black"
            selectedPiece={gameState.currentPlayer === 'black' ? selectedHandPiece : null}
          />
        </div>

        <BoardView
          board={gameState.board}
          legalMoves={legalTargets}
          onSquareClick={handleSquareClick}
          selectedPosition={selectedPosition}
        />

        <MoveHistory history={gameState.history} onExport={handleExportMoves} />

        {showPromotionChoice ? (
          <div
            aria-label="Promotion choice"
            style={{
              marginTop: '16px',
              padding: '14px 16px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.65)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '12px',
              alignItems: 'center',
            }}
          >
            <strong>Promote this piece?</strong>
            <button
              className="reset-button"
              onClick={() => handlePromotionChoice(true)}
              type="button"
            >
              Promote
            </button>
            <button
              onClick={() => handlePromotionChoice(false)}
              style={{
                border: '1px solid rgba(31, 41, 51, 0.18)',
                borderRadius: '999px',
                background: '#ffffff',
                color: '#1f2933',
                padding: '10px 16px',
                cursor: 'pointer',
              }}
              type="button"
            >
              Do not promote
            </button>
          </div>
        ) : null}

        <p className="help-text">
          Select one of the active player&apos;s pieces, then choose a highlighted square.
          The app supports standard movement, captures, promotion choice, hand drops,
          move history, local two-player play, and a simple random CPU mode.
        </p>
      </section>
    </main>
  );
}

export default App;
