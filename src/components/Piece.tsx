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
  const accentGradientId = `${idBase}-accent`;
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
        viewBox="0 0 100 120"
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
          <linearGradient id={accentGradientId} x1="0%" x2="0%" y1="0%" y2="100%">
            <stop offset="0%" stopColor="#c54e2d" />
            <stop offset="100%" stopColor="#8f2715" />
          </linearGradient>
          <filter id={shadowId} x="-20%" y="-20%" width="140%" height="160%">
            <feDropShadow dx="0" dy="5" floodColor="rgba(58,33,10,0.22)" stdDeviation="4" />
          </filter>
        </defs>
        <path
          className="svg-piece-shell"
          fill={`url(#${woodGradientId})`}
          filter={`url(#${shadowId})`}
          d="M10 6 L90 6 L82 82 L50 96 L18 82 Z"
        />
        <path
          className="svg-piece-grain"
          fill={`url(#${grainGradientId})`}
          d="M17 12 L83 12 L76 77 L50 88 L24 77 Z"
        />
        <path
          className="svg-piece-highlight"
          fill={`url(#${highlightGradientId})`}
          d="M18 12 L82 12 L78 46 L22 46 Z"
        />
        <path
          className="svg-piece-player-tint"
          fill={`url(#${tintGradientId})`}
          d="M17 12 L83 12 L76 77 L50 88 L24 77 Z"
        />
        <path
          className="svg-piece-bottom-shadow"
          fill={`url(#${bottomShadeId})`}
          d="M23 56 L77 56 L73 79 L50 89 L27 79 Z"
        />
        {isPromoted ? (
          <path
            className="svg-piece-promo-band"
            d="M30 18 L70 18 L66 29 L34 29 Z"
            fill={`url(#${accentGradientId})`}
          />
        ) : null}
        <path
          className="svg-piece-border"
          d="M14 10 L86 10 L79 79 L50 92 L21 79 Z"
        />
        <foreignObject className="svg-piece-glyph-box" x="21" y="26" width="58" height="54">
          <div className="svg-piece-glyph">
            {label}
          </div>
        </foreignObject>
      </svg>
    </span>
  );
}
