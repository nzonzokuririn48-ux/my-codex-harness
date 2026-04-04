import { PIECE_LABELS, type MoveHistoryEntry } from '../engine/shogi';

const RANK_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];

export function formatMoveHistoryPosition(position: MoveHistoryEntry['to']): string {
  const file = 9 - position.col;
  const rank = RANK_LABELS[position.row] ?? '?';
  return `${file}${rank}`;
}

export function formatMoveHistoryEntry(entry: MoveHistoryEntry): string {
  const pieceLabel = `${entry.isPromoted ? '+' : ''}${PIECE_LABELS[entry.pieceType]}`;

  if (entry.from === 'drop') {
    return `${pieceLabel}* ${formatMoveHistoryPosition(entry.to)}`;
  }

  const captureSuffix = entry.capturedPieceType
    ? ` x${PIECE_LABELS[entry.capturedPieceType]}`
    : '';

  return `${pieceLabel} ${formatMoveHistoryPosition(entry.from)}->${formatMoveHistoryPosition(entry.to)}${captureSuffix}`;
}

export function buildMoveHistoryExportText(history: MoveHistoryEntry[]): string {
  return history
    .map((entry, index) => `${index + 1}. ${formatMoveHistoryEntry(entry)}`)
    .join('\n');
}
