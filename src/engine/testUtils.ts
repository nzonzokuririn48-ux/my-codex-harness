import {
  BOARD_SIZE,
  createGameState,
  createInitialGameState,
  getLegalMoves,
  isLegalMove,
  movePiece,
  type Board,
  type Piece,
  type Player,
} from './shogi';

export {
  BOARD_SIZE,
  createGameState,
  createInitialGameState,
  getLegalMoves,
  isLegalMove,
  movePiece,
  type Board,
  type Piece,
  type Player,
};

export function createEmptyBoardForTest(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null),
  );
}
