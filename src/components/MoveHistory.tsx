import type { MoveHistoryEntry } from '../engine/shogi';
import { formatMoveHistoryEntry } from '../lib/moveHistory';

type MoveHistoryProps = {
  history: MoveHistoryEntry[];
  onExport: () => void;
};

export function MoveHistory({ history, onExport }: MoveHistoryProps) {
  return (
    <section className="move-history" aria-label="Move history">
      <div className="move-history-header">
        <div className="move-history-summary">
          <span className="status-label">Kifu</span>
          <strong>{`${history.length}\u624b`}</strong>
        </div>
        <button
          className="secondary-button move-history-export"
          disabled={history.length === 0}
          onClick={onExport}
          type="button"
        >
          Export moves
        </button>
      </div>

      {history.length === 0 ? (
        <p className="move-history-empty">{'\u307e\u3060\u6307\u3057\u624b\u306f\u3042\u308a\u307e\u305b\u3093\u3002'}</p>
      ) : (
        <ol className="move-history-list">
          {history.map((entry, index) => (
            <li
              className="move-history-item"
              key={`${index + 1}-${formatMoveHistoryEntry(entry)}`}
            >
              <span className="move-history-number">{index + 1}.</span>
              <span className="move-history-text">{formatMoveHistoryEntry(entry)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
