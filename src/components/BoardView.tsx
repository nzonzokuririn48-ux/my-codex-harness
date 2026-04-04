import { PIECE_LABELS, type Board, type Position } from '../engine/shogi';

type BoardViewProps = {
  board: Board;
  selectedPosition: Position | null;
  legalMoves: Position[];
  onSquareClick: (position: Position) => void;
};

function positionsMatch(left: Position | null, right: Position): boolean {
  return Boolean(left && left.row === right.row && left.col === right.col);
}

function isLegalTarget(position: Position, legalMoves: Position[]): boolean {
  return legalMoves.some((move) => move.row === position.row && move.col === position.col);
}

function getPieceLabel(label: string, isPromoted: boolean): string {
  return isPromoted ? `+${label}` : label;
}

export function BoardView({
  board,
  selectedPosition,
  legalMoves,
  onSquareClick,
}: BoardViewProps) {
  return (
    <div className="board-frame">
      <div className="board-grid" role="grid" aria-label="Shogi board">
        {board.map((row, rowIndex) =>
          row.map((piece, colIndex) => {
            const position = { row: rowIndex, col: colIndex };
            const isSelected = positionsMatch(selectedPosition, position);
            const isTarget = isLegalTarget(position, legalMoves);

            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                className={[
                  'board-square',
                  isSelected ? 'is-selected' : '',
                  isTarget ? 'is-target' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onSquareClick(position)}
                type="button"
              >
                {piece ? (
                  <span className={`piece-chip owner-${piece.owner}`}>
                    <span className="piece-owner">{piece.owner === 'black' ? 'B' : 'W'}</span>
                    <span className="piece-label">
                      {getPieceLabel(PIECE_LABELS[piece.type], piece.isPromoted)}
                    </span>
                  </span>
                ) : isTarget ? (
                  <span className="target-dot" aria-hidden="true" />
                ) : null}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
