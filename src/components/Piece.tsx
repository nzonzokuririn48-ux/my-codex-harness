import { useId } from 'react';
import {
  type PieceType,
  type Player,
} from '../engine/shogi';

type PieceProps = {
  type: PieceType;
  isPromoted: boolean;
  owner: Player;
};

const PIECE_GLYPHS: Record<PieceType, { base: string; promoted?: string }> = {
  king: { base: '\u7389' },
  rook: { base: '\u98db', promoted: '\u9f8d' },
  bishop: { base: '\u89d2', promoted: '\u99ac' },
  gold: { base: '\u91d1' },
  silver: { base: '\u9280', promoted: '\u5168' },
  knight: { base: '\u6842', promoted: '\u572d' },
  lance: { base: '\u9999', promoted: '\u674f' },
  pawn: { base: '\u6b69', promoted: '\u3068' },
};

export function Piece({ type, isPromoted, owner }: PieceProps) {
  const glyphSet = PIECE_GLYPHS[type];
  const label = isPromoted && glyphSet.promoted ? glyphSet.promoted : glyphSet.base;
  const isWhite = owner === 'white';
  const idBase = useId().replace(/:/g, '');
  const woodGradientId = `${idBase}-wood`;
  const grainGradientId = `${idBase}-grain`;
  const highlightGradientId = `${idBase}-highlight`;
  const bottomShadeId = `${idBase}-bottom-shade`;
  const tintGradientId = `${idBase}-player-tint`;
  const shadowId = `${idBase}-shadow`;

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
        viewBox="0 0 100 140"
      >
        <defs>
          <linearGradient id={woodGradientId} x1="0%" x2="0%" y1="4%" y2="100%">
            <stop
              offset="0%"
              stopColor={
                isPromoted
                  ? isWhite ? '#edd1b2' : '#f7e2c3'
                  : isWhite ? '#eddab7' : '#f6e3bd'
              }
            />
            <stop
              offset="46%"
              stopColor={
                isPromoted
                  ? isWhite ? '#d6a871' : '#e8c18a'
                  : isWhite ? '#c9965d' : '#e5bf85'
              }
            />
            <stop
              offset="100%"
              stopColor={
                isPromoted
                  ? isWhite ? '#b97e45' : '#d8a56a'
                  : isWhite ? '#a96f39' : '#cf9d57'
              }
            />
          </linearGradient>
          <linearGradient id={grainGradientId} x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.2)" />
            <stop offset="38%" stopColor="rgba(150,92,26,0.12)" />
            <stop offset="68%" stopColor="rgba(255,255,255,0.06)" />
            <stop offset="100%" stopColor="rgba(124,70,18,0.12)" />
          </linearGradient>
          <linearGradient id={highlightGradientId} x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,248,234,0.86)" />
            <stop offset="100%" stopColor="rgba(255,248,234,0)" />
          </linearGradient>
          <linearGradient id={bottomShadeId} x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(62,33,10,0.22)" />
          </linearGradient>
          <linearGradient id={tintGradientId} x1="0%" x2="100%" y1="0%" y2="100%">
            <stop
              offset="0%"
              stopColor={isWhite ? 'rgba(86,62,33,0.1)' : 'rgba(255,232,192,0.05)'}
            />
            <stop
              offset="100%"
              stopColor={isWhite ? 'rgba(58,39,16,0.16)' : 'rgba(92,54,16,0.04)'}
            />
          </linearGradient>
          <filter id={shadowId} x="-20%" y="-20%" width="140%" height="160%">
            <feDropShadow dx="0" dy="5" floodColor="rgba(58,33,10,0.22)" stdDeviation="4" />
          </filter>
        </defs>
        <g transform="translate(0 14)">
          <path
            className="svg-piece-shell"
            fill={`url(#${woodGradientId})`}
            filter={`url(#${shadowId})`}
            d="M50 6 L82 20 L90 106 L10 106 L18 20 Z"
          />
          <path
            className="svg-piece-grain"
            fill={`url(#${grainGradientId})`}
            d="M50 12 L76 24 L83 97 L17 97 L24 24 Z"
          />
          <path
          className="svg-piece-highlight"
          fill={`url(#${highlightGradientId})`}
          d="M50 12 L77 24 L72 55 L28 55 L23 24 Z"
        />
        <path
          className="svg-piece-player-tint"
          fill={`url(#${tintGradientId})`}
          d="M50 12 L76 24 L83 97 L17 97 L24 24 Z"
        />
        <path
          className="svg-piece-bottom-shadow"
          fill={`url(#${bottomShadeId})`}
          d="M18 66 L82 66 L86 102 L14 102 Z"
        />
        <path
          className="svg-piece-border"
          d="M50 10 L79 22 L86 100 L14 100 L21 22 Z"
        />
        <foreignObject className="svg-piece-glyph-box" x="22" y="32" width="56" height="48">
          <div className="svg-piece-glyph">
            {label}
          </div>
        </foreignObject>
      </g>
      </svg>
    </span>
  );
}
