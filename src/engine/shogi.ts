export const BOARD_SIZE = 9;

export type Player = 'black' | 'white';
export type PieceType =
  | 'king'
  | 'rook'
  | 'bishop'
  | 'gold'
  | 'silver'
  | 'knight'
  | 'lance'
  | 'pawn';

export type Piece = {
  owner: Player;
  type: PieceType;
  isPromoted: boolean;
};

export type Square = Piece | null;
export type Board = Square[][];

export type Position = {
  row: number;
  col: number;
};

export type GameState = {
  board: Board;
  currentPlayer: Player;
};

export type PromotionState = 'none' | 'optional' | 'required';

export const PIECE_LABELS: Record<PieceType, string> = {
  king: 'K',
  rook: 'R',
  bishop: 'B',
  gold: 'G',
  silver: 'S',
  knight: 'N',
  lance: 'L',
  pawn: 'P',
};

const HOME_ROW: PieceType[] = [
  'lance',
  'knight',
  'silver',
  'gold',
  'king',
  'gold',
  'silver',
  'knight',
  'lance',
];

type Direction = {
  row: number;
  col: number;
};

const KING_DIRECTIONS: Direction[] = [
  { row: -1, col: -1 },
  { row: -1, col: 0 },
  { row: -1, col: 1 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
  { row: 1, col: -1 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
];

const GOLD_DIRECTIONS: Direction[] = [
  { row: -1, col: -1 },
  { row: -1, col: 0 },
  { row: -1, col: 1 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
  { row: 1, col: 0 },
];

const SILVER_DIRECTIONS: Direction[] = [
  { row: -1, col: -1 },
  { row: -1, col: 0 },
  { row: -1, col: 1 },
  { row: 1, col: -1 },
  { row: 1, col: 1 },
];

const KNIGHT_DIRECTIONS: Direction[] = [
  { row: -2, col: -1 },
  { row: -2, col: 1 },
];

const ROOK_DIRECTIONS: Direction[] = [
  { row: -1, col: 0 },
  { row: 1, col: 0 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
];

const BISHOP_DIRECTIONS: Direction[] = [
  { row: -1, col: -1 },
  { row: -1, col: 1 },
  { row: 1, col: -1 },
  { row: 1, col: 1 },
];

function createPiece(owner: Player, type: PieceType): Piece {
  return {
    owner,
    type,
    isPromoted: false,
  };
}

function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null),
  );
}

export function createInitialBoard(): Board {
  const board = createEmptyBoard();

  HOME_ROW.forEach((pieceType, col) => {
    board[0][col] = createPiece('white', pieceType);
    board[8][col] = createPiece('black', pieceType);
    board[2][col] = createPiece('white', 'pawn');
    board[6][col] = createPiece('black', 'pawn');
  });

  board[1][1] = createPiece('white', 'rook');
  board[1][7] = createPiece('white', 'bishop');
  board[7][1] = createPiece('black', 'bishop');
  board[7][7] = createPiece('black', 'rook');

  return board;
}

export function createInitialGameState(): GameState {
  return {
    board: createInitialBoard(),
    currentPlayer: 'black',
  };
}

export function createGameState(board: Board, currentPlayer: Player = 'black'): GameState {
  return {
    board,
    currentPlayer,
  };
}

export function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((square) => (square ? { ...square } : null)));
}

function isInsideBoard(position: Position): boolean {
  return (
    position.row >= 0 &&
    position.row < BOARD_SIZE &&
    position.col >= 0 &&
    position.col < BOARD_SIZE
  );
}

function orientationFor(owner: Player): 1 | -1 {
  return owner === 'black' ? 1 : -1;
}

export function isInPromotionZone(owner: Player, row: number): boolean {
  return owner === 'black' ? row <= 2 : row >= 6;
}

export function canPiecePromote(piece: Piece): boolean {
  return !piece.isPromoted && piece.type !== 'king' && piece.type !== 'gold';
}

export function isMandatoryPromotion(piece: Piece, toRow: number): boolean {
  if (piece.isPromoted) {
    return false;
  }

  if (piece.type === 'pawn' || piece.type === 'lance') {
    return piece.owner === 'black' ? toRow === 0 : toRow === BOARD_SIZE - 1;
  }

  if (piece.type === 'knight') {
    return piece.owner === 'black' ? toRow <= 1 : toRow >= BOARD_SIZE - 2;
  }

  return false;
}

export function getPromotionState(
  piece: Piece,
  fromRow: number,
  toRow: number,
): PromotionState {
  if (!canPiecePromote(piece)) {
    return 'none';
  }

  if (isMandatoryPromotion(piece, toRow)) {
    return 'required';
  }

  if (isInPromotionZone(piece.owner, fromRow) || isInPromotionZone(piece.owner, toRow)) {
    return 'optional';
  }

  return 'none';
}

function applyOrientation(direction: Direction, owner: Player): Direction {
  const orientation = orientationFor(owner);
  return {
    row: direction.row * orientation,
    col: direction.col * orientation,
  };
}

function canOccupySquare(board: Board, owner: Player, position: Position): boolean {
  const square = board[position.row][position.col];
  return square === null || square.owner !== owner;
}

function collectStepMoves(
  state: GameState,
  from: Position,
  directions: Direction[],
): Position[] {
  const piece = state.board[from.row][from.col];

  if (!piece) {
    return [];
  }

  return directions
    .map((direction) => applyOrientation(direction, piece.owner))
    .map((direction) => ({
      row: from.row + direction.row,
      col: from.col + direction.col,
    }))
    .filter(isInsideBoard)
    .filter((position) => canOccupySquare(state.board, piece.owner, position));
}

function collectSlidingMoves(
  state: GameState,
  from: Position,
  directions: Direction[],
): Position[] {
  const piece = state.board[from.row][from.col];

  if (!piece) {
    return [];
  }

  const moves: Position[] = [];

  directions.forEach((direction) => {
    const orientedDirection = applyOrientation(direction, piece.owner);
    let nextPosition = {
      row: from.row + orientedDirection.row,
      col: from.col + orientedDirection.col,
    };

    while (isInsideBoard(nextPosition)) {
      const square = state.board[nextPosition.row][nextPosition.col];

      if (square === null) {
        moves.push(nextPosition);
      } else {
        if (square.owner !== piece.owner) {
          moves.push(nextPosition);
        }
        break;
      }

      nextPosition = {
        row: nextPosition.row + orientedDirection.row,
        col: nextPosition.col + orientedDirection.col,
      };
    }
  });

  return moves;
}

function getMoveProfile(piece: Piece): {
  stepDirections: Direction[];
  slidingDirections: Direction[];
} {
  if (piece.isPromoted) {
    switch (piece.type) {
      case 'pawn':
      case 'lance':
      case 'knight':
      case 'silver':
        return {
          stepDirections: GOLD_DIRECTIONS,
          slidingDirections: [],
        };
      case 'rook':
        return {
          stepDirections: BISHOP_DIRECTIONS,
          slidingDirections: ROOK_DIRECTIONS,
        };
      case 'bishop':
        return {
          stepDirections: ROOK_DIRECTIONS,
          slidingDirections: BISHOP_DIRECTIONS,
        };
      default:
        break;
    }
  }

  switch (piece.type) {
    case 'king':
      return {
        stepDirections: KING_DIRECTIONS,
        slidingDirections: [],
      };
    case 'gold':
      return {
        stepDirections: GOLD_DIRECTIONS,
        slidingDirections: [],
      };
    case 'silver':
      return {
        stepDirections: SILVER_DIRECTIONS,
        slidingDirections: [],
      };
    case 'knight':
      return {
        stepDirections: KNIGHT_DIRECTIONS,
        slidingDirections: [],
      };
    case 'pawn':
      return {
        stepDirections: [{ row: -1, col: 0 }],
        slidingDirections: [],
      };
    case 'lance':
      return {
        stepDirections: [],
        slidingDirections: [{ row: -1, col: 0 }],
      };
    case 'rook':
      return {
        stepDirections: [],
        slidingDirections: ROOK_DIRECTIONS,
      };
    case 'bishop':
      return {
        stepDirections: [],
        slidingDirections: BISHOP_DIRECTIONS,
      };
    default:
      return {
        stepDirections: [],
        slidingDirections: [],
      };
  }
}

export function getLegalMoves(state: GameState, from: Position): Position[] {
  const piece = state.board[from.row]?.[from.col];

  if (!piece || piece.owner !== state.currentPlayer) {
    return [];
  }

  const moveProfile = getMoveProfile(piece);

  return [
    ...collectStepMoves(state, from, moveProfile.stepDirections),
    ...collectSlidingMoves(state, from, moveProfile.slidingDirections),
  ];
}

export function isLegalMove(state: GameState, from: Position, to: Position): boolean {
  return getLegalMoves(state, from).some(
    (move) => move.row === to.row && move.col === to.col,
  );
}

export function movePiece(
  state: GameState,
  from: Position,
  to: Position,
  promote = false,
): GameState {
  if (!isLegalMove(state, from, to)) {
    throw new Error('Illegal move');
  }

  const piece = state.board[from.row]?.[from.col];

  if (!piece) {
    throw new Error('No piece at source position');
  }

  const promoState = getPromotionState(piece, from.row, to.row);
  const shouldPromote =
    promoState === 'required' || (promoState === 'optional' && promote);

  const nextBoard = cloneBoard(state.board);
  const movingPiece = nextBoard[from.row][from.col];

  if (!movingPiece) {
    throw new Error('No piece at source position');
  }

  nextBoard[from.row][from.col] = null;
  nextBoard[to.row][to.col] = {
    ...movingPiece,
    isPromoted: shouldPromote ? true : movingPiece.isPromoted,
  };

  return {
    board: nextBoard,
    currentPlayer: state.currentPlayer === 'black' ? 'white' : 'black',
  };
}

export function getWinner(state: GameState): Player | null {
  let hasBlackKing = false;
  let hasWhiteKing = false;

  state.board.forEach((row) => {
    row.forEach((square) => {
      if (square?.type === 'king') {
        if (square.owner === 'black') {
          hasBlackKing = true;
        } else {
          hasWhiteKing = true;
        }
      }
    });
  });

  if (!hasBlackKing) {
    return 'white';
  }

  if (!hasWhiteKing) {
    return 'black';
  }

  return null;
}
