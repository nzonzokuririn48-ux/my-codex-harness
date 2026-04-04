import {
  BOARD_SIZE,
  createEmptyBoardForTest,
  createGameState,
  createInitialGameState,
  getLegalMoves,
  isLegalMove,
  movePiece,
  type Board,
  type Piece,
} from './testUtils';

function createPiece(
  owner: Piece['owner'],
  type: Piece['type'],
  isPromoted = false,
): Piece {
  return {
    owner,
    type,
    isPromoted,
  };
}

function createBoardWithPieces(pieces: Array<{ piece: Piece; row: number; col: number }>): Board {
  const board = createEmptyBoardForTest();
  pieces.forEach(({ piece, row, col }) => {
    board[row][col] = piece;
  });
  return board;
}

function sortMoves(moves: Array<{ row: number; col: number }>): string[] {
  return moves
    .map((move) => `${move.row},${move.col}`)
    .sort();
}

describe('shogi engine', () => {
  it('creates the standard starting layout', () => {
    const state = createInitialGameState();

    expect(state.currentPlayer).toBe('black');
    expect(state.board).toHaveLength(BOARD_SIZE);
    expect(state.board[8][4]).toEqual(createPiece('black', 'king'));
    expect(state.board[0][4]).toEqual(createPiece('white', 'king'));
    expect(state.board[7][7]).toEqual(createPiece('black', 'rook'));
    expect(state.board[1][7]).toEqual(createPiece('white', 'bishop'));
    expect(state.board[6].every((square) => square?.type === 'pawn')).toBe(true);
    expect(state.board[6].every((square) => square?.isPromoted === false)).toBe(true);
    expect(state.board[2].every((square) => square?.type === 'pawn')).toBe(true);
    expect(state.board[2].every((square) => square?.isPromoted === false)).toBe(true);
  });

  it('allows a black pawn to move one square forward', () => {
    const state = createGameState(
      createBoardWithPieces([{ piece: createPiece('black', 'pawn'), row: 4, col: 4 }]),
      'black',
    );

    expect(sortMoves(getLegalMoves(state, { row: 4, col: 4 }))).toEqual(['3,4']);
    expect(isLegalMove(state, { row: 4, col: 4 }, { row: 3, col: 4 })).toBe(true);
    expect(isLegalMove(state, { row: 4, col: 4 }, { row: 4, col: 5 })).toBe(false);
  });

  it('mirrors forward movement for white pieces', () => {
    const state = createGameState(
      createBoardWithPieces([{ piece: createPiece('white', 'pawn'), row: 4, col: 4 }]),
      'white',
    );

    expect(sortMoves(getLegalMoves(state, { row: 4, col: 4 }))).toEqual(['5,4']);
  });

  it('gives gold and silver their standard step patterns', () => {
    const goldState = createGameState(
      createBoardWithPieces([{ piece: createPiece('black', 'gold'), row: 4, col: 4 }]),
      'black',
    );
    const silverState = createGameState(
      createBoardWithPieces([{ piece: createPiece('black', 'silver'), row: 4, col: 4 }]),
      'black',
    );

    expect(sortMoves(getLegalMoves(goldState, { row: 4, col: 4 }))).toEqual([
      '3,3',
      '3,4',
      '3,5',
      '4,3',
      '4,5',
      '5,4',
    ]);
    expect(sortMoves(getLegalMoves(silverState, { row: 4, col: 4 }))).toEqual([
      '3,3',
      '3,4',
      '3,5',
      '5,3',
      '5,5',
    ]);
  });

  it('lets knights jump two forward and one sideways', () => {
    const state = createGameState(
      createBoardWithPieces([{ piece: createPiece('black', 'knight'), row: 4, col: 4 }]),
      'black',
    );

    expect(sortMoves(getLegalMoves(state, { row: 4, col: 4 }))).toEqual(['2,3', '2,5']);
  });

  it('stops lances at blockers and allows capturing the first enemy ahead', () => {
    const state = createGameState(
      createBoardWithPieces([
        { piece: createPiece('black', 'lance'), row: 6, col: 4 },
        { piece: createPiece('white', 'pawn'), row: 3, col: 4 },
        { piece: createPiece('black', 'pawn'), row: 2, col: 4 },
      ]),
      'black',
    );

    expect(sortMoves(getLegalMoves(state, { row: 6, col: 4 }))).toEqual([
      '3,4',
      '4,4',
      '5,4',
    ]);
  });

  it('prevents rooks from jumping over pieces', () => {
    const state = createGameState(
      createBoardWithPieces([
        { piece: createPiece('black', 'rook'), row: 4, col: 4 },
        { piece: createPiece('black', 'pawn'), row: 4, col: 6 },
        { piece: createPiece('white', 'pawn'), row: 1, col: 4 },
      ]),
      'black',
    );

    expect(sortMoves(getLegalMoves(state, { row: 4, col: 4 }))).toEqual([
      '1,4',
      '2,4',
      '3,4',
      '4,0',
      '4,1',
      '4,2',
      '4,3',
      '4,5',
      '5,4',
      '6,4',
      '7,4',
      '8,4',
    ]);
  });

  it('supports bishop diagonal movement', () => {
    const state = createGameState(
      createBoardWithPieces([
        { piece: createPiece('black', 'bishop'), row: 4, col: 4 },
        { piece: createPiece('white', 'pawn'), row: 2, col: 2 },
        { piece: createPiece('black', 'pawn'), row: 6, col: 2 },
      ]),
      'black',
    );

    expect(sortMoves(getLegalMoves(state, { row: 4, col: 4 }))).toEqual([
      '0,8',
      '1,7',
      '2,2',
      '2,6',
      '3,3',
      '3,5',
      '5,3',
      '5,5',
      '6,6',
      '7,7',
      '8,8',
    ]);
  });

  it('moves pieces, clears the source square, captures, and changes turns', () => {
    const state = createGameState(
      createBoardWithPieces([
        { piece: createPiece('black', 'pawn'), row: 4, col: 4 },
        { piece: createPiece('white', 'silver'), row: 3, col: 4 },
      ]),
      'black',
    );

    const nextState = movePiece(state, { row: 4, col: 4 }, { row: 3, col: 4 });

    expect(nextState.board[4][4]).toBeNull();
    expect(nextState.board[3][4]).toEqual(createPiece('black', 'pawn'));
    expect(nextState.currentPlayer).toBe('white');
  });

  it('promotes a pawn when entering the zone with the promotion flag', () => {
    const state = createGameState(
      createBoardWithPieces([{ piece: createPiece('black', 'pawn'), row: 3, col: 4 }]),
      'black',
    );

    const nextState = movePiece(state, { row: 3, col: 4 }, { row: 2, col: 4 }, true);

    expect(nextState.board[2][4]).toEqual(createPiece('black', 'pawn', true));
  });

  it('forces pawn promotion on the last rank', () => {
    const state = createGameState(
      createBoardWithPieces([{ piece: createPiece('black', 'pawn'), row: 1, col: 4 }]),
      'black',
    );

    const nextState = movePiece(state, { row: 1, col: 4 }, { row: 0, col: 4 }, false);

    expect(nextState.board[0][4]).toEqual(createPiece('black', 'pawn', true));
  });

  it('forces knight promotion on the last two ranks', () => {
    const state = createGameState(
      createBoardWithPieces([{ piece: createPiece('black', 'knight'), row: 2, col: 4 }]),
      'black',
    );

    const nextState = movePiece(state, { row: 2, col: 4 }, { row: 0, col: 3 }, false);

    expect(nextState.board[0][3]).toEqual(createPiece('black', 'knight', true));
  });

  it('does not promote a gold even when the promotion flag is set', () => {
    const state = createGameState(
      createBoardWithPieces([{ piece: createPiece('black', 'gold'), row: 3, col: 4 }]),
      'black',
    );

    const nextState = movePiece(state, { row: 3, col: 4 }, { row: 2, col: 4 }, true);

    expect(nextState.board[2][4]).toEqual(createPiece('black', 'gold'));
  });

  it('lets a promoted pawn move like a gold', () => {
    const state = createGameState(
      createBoardWithPieces([{ piece: createPiece('black', 'pawn', true), row: 4, col: 4 }]),
      'black',
    );

    expect(sortMoves(getLegalMoves(state, { row: 4, col: 4 }))).toEqual([
      '3,3',
      '3,4',
      '3,5',
      '4,3',
      '4,5',
      '5,4',
    ]);
  });

  it('adds diagonal king-like steps to a promoted rook', () => {
    const state = createGameState(
      createBoardWithPieces([{ piece: createPiece('black', 'rook', true), row: 4, col: 4 }]),
      'black',
    );

    expect(sortMoves(getLegalMoves(state, { row: 4, col: 4 }))).toEqual([
      '0,4',
      '1,4',
      '2,4',
      '3,3',
      '3,4',
      '3,5',
      '4,0',
      '4,1',
      '4,2',
      '4,3',
      '4,5',
      '4,6',
      '4,7',
      '4,8',
      '5,3',
      '5,4',
      '5,5',
      '6,4',
      '7,4',
      '8,4',
    ]);
  });

  it('respects the promotion flag on optional promotion moves', () => {
    const state = createGameState(
      createBoardWithPieces([{ piece: createPiece('black', 'pawn'), row: 3, col: 4 }]),
      'black',
    );

    const promotedState = movePiece(state, { row: 3, col: 4 }, { row: 2, col: 4 }, true);
    const unpromotedState = movePiece(state, { row: 3, col: 4 }, { row: 2, col: 4 }, false);

    expect(promotedState.board[2][4]).toEqual(createPiece('black', 'pawn', true));
    expect(unpromotedState.board[2][4]).toEqual(createPiece('black', 'pawn'));
  });
});
