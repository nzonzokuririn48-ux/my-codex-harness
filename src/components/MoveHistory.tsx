import { PIECE_LABELS, type MoveHistoryEntry } from '../engine/shogi';

type MoveHistoryProps = {
  history: MoveHistoryEntry[];
};

const RANK_LABELS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'];

function formatPosition(position: MoveHistoryEntry['to']): string {
  const file = 9 - position.col;
  const rank = RANK_LABELS[position.row] ?? '?';
  return `${file}${rank}`;
}

function formatEntry(entry: MoveHistoryEntry): string {
  const pieceLabel = `${entry.isPromoted ? '+' : ''}${PIECE_LABELS[entry.pieceType]}`;

  if (entry.from === 'drop') {
    return `${pieceLabel}* ${formatPosition(entry.to)}`;
  }

  const captureSuffix = entry.capturedPieceType
    ? ` x${PIECE_LABELS[entry.capturedPieceType]}`
    : '';

  return `${pieceLabel} ${formatPosition(entry.from)}→${formatPosition(entry.to)}${captureSuffix}`;
}

export function MoveHistory({ history }: MoveHistoryProps) {
  return (
    <section className="move-history" aria-label="Move history">
      <div className="move-history-header">
        <span className="status-label">Kifu</span>
        <strong>{history.length} moves</strong>
      </div>

      {history.length === 0 ? (
        <p className="move-history-empty">No moves yet.</p>
      ) : (
        <ol className="move-history-list">
          {history.map((entry, index) => (
            <li className="move-history-item" key={`${index + 1}-${formatEntry(entry)}`}>
              <span className="move-history-number">{index + 1}.</span>
              <span className="move-history-text">{formatEntry(entry)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
