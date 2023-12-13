export enum PieceName {
  KING,
  QUEEN,
  ROOK,
  BISHOP,
  KNIGHT,
  PAWN,
}

export enum Color {
  WHITE,
  BLACK,
}

export enum GameState {
  ONGOING,
  // CHECK_TO_WHITE,
  // CHECK_TO_BLACK,
  STALEMATE,
  MATE_TO_WHITE,
  MATE_TO_BLACK
}
