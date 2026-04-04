type StartPromptProps = {
  onContinue: () => void;
  onStartNew: () => void;
};

export function StartPrompt({ onContinue, onStartNew }: StartPromptProps) {
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
