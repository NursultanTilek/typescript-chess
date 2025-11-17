import { CoordinationId, PieceType } from '../types';
import BoardFactory from '../board/BoardFactory';
import Coordination from '../board/Coordination';

/**
 * Creates a deep copy of the board with completely new piece instances
 * This ensures AI calculations don't corrupt the display board state
 */
export function deepCloneBoard(board: Map<CoordinationId, PieceType>): Map<CoordinationId, PieceType> {
  const newBoard = new Map<CoordinationId, PieceType>();

  for (const [coordId, piece] of board.entries()) {
    if (piece) {
      // Create a completely new piece instance at the same position
      const coordination = Coordination.fromId(coordId);
      const newPiece = BoardFactory.setupPiecePosition(
        coordination,
        piece.name,
        piece.color
      );

      if (newPiece) {
        // Preserve the isPieceMoved flag
        newPiece.isPieceMoved = piece.isPieceMoved;
        newBoard.set(coordId, newPiece);
      }
    }
  }

  return newBoard;
}
