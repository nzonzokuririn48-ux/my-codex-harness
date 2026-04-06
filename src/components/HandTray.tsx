import { type Hand, type HandPieceType, type Player } from '../engine/shogi';
import { Piece } from './Piece';

type DragPointerPayload = {
  pointerId: number;
  clientX: number;
  clientY: number;
  button: number;
  isPrimary: boolean;
};

type HandTrayProps = {
  owner: Player;
  hand: Hand;
  isActive: boolean;
  isDisabled: boolean;
  draggablePieceTypes: HandPieceType[];
  draggedPieceType: HandPieceType | null;
  selectedPiece: HandPieceType | null;
  onPiecePointerDown: (
    pieceType: HandPieceType,
    owner: Player,
    pointer: DragPointerPayload,
  ) => void;
  onSelectPiece: (pieceType: HandPieceType) => void;
};

const HAND_PIECE_ORDER: HandPieceType[] = [
  'rook',
  'bishop',
  'gold',
  'silver',
  'knight',
  'lance',
  'pawn',
];

export function HandTray({
  owner,
  hand,
  isActive,
  isDisabled,
  draggablePieceTypes,
  draggedPieceType,
  selectedPiece,
  onPiecePointerDown,
  onSelectPiece,
}: HandTrayProps) {
  return (
    <section
      className={[
        'hand-tray',
        `owner-${owner}`,
        owner === 'black' ? 'is-current-side' : 'is-opponent-side',
        isActive ? 'is-active' : '',
        isDisabled ? 'is-disabled' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="hand-tray-header">
        <strong className="hand-tray-owner">{owner === 'black' ? 'Black hand' : 'White hand'}</strong>
        {isActive && !isDisabled ? (
          <span className="hand-tray-state is-active">Turn</span>
        ) : null}
      </div>

      <div className="hand-piece-list">
        {HAND_PIECE_ORDER.flatMap((pieceType) =>
          Array.from({ length: hand[pieceType] }, (_, index) => {
            const isSelected = selectedPiece === pieceType;
            const isDraggable = draggablePieceTypes.includes(pieceType);
            const isDragOrigin = draggedPieceType === pieceType;

            return (
              <button
                key={`${pieceType}-${index}`}
                className={[
                  'hand-piece-button',
                  isSelected ? 'is-selected' : '',
                  isActive && !isDisabled ? 'is-available' : '',
                  isDraggable ? 'is-draggable' : '',
                  isDragOrigin ? 'is-drag-origin' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                disabled={isDisabled || !isActive}
                onClick={() => onSelectPiece(pieceType)}
                onPointerDown={(event) => {
                  if (!isDraggable) {
                    return;
                  }

                  onPiecePointerDown(pieceType, owner, {
                    pointerId: event.pointerId,
                    clientX: event.clientX,
                    clientY: event.clientY,
                    button: event.button,
                    isPrimary: event.isPrimary,
                  });
                }}
                type="button"
              >
                <span className="hand-piece-visual">
                  <Piece
                    isPromoted={false}
                    owner={owner}
                    type={pieceType}
                  />
                </span>
              </button>
            );
          }),
        )}
      </div>
    </section>
  );
}
