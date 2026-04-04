import {
  type CpuAction,
  type GameState,
  type PieceType,
} from '../engine/shogi';

const CAPTURE_VALUES: Record<PieceType, number> = {
  king: 100,
  rook: 5,
  bishop: 5,
  gold: 4,
  silver: 3,
  knight: 2,
  lance: 2,
  pawn: 1,
};

const PROMOTION_BONUSES: Partial<Record<PieceType, number>> = {
  pawn: 2,
  lance: 1.75,
  knight: 1.75,
  silver: 1.5,
  bishop: 1,
  rook: 1,
};

function scoreCpuAction(state: GameState, action: CpuAction): number {
  let score = 0;

  if (action.kind === 'move') {
    const movingPiece = state.board[action.from.row][action.from.col];
    const capturedPiece = state.board[action.to.row][action.to.col];

    if (capturedPiece) {
      score += CAPTURE_VALUES[capturedPiece.type];
    }

    if (action.promote && movingPiece) {
      score += PROMOTION_BONUSES[movingPiece.type] ?? 0.5;
    }
  }

  return score + Math.random() * 0.2;
}

export function chooseCpuAction(state: GameState, actions: CpuAction[]): CpuAction | null {
  if (actions.length === 0) {
    return null;
  }

  const scoredActions = actions.map((action) => ({
    action,
    score: scoreCpuAction(state, action),
  }));
  const topScore = Math.max(...scoredActions.map(({ score }) => score));
  const topActions = scoredActions
    .filter(({ score }) => score === topScore)
    .map(({ action }) => action);

  return topActions[Math.floor(Math.random() * topActions.length)] ?? null;
}
