import {
  PIECE_LABELS,
  type Hand,
  type HandPieceType,
  type Player,
} from '../engine/shogi';

type HandTrayProps = {
  owner: Player;
  hand: Hand;
  isActive: boolean;
  isDisabled: boolean;
  selectedPiece: HandPieceType | null;
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
  selectedPiece,
  onSelectPiece,
}: HandTrayProps) {
  return (
    <section
      className={[
        'hand-tray',
        `owner-${owner}`,
        isActive ? 'is-active' : '',
        isDisabled ? 'is-disabled' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="hand-tray-header">
        <span className="status-label">Hand</span>
        <strong>{owner === 'black' ? 'Black' : 'White'}</strong>
      </div>

      <div className="hand-piece-list">
        {HAND_PIECE_ORDER.map((pieceType) => {
          const count = hand[pieceType];
          const isSelected = selectedPiece === pieceType;

          return (
            <button
              key={pieceType}
              className={[
                'hand-piece-button',
                isSelected ? 'is-selected' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={isDisabled || !isActive || count === 0}
              onClick={() => onSelectPiece(pieceType)}
              type="button"
            >
              <span className="hand-piece-label">{PIECE_LABELS[pieceType]}</span>
              <span className="hand-piece-count">x{count}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
