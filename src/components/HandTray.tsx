import { type Hand, type HandPieceType, type Player } from '../engine/shogi';
import { Piece } from './Piece';

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
        <div className="hand-tray-summary">
          <span className="status-label">Hand</span>
          <strong>{owner === 'black' ? 'Black' : 'White'}</strong>
        </div>
        <span className={`hand-tray-state ${isActive ? 'is-active' : ''}`}>
          {isDisabled ? 'Locked' : isActive ? 'Active' : 'Waiting'}
        </span>
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
                count > 0 && isActive && !isDisabled ? 'is-available' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              disabled={isDisabled || !isActive || count === 0}
              onClick={() => onSelectPiece(pieceType)}
              type="button"
            >
              <span className="hand-piece-visual">
                <Piece
                  isPromoted={false}
                  owner={owner}
                  type={pieceType}
                />
              </span>
              <span className="hand-piece-count">x{count}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
