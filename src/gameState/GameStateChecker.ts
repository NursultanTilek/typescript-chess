import { Color, GameState, PieceName } from '../enum';
import { CoordinationId, PieceType } from '../types';

export class GameStateChecker {
  check(
    boardCondition: Map<CoordinationId, PieceType>,
    color: Color
  ): GameState {
    const king = Array.from(boardCondition.values()).find(
      (piece) => piece?.name === PieceName.KING && piece.color === color
    );
    if (!king) {
      throw new Error('King not found');
    }
    // If the king is in check and has no available moves, it's a checkmate
    if (king.isInCheck(boardCondition) && king.getAvailableMoves().size === 0) {
      if (color === Color.BLACK) return GameState.BLACK_CHECKMATE;
      else if (color === Color.WHITE) return GameState.WHITE_CHECKMATE;
    }

    for (const piece of boardCondition.values()) {
      // If the piece is of the same color and has available moves, the game is still ongoing
      
      if (piece?.color === color && piece.getAvailableMoves().size>0) {
        return GameState.ONGOING;
      }
    }

    return GameState.STALEMATE
  }
}
