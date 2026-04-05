import { type MoveHistoryEntry, type PieceType } from '../engine/shogi';

const FILE_LABELS = ['\uff19', '\uff18', '\uff17', '\uff16', '\uff15', '\uff14', '\uff13', '\uff12', '\uff11'];
const RANK_LABELS = ['\u4e00', '\u4e8c', '\u4e09', '\u56db', '\u4e94', '\u516d', '\u4e03', '\u516b', '\u4e5d'];
const PIECE_KANJI: Record<PieceType, { base: string; promoted?: string }> = {
  king: { base: '\u7389' },
  rook: { base: '\u98db', promoted: '\u9f8d' },
  bishop: { base: '\u89d2', promoted: '\u99ac' },
  gold: { base: '\u91d1' },
  silver: { base: '\u9280', promoted: '\u5168' },
  knight: { base: '\u6842', promoted: '\u572d' },
  lance: { base: '\u9999', promoted: '\u674f' },
  pawn: { base: '\u6b69', promoted: '\u3068' },
};

function getPieceKanji(pieceType: PieceType, isPromoted: boolean): string {
  const glyph = PIECE_KANJI[pieceType];
  return isPromoted && glyph.promoted ? glyph.promoted : glyph.base;
}

export function formatMoveHistoryPosition(position: MoveHistoryEntry['to']): string {
  const file = FILE_LABELS[position.col] ?? '?';
  const rank = RANK_LABELS[position.row] ?? '?';
  return `${file}${rank}`;
}

export function formatMoveHistoryEntry(entry: MoveHistoryEntry): string {
  const pieceLabel = getPieceKanji(entry.pieceType, entry.isPromoted);

  if (entry.from === 'drop') {
    return `${pieceLabel}\u6253 ${formatMoveHistoryPosition(entry.to)}`;
  }

  const captureSuffix = entry.capturedPieceType
    ? ` \u53d6${PIECE_KANJI[entry.capturedPieceType].base}`
    : '';

  return `${pieceLabel} ${formatMoveHistoryPosition(entry.from)}\u2192${formatMoveHistoryPosition(entry.to)}${captureSuffix}`;
}

export function buildMoveHistoryExportText(history: MoveHistoryEntry[]): string {
  return history
    .map((entry, index) => `${index + 1}. ${formatMoveHistoryEntry(entry)}`)
    .join('\n');
}
