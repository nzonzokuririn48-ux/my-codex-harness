import {
  dropPiece,
  getLegalActions,
  getWinner,
  isCheckmate,
  isInCheck,
  movePiece,
  type CpuAction,
  type GameState,
  type HandPieceType,
  type Piece,
  type PieceType,
  type Player,
} from '../engine/shogi';

const TERMINAL_SCORE = 100000;
const CHECK_BONUS = 0.5;

const BASE_PIECE_VALUES: Record<HandPieceType, number> = {
  pawn: 1,
  lance: 2,
  knight: 2,
  silver: 3,
  gold: 4,
  bishop: 5,
  rook: 5,
};

function getPieceValue(piece: Piece): number {
  if (piece.type === 'king') {
    return 0;
  }

  if (!piece.isPromoted) {
    return BASE_PIECE_VALUES[piece.type];
  }

  if (
    piece.type === 'pawn' ||
    piece.type === 'lance' ||
    piece.type === 'knight' ||
    piece.type === 'silver'
  ) {
    return 4;
  }

  if (piece.type === 'bishop' || piece.type === 'rook') {
    return BASE_PIECE_VALUES[piece.type] + 1;
  }

  return BASE_PIECE_VALUES[piece.type];
}

function getPlayerMaterialScore(state: GameState, player: Player): number {
  let score = 0;

  state.board.forEach((row) => {
    row.forEach((square) => {
      if (square?.owner === player) {
        score += getPieceValue(square);
      }
    });
  });

  (Object.entries(state.hands[player]) as Array<[HandPieceType, number]>).forEach(
    ([pieceType, count]) => {
      score += BASE_PIECE_VALUES[pieceType] * count;
    },
  );

  return score;
}

function getTerminalWinner(state: GameState): Player | null {
  const capturedKingWinner = getWinner(state);

  if (capturedKingWinner) {
    return capturedKingWinner;
  }

  if (isCheckmate(state, state.currentPlayer)) {
    return state.currentPlayer === 'black' ? 'white' : 'black';
  }

  return null;
}

function applyCpuAction(state: GameState, action: CpuAction): GameState {
  if (action.kind === 'move') {
    return movePiece(state, action.from, action.to, action.promote);
  }

  return dropPiece(state, action.pieceType, action.to);
}

export function evaluateState(state: GameState, maximizingPlayer: Player): number {
  const terminalWinner = getTerminalWinner(state);

  if (terminalWinner === maximizingPlayer) {
    return TERMINAL_SCORE;
  }

  if (terminalWinner) {
    return -TERMINAL_SCORE;
  }

  const opponent = maximizingPlayer === 'black' ? 'white' : 'black';
  let score =
    getPlayerMaterialScore(state, maximizingPlayer) -
    getPlayerMaterialScore(state, opponent);

  if (isInCheck(state, opponent)) {
    score += CHECK_BONUS;
  }

  if (isInCheck(state, maximizingPlayer)) {
    score -= CHECK_BONUS;
  }

  return score;
}

export function minimax(
  state: GameState,
  depth: number,
  maximizingPlayer: Player,
): number {
  if (depth === 0 || getTerminalWinner(state)) {
    return evaluateState(state, maximizingPlayer);
  }

  const actions = getLegalActions(state);

  if (actions.length === 0) {
    return evaluateState(state, maximizingPlayer);
  }

  const isMaximizingTurn = state.currentPlayer === maximizingPlayer;

  if (isMaximizingTurn) {
    let bestScore = -Infinity;

    actions.forEach((action) => {
      const nextState = applyCpuAction(state, action);
      bestScore = Math.max(bestScore, minimax(nextState, depth - 1, maximizingPlayer));
    });

    return bestScore;
  }

  let bestScore = Infinity;

  actions.forEach((action) => {
    const nextState = applyCpuAction(state, action);
    bestScore = Math.min(bestScore, minimax(nextState, depth - 1, maximizingPlayer));
  });

  return bestScore;
}

export function chooseCpuAction(state: GameState, actions: CpuAction[]): CpuAction | null {
  if (actions.length === 0) {
    return null;
  }

  const maximizingPlayer = state.currentPlayer;
  const scoredActions = actions.map((action) => {
    const nextState = applyCpuAction(state, action);
    return {
      action,
      score: minimax(nextState, 1, maximizingPlayer),
    };
  });
  const topScore = Math.max(...scoredActions.map(({ score }) => score));
  const topActions = scoredActions
    .filter(({ score }) => score === topScore)
    .map(({ action }) => action);

  return topActions[Math.floor(Math.random() * topActions.length)] ?? null;
}
