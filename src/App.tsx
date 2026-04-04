import { useState } from 'react';
import { BoardView } from './components/BoardView';
import {
  createInitialGameState,
  getLegalMoves,
  getWinner,
  movePiece,
  type Position,
} from './engine/shogi';

function App() {
  const [gameState, setGameState] = useState(() => createInitialGameState());
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const winner = getWinner(gameState);

  const legalMoves = selectedPosition ? getLegalMoves(gameState, selectedPosition) : [];

  const handleSquareClick = (position: Position) => {
    if (winner) {
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

    setGameState(movePiece(gameState, selectedPosition, position));
    setSelectedPosition(null);
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
              setSelectedPosition(null);
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

        <p className="help-text">
          Select one of the active player&apos;s pieces, then choose a highlighted square.
          This first version supports standard movement and captures for local two-player play.
        </p>
      </section>
    </main>
  );
}

export default App;
