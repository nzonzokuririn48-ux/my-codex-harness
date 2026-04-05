import { type MoveHistoryEntry, type PieceType } from '../engine/shogi';

const RANK_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];
const PIECE_KANJI: Record<PieceType, { base: string; promoted?: string }> = {
  king: { base: '玉' },
  rook: { base: '飛', promoted: '龍' },
  bishop: { base: '角', promoted: '馬' },
  gold: { base: '金' },
  silver: { base: '銀', promoted: '全' },
  knight: { base: '桂', promoted: '圭' },
  lance: { base: '香', promoted: '杏' },
  pawn: { base: '歩', promoted: 'と' },
};

function getPieceKanji(pieceType: PieceType, isPromoted: boolean): string {
  const glyph = PIECE_KANJI[pieceType];
  return isPromoted && glyph.promoted ? glyph.promoted : glyph.base;
}

export function formatMoveHistoryPosition(position: MoveHistoryEntry['to']): string {
  const file = 9 - position.col;
  const rank = RANK_LABELS[position.row] ?? '?';
  return `${file}${rank}`;
}

export function formatMoveHistoryEntry(entry: MoveHistoryEntry): string {
  const pieceLabel = getPieceKanji(entry.pieceType, entry.isPromoted);

  if (entry.from === 'drop') {
    return `${pieceLabel}打 ${formatMoveHistoryPosition(entry.to)}`;
  }

  const captureSuffix = entry.capturedPieceType
    ? ` 取${PIECE_KANJI[entry.capturedPieceType].base}`
    : '';

  return `${pieceLabel} ${formatMoveHistoryPosition(entry.from)}→${formatMoveHistoryPosition(entry.to)}${captureSuffix}`;
}

export function buildMoveHistoryExportText(history: MoveHistoryEntry[]): string {
  return history
    .map((entry, index) => `${index + 1}. ${formatMoveHistoryEntry(entry)}`)
    .join('\n');
}
