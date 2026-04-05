import { type Board, type Position } from '../engine/shogi';
import { Piece } from './Piece';

type BoardViewProps = {
  board: Board;
  selectedPosition: Position | null;
  legalMoves: Position[];
  selectionMode: 'move' | 'drop' | 'idle';
  interactionDisabled: boolean;
  onSquareClick: (position: Position) => void;
};

function positionsMatch(left: Position | null, right: Position): boolean {
  return Boolean(left && left.row === right.row && left.col === right.col);
}

function isLegalTarget(position: Position, legalMoves: Position[]): boolean {
  return legalMoves.some((move) => move.row === position.row && move.col === position.col);
}

export function BoardView({
  board,
  selectedPosition,
  legalMoves,
  selectionMode,
  interactionDisabled,
  onSquareClick,
}: BoardViewProps) {
  return (
    <div
      className={[
        'board-frame',
        interactionDisabled ? 'is-disabled' : '',
        selectionMode === 'move' ? 'is-move-mode' : '',
        selectionMode === 'drop' ? 'is-drop-mode' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="board-caption">
        <strong>
          {selectionMode === 'move'
            ? 'Move targets'
            : selectionMode === 'drop'
              ? 'Drop targets'
              : interactionDisabled
                ? 'Board locked'
                : 'Board ready'}
        </strong>
        <span>
          {selectionMode === 'move'
            ? 'Highlighted squares show legal destinations.'
            : selectionMode === 'drop'
              ? 'Highlighted squares show legal drop positions.'
              : interactionDisabled
                ? 'Wait for the current prompt or turn to finish.'
                : 'Select a piece or a hand tile to begin.'}
        </span>
      </div>
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
                aria-pressed={isSelected}
                onClick={() => onSquareClick(position)}
                type="button"
              >
                {piece ? (
                  <Piece
                    isPromoted={piece.isPromoted}
                    owner={piece.owner}
                    type={piece.type}
                  />
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
