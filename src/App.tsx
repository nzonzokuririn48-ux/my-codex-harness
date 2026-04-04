import { useState } from 'react';
import { BoardView } from './components/BoardView';
import {
  createInitialGameState,
  getLegalMoves,
  getPromotionState,
  getWinner,
  movePiece,
  type Position,
} from './engine/shogi';

type PendingMove = {
  from: Position;
  to: Position;
};

function App() {
  const [gameState, setGameState] = useState(() => createInitialGameState());
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const [showPromotionChoice, setShowPromotionChoice] = useState(false);
  const winner = getWinner(gameState);

  const legalMoves = selectedPosition ? getLegalMoves(gameState, selectedPosition) : [];

  const resetInteractionState = () => {
    setSelectedPosition(null);
    setPendingMove(null);
    setShowPromotionChoice(false);
  };

  const applyMove = (from: Position, to: Position, promote?: boolean) => {
    setGameState(movePiece(gameState, from, to, promote));
    resetInteractionState();
  };

  const handlePromotionChoice = (promote: boolean) => {
    if (!pendingMove) {
      return;
    }

    applyMove(pendingMove.from, pendingMove.to, promote);
  };

  const handleSquareClick = (position: Position) => {
    if (winner || showPromotionChoice) {
      return;
    }

    const clickedPiece = gameState.board[position.row][position.col];

    if (
      clickedPiece &&
      clickedPiece.owner === gameState.currentPlayer
    ) {
      setSelectedPosition(position);
      return;
    }

    if (!selectedPosition) {
      return;
    }

    const isMoveTarget = legalMoves.some(
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
      setShowPromotionChoice(true);
      return;
    }

    applyMove(selectedPosition, position);
  };

  const activePieceName = selectedPosition
    ? gameState.board[selectedPosition.row][selectedPosition.col]?.type ?? null
    : null;

  return (
    <main className="app-shell">
      <section className="app-panel">
        <header className="app-header">
          <div>
            <p className="eyebrow">Local Shogi</p>
            <h1>First playable build</h1>
          </div>
          <button
            className="reset-button"
            onClick={() => {
              setGameState(createInitialGameState());
              resetInteractionState();
            }}
            type="button"
          >
            Reset
          </button>
        </header>

        <div className="status-bar">
          <div>
            <span className="status-label">Turn</span>
            <strong>{winner ? 'Game over' : gameState.currentPlayer}</strong>
          </div>
          <div>
            <span className="status-label">Selected</span>
            <strong>{activePieceName ?? 'none'}</strong>
          </div>
          <div>
            <span className="status-label">Result</span>
            <strong>{winner ? `${winner} wins` : 'in progress'}</strong>
          </div>
        </div>

        <BoardView
          board={gameState.board}
          legalMoves={legalMoves}
          onSquareClick={handleSquareClick}
          selectedPosition={selectedPosition}
        />

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
          This version supports standard movement, captures, and promotion choice for local
          two-player play.
        </p>
      </section>
    </main>
  );
}

export default App;
