import {
  BOARD_SIZE,
  createGameState,
  createInitialGameState,
  type GameState,
  type HandPieceType,
  type Hands,
  type MoveHistoryEntry,
  type Piece,
  type PieceType,
  type Player,
  type Position,
} from '../engine/shogi';

const STORAGE_KEY = 'shogi-app-state';

const PIECE_TYPES: PieceType[] = [
  'king',
  'rook',
  'bishop',
  'gold',
  'silver',
  'knight',
  'lance',
  'pawn',
];

const HAND_PIECE_TYPES: HandPieceType[] = [
  'rook',
  'bishop',
  'gold',
  'silver',
  'knight',
  'lance',
  'pawn',
];

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPlayer(value: unknown): value is Player {
  return value === 'black' || value === 'white';
}

function isPieceType(value: unknown): value is PieceType {
  return typeof value === 'string' && PIECE_TYPES.includes(value as PieceType);
}

function isPosition(value: unknown): value is Position {
  return (
    isObject(value) &&
    typeof value.row === 'number' &&
    typeof value.col === 'number' &&
    Number.isInteger(value.row) &&
    Number.isInteger(value.col) &&
    value.row >= 0 &&
    value.row < BOARD_SIZE &&
    value.col >= 0 &&
    value.col < BOARD_SIZE
  );
}

function isPiece(value: unknown): value is Piece {
  return (
    isObject(value) &&
    isPlayer(value.owner) &&
    isPieceType(value.type) &&
    typeof value.isPromoted === 'boolean'
  );
}

function isBoard(value: unknown): value is GameState['board'] {
  return (
    Array.isArray(value) &&
    value.length === BOARD_SIZE &&
    value.every(
      (row) =>
        Array.isArray(row) &&
        row.length === BOARD_SIZE &&
        row.every((square) => square === null || isPiece(square)),
    )
  );
}

function isHands(value: unknown): value is Hands {
  if (!isObject(value) || !isObject(value.black) || !isObject(value.white)) {
    return false;
  }

  const blackHand = value.black as Record<string, unknown>;
  const whiteHand = value.white as Record<string, unknown>;

  return HAND_PIECE_TYPES.every((pieceType) => {
    const blackCount = blackHand[pieceType];
    const whiteCount = whiteHand[pieceType];

    return (
      typeof blackCount === 'number' &&
      typeof whiteCount === 'number' &&
      blackCount >= 0 &&
      whiteCount >= 0
    );
  });
}

function isMoveHistoryEntry(value: unknown): value is MoveHistoryEntry {
  return (
    isObject(value) &&
    isPieceType(value.pieceType) &&
    (value.from === 'drop' || isPosition(value.from)) &&
    isPosition(value.to) &&
    typeof value.isPromoted === 'boolean' &&
    (value.capturedPieceType === null || isPieceType(value.capturedPieceType))
  );
}

function isMoveHistory(value: unknown): value is MoveHistoryEntry[] {
  return Array.isArray(value) && value.every(isMoveHistoryEntry);
}

function isPersistedGameState(value: unknown): value is GameState {
  return (
    isObject(value) &&
    isBoard(value.board) &&
    isPlayer(value.currentPlayer) &&
    isHands(value.hands) &&
    isMoveHistory(value.history)
  );
}

export function loadPersistedGameState(): GameState | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawState = window.localStorage.getItem(STORAGE_KEY);

    if (!rawState) {
      return null;
    }

    const parsedState: unknown = JSON.parse(rawState);

    if (!isPersistedGameState(parsedState)) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return createGameState(
      parsedState.board,
      parsedState.currentPlayer,
      parsedState.hands,
      parsedState.history,
    );
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function persistGameState(state: GameState): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore persistence failures and keep the live game usable.
  }
}

export function clearPersistedGameState(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore persistence failures and keep the live game usable.
  }
}

export function createInitialPersistedGameState(): GameState {
  return loadPersistedGameState() ?? createInitialGameState();
}
