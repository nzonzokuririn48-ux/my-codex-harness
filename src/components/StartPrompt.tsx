import type { SetupMode } from '../engine/shogi';

type StartPromptProps = {
  onContinue: () => void;
  onStartNew: () => void;
  onSetupModeChange: (mode: SetupMode) => void;
  setupMode: SetupMode;
};

export function StartPrompt({
  onContinue,
  onStartNew,
  onSetupModeChange,
  setupMode,
}: StartPromptProps) {
  return (
    <main className="app-shell">
      <section className="app-panel start-prompt">
        <div>
          <p className="eyebrow">Local Shogi</p>
          <h1>Continue your game?</h1>
          <p className="start-prompt-text">
            A saved local game was found on this device. You can keep playing from
            where you left off or start over with a fresh board.
          </p>
        </div>

        <div className="start-prompt-setup">
          <div>
            <p className="status-label">New game setup</p>
            <p className="start-prompt-text start-prompt-setup-text">
              Random mode shuffles the back rank symmetrically.
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
          <button className="reset-button" onClick={onContinue} type="button">
            Continue saved game
          </button>
          <button className="secondary-button" onClick={onStartNew} type="button">
            Start new game
          </button>
        </div>
      </section>
    </main>
  );
}
