import type { CSSProperties, ReactNode } from 'react';
import { type Board, type Position } from '../engine/shogi';
import { Piece } from './Piece';

type DragPointerPayload = {
  pointerId: number;
  clientX: number;
  clientY: number;
  button: number;
  isPrimary: boolean;
};

type BoardViewProps = {
  board: Board;
  animatedMove: {
    id: number;
    from: Position;
    to: Position;
  } | null;
  selectedPosition: Position | null;
  legalMoves: Position[];
  selectionMode: 'move' | 'drop' | 'idle';
  interactionDisabled: boolean;
  draggablePositions: Position[];
  draggedFrom: Position | null;
  overlayContent?: ReactNode;
  onPiecePointerDown: (position: Position, pointer: DragPointerPayload) => void;
  onSquareClick: (position: Position) => void;
};

const GRID_OFFSETS = Array.from({ length: 8 }, (_, index) => index + 1);

function positionsMatch(left: Position | null, right: Position): boolean {
  return Boolean(left && left.row === right.row && left.col === right.col);
}

function isLegalTarget(position: Position, legalMoves: Position[]): boolean {
  return legalMoves.some((move) => move.row === position.row && move.col === position.col);
}

export function BoardView({
  board,
  animatedMove,
  selectedPosition,
  legalMoves,
  selectionMode,
  interactionDisabled,
  draggablePositions,
  draggedFrom,
  overlayContent,
  onPiecePointerDown,
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
      <div className="board-grid" role="grid" aria-label="Shogi board">
        <svg
          aria-hidden="true"
          className="board-grid-overlay"
          focusable="false"
          preserveAspectRatio="none"
          viewBox="0 0 9 9"
        >
          <rect className="board-grid-border" x="0.5" y="0.5" width="8" height="8" />
          {GRID_OFFSETS.map((offset) => (
            <line
              key={`vertical-${offset}`}
              className="board-grid-line"
              x1={offset}
              x2={offset}
              y1="0"
              y2="9"
            />
          ))}
          {GRID_OFFSETS.map((offset) => (
            <line
              key={`horizontal-${offset}`}
              className="board-grid-line"
              x1="0"
              x2="9"
              y1={offset}
              y2={offset}
            />
          ))}
        </svg>

        <div className="board-grid-cells">
          {board.map((row, rowIndex) =>
            row.map((piece, colIndex) => {
              const position = { row: rowIndex, col: colIndex };
              const isSelected = positionsMatch(selectedPosition, position);
              const isTarget = isLegalTarget(position, legalMoves);
              const isCaptureTarget = isTarget && Boolean(piece);
              const isDraggable = Boolean(
                piece && draggablePositions.some((candidate) => positionsMatch(candidate, position)),
              );
              const isDragOrigin = positionsMatch(draggedFrom, position);
              const isAnimatedDestination = Boolean(
                piece && animatedMove && positionsMatch(animatedMove.to, position),
              );
              const motionDeltaRow =
                isAnimatedDestination && animatedMove ? animatedMove.to.row - animatedMove.from.row : 0;
              const motionDeltaCol =
                isAnimatedDestination && animatedMove ? animatedMove.to.col - animatedMove.from.col : 0;

              return (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  className={[
                    'board-square',
                    isSelected ? 'is-selected' : '',
                    isTarget ? 'is-target' : '',
                    isCaptureTarget ? 'is-capture-target' : '',
                    isDraggable ? 'is-draggable' : '',
                    isDragOrigin ? 'is-drag-origin' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  aria-pressed={isSelected}
                  data-board-square="true"
                  data-col={colIndex}
                  data-row={rowIndex}
                  onClick={() => onSquareClick(position)}
                  onPointerDown={(event) => {
                    if (!isDraggable) {
                      return;
                    }

                    onPiecePointerDown(position, {
                      pointerId: event.pointerId,
                      clientX: event.clientX,
                      clientY: event.clientY,
                      button: event.button,
                      isPrimary: event.isPrimary,
                    });
                  }}
                  type="button"
                >
                  {isCaptureTarget ? (
                    <span className="capture-indicator" aria-hidden="true" />
                  ) : null}
                  {piece ? (
                    <span
                      className={[
                        'board-piece-motion',
                        isAnimatedDestination ? 'is-animating' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      key={isAnimatedDestination && animatedMove ? `motion-${animatedMove.id}` : 'static'}
                      style={
                        isAnimatedDestination
                          ? ({
                              '--move-dx': String(motionDeltaCol),
                              '--move-dy': String(motionDeltaRow),
                            } as CSSProperties)
                          : undefined
                      }
                    >
                      <span className="board-piece-wrapper">
                        <Piece
                          isPromoted={piece.isPromoted}
                          owner={piece.owner}
                          type={piece.type}
                        />
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
        {overlayContent ? (
          <div className="board-grid-floating-overlay">
            {overlayContent}
          </div>
        ) : null}
      </div>
    </div>
  );
}
