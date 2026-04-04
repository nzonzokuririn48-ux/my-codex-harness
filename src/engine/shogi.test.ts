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
import {
  createEmptyHands,
  dropPiece,
  getLegalDrops,
  isCheckmate,
  isInCheck,
  getWinner,
  isLegalDrop,
  type HandPieceType,
  type Hands,
} from './shogi';

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

function createHands(
  owner: Piece['owner'],
  pieceType: HandPieceType,
  count = 1,
): Hands {
  const hands = createEmptyHands();
  hands[owner][pieceType] = count;
  return hands;
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
    expect(state.hands).toEqual(createEmptyHands());
    expect(state.history).toEqual([]);
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
    expect(nextState.hands.black.silver).toBe(1);
    expect(nextState.history).toEqual([
      {
        pieceType: 'pawn',
        from: { row: 4, col: 4 },
        to: { row: 3, col: 4 },
        isPromoted: false,
        capturedPieceType: 'silver',
      },
    ]);
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

  it('demotes a captured promoted piece before adding it to hand', () => {
    const state = createGameState(
      createBoardWithPieces([
        { piece: createPiece('black', 'gold'), row: 4, col: 4 },
        { piece: createPiece('white', 'pawn', true), row: 3, col: 4 },
      ]),
      'black',
    );

    const nextState = movePiece(state, { row: 4, col: 4 }, { row: 3, col: 4 });

    expect(nextState.hands.black.pawn).toBe(1);
    expect(nextState.hands.black.gold).toBe(0);
  });

  it('lists empty squares as legal drops for a piece in hand', () => {
    const state = createGameState(
      createBoardWithPieces([{ piece: createPiece('black', 'king'), row: 8, col: 4 }]),
      'black',
      createHands('black', 'silver'),
    );

    expect(isLegalDrop(state, 'silver', { row: 4, col: 4 })).toBe(true);
    expect(sortMoves(getLegalDrops(state, 'silver'))).toContain('4,4');
  });

  it('drops a piece from hand onto the board and switches turns', () => {
    const state = createGameState(
      createBoardWithPieces([{ piece: createPiece('black', 'king'), row: 8, col: 4 }]),
      'black',
      createHands('black', 'silver', 2),
    );

    const nextState = dropPiece(state, 'silver', { row: 4, col: 4 });

    expect(nextState.board[4][4]).toEqual(createPiece('black', 'silver'));
    expect(nextState.hands.black.silver).toBe(1);
    expect(nextState.currentPlayer).toBe('white');
    expect(nextState.history).toEqual([
      {
        pieceType: 'silver',
        from: 'drop',
        to: { row: 4, col: 4 },
        isPromoted: false,
        capturedPieceType: null,
      },
    ]);
  });

  it('forbids dropping a pawn into a file with an unpromoted pawn', () => {
    const state = createGameState(
      createBoardWithPieces([
        { piece: createPiece('black', 'king'), row: 8, col: 4 },
        { piece: createPiece('black', 'pawn'), row: 5, col: 4 },
      ]),
      'black',
      createHands('black', 'pawn'),
    );

    expect(isLegalDrop(state, 'pawn', { row: 4, col: 4 })).toBe(false);
    expect(sortMoves(getLegalDrops(state, 'pawn'))).not.toContain('4,4');
  });

  it('allows dropping a pawn into a file with only a promoted pawn', () => {
    const state = createGameState(
      createBoardWithPieces([
        { piece: createPiece('black', 'king'), row: 8, col: 4 },
        { piece: createPiece('black', 'pawn', true), row: 5, col: 4 },
      ]),
      'black',
      createHands('black', 'pawn'),
    );

    expect(isLegalDrop(state, 'pawn', { row: 4, col: 4 })).toBe(true);
  });

  it('forbids pawn and lance drops on the last rank', () => {
    const state = createGameState(
      createBoardWithPieces([{ piece: createPiece('black', 'king'), row: 8, col: 4 }]),
      'black',
      {
        ...createEmptyHands(),
        black: {
          ...createEmptyHands().black,
          pawn: 1,
          lance: 1,
        },
      },
    );

    expect(isLegalDrop(state, 'pawn', { row: 0, col: 3 })).toBe(false);
    expect(isLegalDrop(state, 'lance', { row: 0, col: 5 })).toBe(false);
  });

  it('forbids knight drops on the last two ranks', () => {
    const state = createGameState(
      createBoardWithPieces([{ piece: createPiece('black', 'king'), row: 8, col: 4 }]),
      'black',
      createHands('black', 'knight'),
    );

    expect(isLegalDrop(state, 'knight', { row: 0, col: 4 })).toBe(false);
    expect(isLegalDrop(state, 'knight', { row: 1, col: 4 })).toBe(false);
    expect(isLegalDrop(state, 'knight', { row: 2, col: 4 })).toBe(true);
  });

  it('returns white as the winner when the black king is missing', () => {
    const state = createGameState(
      createBoardWithPieces([{ piece: createPiece('white', 'king'), row: 0, col: 4 }]),
      'black',
    );

    expect(getWinner(state)).toBe('white');
  });

  it('returns black as the winner when the white king is missing', () => {
    const state = createGameState(
      createBoardWithPieces([{ piece: createPiece('black', 'king'), row: 8, col: 4 }]),
      'black',
    );

    expect(getWinner(state)).toBe('black');
  });

  it('returns null when both kings are present', () => {
    const state = createGameState(
      createBoardWithPieces([
        { piece: createPiece('white', 'king'), row: 0, col: 4 },
        { piece: createPiece('black', 'king'), row: 8, col: 4 },
      ]),
      'black',
    );

    expect(getWinner(state)).toBeNull();
  });

  it('detects the black king in check from a rook', () => {
    const state = createGameState(
      createBoardWithPieces([
        { piece: createPiece('black', 'king'), row: 8, col: 4 },
        { piece: createPiece('white', 'rook'), row: 4, col: 4 },
      ]),
      'black',
    );

    expect(isInCheck(state, 'black')).toBe(true);
  });

  it('detects the white king in check from a bishop', () => {
    const state = createGameState(
      createBoardWithPieces([
        { piece: createPiece('white', 'king'), row: 0, col: 4 },
        { piece: createPiece('black', 'bishop'), row: 4, col: 0 },
      ]),
      'black',
    );

    expect(isInCheck(state, 'white')).toBe(true);
  });

  it('does not report check when an attack path is blocked', () => {
    const state = createGameState(
      createBoardWithPieces([
        { piece: createPiece('black', 'king'), row: 8, col: 4 },
        { piece: createPiece('white', 'rook'), row: 4, col: 4 },
        { piece: createPiece('black', 'gold'), row: 6, col: 4 },
      ]),
      'black',
    );

    expect(isInCheck(state, 'black')).toBe(false);
  });

  it('does not report check in the normal initial position', () => {
    const state = createInitialGameState();

    expect(isInCheck(state, 'black')).toBe(false);
    expect(isInCheck(state, 'white')).toBe(false);
  });

  it('handles promoted attacking pieces when checking a king', () => {
    const state = createGameState(
      createBoardWithPieces([
        { piece: createPiece('white', 'king'), row: 0, col: 4 },
        { piece: createPiece('black', 'rook', true), row: 1, col: 3 },
      ]),
      'black',
    );

    expect(isInCheck(state, 'white')).toBe(true);
  });

  it('cannot move a pinned piece if that would expose the king', () => {
    const state = createGameState(
      createBoardWithPieces([
        { piece: createPiece('white', 'king'), row: 0, col: 0 },
        { piece: createPiece('white', 'rook'), row: 4, col: 4 },
        { piece: createPiece('black', 'gold'), row: 7, col: 4 },
        { piece: createPiece('black', 'king'), row: 8, col: 4 },
      ]),
      'black',
    );

    expect(sortMoves(getLegalMoves(state, { row: 7, col: 4 }))).toEqual(['6,4']);
    expect(isLegalMove(state, { row: 7, col: 4 }, { row: 7, col: 3 })).toBe(false);
  });

  it('cannot move a king onto an attacked square', () => {
    const state = createGameState(
      createBoardWithPieces([
        { piece: createPiece('white', 'king'), row: 0, col: 0 },
        { piece: createPiece('white', 'rook'), row: 4, col: 3 },
        { piece: createPiece('black', 'king'), row: 8, col: 4 },
      ]),
      'black',
    );

    expect(isLegalMove(state, { row: 8, col: 4 }, { row: 8, col: 3 })).toBe(false);
  });

  it('keeps a legal king escape move available while in check', () => {
    const state = createGameState(
      createBoardWithPieces([
        { piece: createPiece('white', 'king'), row: 0, col: 0 },
        { piece: createPiece('white', 'rook'), row: 5, col: 4 },
        { piece: createPiece('black', 'king'), row: 8, col: 4 },
      ]),
      'black',
    );

    expect(isLegalMove(state, { row: 8, col: 4 }, { row: 8, col: 3 })).toBe(true);
  });

  it('keeps a legal blocking move available while in check', () => {
    const state = createGameState(
      createBoardWithPieces([
        { piece: createPiece('white', 'king'), row: 0, col: 0 },
        { piece: createPiece('white', 'rook'), row: 5, col: 4 },
        { piece: createPiece('black', 'gold'), row: 8, col: 3 },
        { piece: createPiece('black', 'king'), row: 8, col: 4 },
      ]),
      'black',
    );

    expect(isLegalMove(state, { row: 8, col: 3 }, { row: 7, col: 4 })).toBe(true);
  });

  it('keeps a legal capture of the attacking piece available while in check', () => {
    const state = createGameState(
      createBoardWithPieces([
        { piece: createPiece('white', 'king'), row: 0, col: 0 },
        { piece: createPiece('white', 'rook'), row: 7, col: 4 },
        { piece: createPiece('black', 'gold'), row: 8, col: 3 },
        { piece: createPiece('black', 'king'), row: 8, col: 4 },
      ]),
      'black',
    );

    expect(isLegalMove(state, { row: 8, col: 3 }, { row: 7, col: 4 })).toBe(true);
  });

  it('rejects drops that leave the current player in check', () => {
    const state = createGameState(
      createBoardWithPieces([
        { piece: createPiece('white', 'king'), row: 0, col: 0 },
        { piece: createPiece('white', 'rook'), row: 4, col: 4 },
        { piece: createPiece('black', 'king'), row: 8, col: 4 },
      ]),
      'black',
      createHands('black', 'silver'),
    );

    expect(isLegalDrop(state, 'silver', { row: 4, col: 0 })).toBe(false);
    expect(sortMoves(getLegalDrops(state, 'silver'))).not.toContain('4,0');
  });

  it('allows drops that resolve check', () => {
    const state = createGameState(
      createBoardWithPieces([
        { piece: createPiece('white', 'king'), row: 0, col: 0 },
        { piece: createPiece('white', 'rook'), row: 4, col: 4 },
        { piece: createPiece('black', 'king'), row: 8, col: 4 },
      ]),
      'black',
      createHands('black', 'silver'),
    );

    expect(isLegalDrop(state, 'silver', { row: 6, col: 4 })).toBe(true);
  });

  it('is not checkmate when the checked player has an escape move', () => {
    const state = createGameState(
      createBoardWithPieces([
        { piece: createPiece('white', 'king'), row: 0, col: 0 },
        { piece: createPiece('white', 'rook'), row: 5, col: 4 },
        { piece: createPiece('black', 'king'), row: 8, col: 4 },
      ]),
      'black',
    );

    expect(isCheckmate(state, 'black')).toBe(false);
  });

  it('is not checkmate when the checked player can block', () => {
    const state = createGameState(
      createBoardWithPieces([
        { piece: createPiece('white', 'king'), row: 0, col: 0 },
        { piece: createPiece('white', 'rook'), row: 5, col: 4 },
        { piece: createPiece('black', 'gold'), row: 8, col: 3 },
        { piece: createPiece('black', 'king'), row: 8, col: 4 },
      ]),
      'black',
    );

    expect(isCheckmate(state, 'black')).toBe(false);
  });

  it('is not checkmate when the checked player can capture the attacker', () => {
    const state = createGameState(
      createBoardWithPieces([
        { piece: createPiece('white', 'king'), row: 0, col: 0 },
        { piece: createPiece('white', 'rook'), row: 7, col: 4 },
        { piece: createPiece('black', 'gold'), row: 8, col: 3 },
        { piece: createPiece('black', 'king'), row: 8, col: 4 },
      ]),
      'black',
    );

    expect(isCheckmate(state, 'black')).toBe(false);
  });

  it('is not checkmate when the checked player can resolve it with a drop', () => {
    const state = createGameState(
      createBoardWithPieces([
        { piece: createPiece('white', 'king'), row: 0, col: 0 },
        { piece: createPiece('white', 'rook'), row: 4, col: 4 },
        { piece: createPiece('black', 'king'), row: 8, col: 4 },
      ]),
      'black',
      createHands('black', 'silver'),
    );

    expect(isCheckmate(state, 'black')).toBe(false);
  });

  it('detects a simple forced mate position', () => {
    const state = createGameState(
      createBoardWithPieces([
        { piece: createPiece('white', 'king'), row: 0, col: 0 },
        { piece: createPiece('white', 'gold'), row: 6, col: 3 },
        { piece: createPiece('white', 'gold'), row: 6, col: 5 },
        { piece: createPiece('white', 'gold'), row: 7, col: 2 },
        { piece: createPiece('white', 'gold'), row: 7, col: 6 },
        { piece: createPiece('white', 'rook'), row: 7, col: 4 },
        { piece: createPiece('black', 'king'), row: 8, col: 4 },
      ]),
      'black',
    );

    expect(isCheckmate(state, 'black')).toBe(true);
  });

  it('does not count as checkmate when the player is not in check even with no legal actions', () => {
    const state = createGameState(
      createBoardWithPieces([
        { piece: createPiece('black', 'king'), row: 0, col: 0 },
        { piece: createPiece('black', 'pawn'), row: 0, col: 1 },
        { piece: createPiece('black', 'pawn'), row: 1, col: 0 },
        { piece: createPiece('black', 'pawn'), row: 1, col: 1 },
        { piece: createPiece('white', 'king'), row: 8, col: 8 },
      ]),
      'black',
    );

    expect(isInCheck(state, 'black')).toBe(false);
    expect(isCheckmate(state, 'black')).toBe(false);
  });
});
