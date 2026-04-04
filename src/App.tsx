import { useState } from 'react';
import { BoardView } from './components/BoardView';
import { HandTray } from './components/HandTray';
import {
  createInitialGameState,
  dropPiece,
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

type PendingMove = {
  from: Position;
  to: Position;
};

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

function App() {
  const [gameState, setGameState] = useState(() => createInitialGameState());
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

  const legalTargets = selectedPosition
    ? getLegalMoves(gameState, selectedPosition)
    : selectedHandPiece
      ? getLegalDrops(gameState, selectedHandPiece)
      : [];

  const resetInteractionState = () => {
    setSelectedPosition(null);
    setSelectedHandPiece(null);
    setPendingMove(null);
  };

  const applyMove = (from: Position, to: Position, promote?: boolean) => {
    setGameState(movePiece(gameState, from, to, promote));
    resetInteractionState();
  };

  const applyDrop = (pieceType: HandPieceType, to: Position) => {
    setGameState(dropPiece(gameState, pieceType, to));
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
    if (winner || showPromotionChoice) {
      return;
    }

    setSelectedPosition(null);
    setSelectedHandPiece((currentPiece) => (currentPiece === pieceType ? null : pieceType));
  };

  const activePiece = selectedPosition
    ? gameState.board[selectedPosition.row][selectedPosition.col]
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
        </div>

        {captureWinner ? (
          <div
            style={{
              marginBottom: '20px',
              padding: '12px 16px',
              borderRadius: '16px',
              background: 'rgba(47, 111, 88, 0.12)',
              border: '1px solid rgba(47, 111, 88, 0.24)',
            }}
          >
            <strong>{getPlayerLabel(captureWinner)} wins</strong>
          </div>
        ) : checkmateWinner ? (
          <div
            style={{
              marginBottom: '20px',
              padding: '12px 16px',
              borderRadius: '16px',
              background: 'rgba(47, 111, 88, 0.12)',
              border: '1px solid rgba(47, 111, 88, 0.24)',
            }}
          >
            <strong>{getPlayerLabel(checkmateWinner)} wins by checkmate</strong>
          </div>
        ) : checkedPlayer ? (
          <div
            style={{
              marginBottom: '20px',
              padding: '12px 16px',
              borderRadius: '16px',
              background: 'rgba(186, 92, 34, 0.12)',
              border: '1px solid rgba(186, 92, 34, 0.24)',
            }}
          >
            <strong>{getPlayerLabel(checkedPlayer)} is in check</strong>
          </div>
        ) : null}

        <div className="hand-layout">
          <HandTray
            hand={gameState.hands.white}
            isActive={gameState.currentPlayer === 'white'}
            isDisabled={showPromotionChoice || winner !== null}
            onSelectPiece={handleHandPieceSelect}
            owner="white"
            selectedPiece={gameState.currentPlayer === 'white' ? selectedHandPiece : null}
          />
          <HandTray
            hand={gameState.hands.black}
            isActive={gameState.currentPlayer === 'black'}
            isDisabled={showPromotionChoice || winner !== null}
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
          This version supports standard movement, captures, promotion choice, and hand drops
          for local two-player play.
        </p>
      </section>
    </main>
  );
}

export default App;
