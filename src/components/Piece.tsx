import {
  PIECE_LABELS,
  type PieceType,
  type Player,
} from '../engine/shogi';

type PieceProps = {
  type: PieceType;
  isPromoted: boolean;
  owner: Player;
};

export function Piece({ type, isPromoted, owner }: PieceProps) {
  const label = PIECE_LABELS[type];

  return (
    <span
      aria-label={`${owner} ${isPromoted ? 'promoted ' : ''}${type}`}
      className={[
        'svg-piece',
        `owner-${owner}`,
        isPromoted ? 'is-promoted' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <svg
        aria-hidden="true"
        className="svg-piece-graphic"
        focusable="false"
        viewBox="0 0 100 120"
      >
        <polygon
          className="svg-piece-shell"
          points="50,5 92,28 79,113 21,113 8,28"
        />
        <polygon
          className="svg-piece-border"
          points="50,11 84,30 73,105 27,105 16,30"
        />
        {isPromoted ? (
          <g className="svg-piece-promotion">
            <rect className="svg-piece-promo-band" x="28" y="20" rx="4" ry="4" width="44" height="12" />
            <text className="svg-piece-promo-mark" x="50" y="29" textAnchor="middle">
              +
            </text>
          </g>
        ) : null}
        <text className="svg-piece-glyph" x="50" y="72" textAnchor="middle">
          {label}
        </text>
      </svg>
    </span>
  );
}
