import type { SetupMode } from '../engine/shogi';

type GameMode = 'local' | 'cpu';

type StartPromptProps = {
  gameMode: GameMode;
  hasSavedGame: boolean;
  onContinue: () => void;
  onGameModeChange: (mode: GameMode) => void;
  onSetupModeChange: (mode: SetupMode) => void;
  onStartNew: () => void;
  setupMode: SetupMode;
};

export function StartPrompt({
  gameMode,
  hasSavedGame,
  onContinue,
  onGameModeChange,
  onSetupModeChange,
  onStartNew,
  setupMode,
}: StartPromptProps) {
  return (
    <main className="app-shell">
      <section className="app-panel start-prompt">
        <div>
          <p className="eyebrow">Local Shogi</p>
          <h1>Shogi App</h1>
          <p className="start-prompt-text">
            Choose how you want to play, then start a focused board view with compact hands and kifu beside the board.
          </p>
        </div>

        <div className="start-prompt-setup">
          <div>
            <p className="status-label">Game mode</p>
            <p className="start-prompt-text start-prompt-setup-text">
              Local is two-player on one device. Vs CPU lets White play automatically.
            </p>
          </div>
          <div className="mode-toggle" role="group" aria-label="Game mode">
            <button
              className={`mode-button${gameMode === 'local' ? ' is-active' : ''}`}
              onClick={() => onGameModeChange('local')}
              type="button"
            >
              Local
            </button>
            <button
              className={`mode-button${gameMode === 'cpu' ? ' is-active' : ''}`}
              onClick={() => onGameModeChange('cpu')}
              type="button"
            >
              Vs CPU
            </button>
          </div>
        </div>

        <div className="start-prompt-setup">
          <div>
            <p className="status-label">Board setup</p>
            <p className="start-prompt-text start-prompt-setup-text">
              Random keeps pawns, rook, and bishop fixed while shuffling the back rank symmetrically.
            </p>
          </div>
          <div className="mode-toggle" role="group" aria-label="Setup mode">
            <button
              className={`mode-button${setupMode === 'standard' ? ' is-active' : ''}`}
              onClick={() => onSetupModeChange('standard')}
              type="button"
            >
              Standard
            </button>
            <button
              className={`mode-button${setupMode === 'random' ? ' is-active' : ''}`}
              onClick={() => onSetupModeChange('random')}
              type="button"
            >
              Random
            </button>
          </div>
        </div>

        <div className="start-prompt-actions">
          <button className="reset-button" onClick={onStartNew} type="button">
            Start game
          </button>
          {hasSavedGame ? (
            <button className="secondary-button" onClick={onContinue} type="button">
              Continue saved game
            </button>
          ) : null}
        </div>
      </section>
    </main>
  );
}
