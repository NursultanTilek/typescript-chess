import whitePawn from '../../src/assets/images/pawn_w.png';
import blackPawn from '../../src/assets/images/pawn_b.png';
import whiteKnight from '../../src/assets/images/knight_w.png';
import blackKnight from '../../src/assets/images/knight_b.png';
import whiteBishop from '../../src/assets/images/bishop_w.png';
import blackBishop from '../../src/assets/images/bishop_b.png';
import whiteRook from '../../src/assets/images/rook_w.png';
import blackRook from '../../src/assets/images/rook_b.png';
import whiteQueen from '../../src/assets/images/queen_w.png';
import blackQueen from '../../src/assets/images/queen_b.png';
import whiteKing from '../../src/assets/images/king_w.png';
import blackKing from '../../src/assets/images/king_b.png';

import { Color, PieceName } from '../enum';
import { CoordinationId, PieceType } from '../types';
import { usePieces } from '../store/usePieces';
import { Piece } from '../pieces/Piece';
import Coordination from './Coordination';
import Pawn from '../pieces/Pawn';
import Rook from '../pieces/Rook';
import Knight from '../pieces/Knight';
import Bishop from '../pieces/Bishop';
import Queen from '../pieces/Queen';
import King from '../pieces/King';

/** */

class BoardFactory {
  startingFen: string = 'r3k2r/pp3p1p/8/2p3pP/8/8/PP4P1/R3K2R w KQkq g6 0 1';
  pieces = new Map<CoordinationId, PieceType>();

  static files = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
  static ranks = [8, 7, 6, 5, 4, 3, 2, 1];

  constructor(fen: string) {
    this.startingFen = fen ? fen : this.startingFen;
  }

  static setupPiecePosition(
    coordination: Coordination,
    pieceName: PieceName,
    color: Color
  ) {
    switch (pieceName) {
      case PieceName.PAWN:
        return new Pawn(coordination, color);

      case PieceName.ROOK:
        return new Rook(coordination, color);

      case PieceName.KNIGHT:
        return new Knight(coordination, color);

      case PieceName.BISHOP:
        return new Bishop(coordination, color);

      case PieceName.QUEEN:
        return new Queen(coordination, color);

      case PieceName.KING:
        return new King(coordination, color);
    }
  }

  setPiece(coordination: Coordination, piece: Piece): void {
    this.pieces.set(coordination.id, piece);
    usePieces.getState().setPieces(this.pieces);
  }
  getPiece(coordination: Coordination) {
    const piece = this.pieces.get(coordination?.id);
    return piece;
  }

  getPieceImage(piece: Piece) {
    let image;

    switch (piece.name) {
      case 5:
        image = piece.color === Color.WHITE ? whitePawn : blackPawn;
        break;
      case 4:
        image = piece.color === Color.WHITE ? whiteKnight : blackKnight;
        break;
      case 3:
        image = piece.color === Color.WHITE ? whiteBishop : blackBishop;
        break;
      case 2:
        image = piece.color === Color.WHITE ? whiteRook : blackRook;
        break;
      case 1:
        image = piece.color === Color.WHITE ? whiteQueen : blackQueen;
        break;
      case 0:
        image = piece.color === Color.WHITE ? whiteKing : blackKing;
        break;
    }

    return image;
  }

  colorBoard(file: string, rank: number): string {
    return rank % 2 === BoardFactory.files.indexOf(file) % 2
      ? 'bg-yellow-200'
      : 'bg-yellow-800';
  }
}

export default BoardFactory;
