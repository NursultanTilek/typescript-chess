import { Color, PieceName } from '../enum';
import Pawn from '../pieces/Pawn';
import Queen from '../pieces/Queen';
import { useHistory } from '../store/useHistory';
import { usePieces } from '../store/usePieces';
import { CoordinationId, PieceType } from '../types';
import Coordination from './Coordination';

export type IMove = {
  to: Coordination;
  from: Coordination;
  pieceName: PieceName | undefined;
  pieceColor: Color | undefined;
  boardCondition: Map<CoordinationId, PieceType>;
};

export class Move implements IMove {
    to: Coordination;
    from: Coordination;
    pieceName: PieceName | undefined;
    pieceColor: Color | undefined;
    boardCondition: Map<CoordinationId, PieceType>;

  constructor(to: Coordination, from: Coordination) {
    this.to = to;
    this.from = from;
    this.boardCondition = usePieces.getState().pieces;
    this.pieceName = this.boardCondition.get(from.id)?.name;
    this.pieceColor = this.getPieceColor;
  }

  move() {
    const piece: PieceType = this.boardCondition.get(this.from.id);

    if (
      piece &&
      !this.isTheSamePosition &&
      this.isMoveOnlyInSelectedPosition(piece)
    ) {
      this.handleCastling(piece);
      this.deleteEnPassantPawn();
      if (this.transformPawnToAnotherPiece()) {
        this.transformPawnToAnotherPiece();
      } else {
        this.moveUtils(piece);
      }
      useHistory.getState().addMove(this);
    }
  }

  isMoveOnlyInSelectedPosition(piece: PieceType) {
    const availableMoves = piece?.getAvailableMoves();
    if (availableMoves && this.to.id) {
      if (availableMoves.has(this.to.id)) return true;
    }
    return false;
  }

  getPiece(coordination: Coordination) {
    const piece = this.boardCondition.get(coordination?.id);
    return piece;
  }

  get isTheSamePosition() {
    return this.to.id === this.from.id;
  }
  get getPieceColor() {
    const piece = this.boardCondition.get(this.from?.id);
    return piece?.color;
  }
  get isTheSameColor(){
    const fromPiece=this.getPiece(this.from)
    const toPiece=this.getPiece(this.to)
    return fromPiece?.color===toPiece?.color

  }

  setPiece(piece: PieceType) {
    if (this.to.id && piece) {
      this.boardCondition.set(this.to.id, piece);
      piece.coordination = new Coordination(this.to.file, this.to.rank);
    }
    usePieces.getState().setPieces(this.boardCondition);
  }
  deletePiece() {
    this.boardCondition.delete(this.from.id);
  }
  deleteEnPassantPawn() {
    const piece = this.getPiece(this.from);
    if (
      piece instanceof Pawn &&
      piece.enPassant() === this.to.id &&
      useHistory.getState().lastMove()?.pieceName === PieceName.PAWN
    ) {
      const lastMovePawnPosition = useHistory.getState().lastMove()?.to.id;
      const lastMovePawn = this.boardCondition.get(lastMovePawnPosition);
      this.boardCondition.delete(lastMovePawn?.coordination.id);
    }
  }

  transformPawnToAnotherPiece() {
    let newQueen;
    if (
      this.getPiece(this.from)?.name === PieceName.PAWN &&
      this.to.rank === 8 &&
      this.getPiece(this.from)?.color === Color.WHITE
    ) {
      newQueen = new Queen(this.from, Color.WHITE);
    } else if (
      this.getPiece(this.from)?.name === PieceName.PAWN &&
      this.to.rank === 1 &&
      this.getPiece(this.from)?.color === Color.BLACK
    ) {
      newQueen = new Queen(this.from, Color.BLACK);
    }
    this.setPiece(newQueen);
    this.deletePiece();
    return newQueen;
  }

  moveUtils(piece: PieceType) {
    if (piece) {
      piece.isPieceMoved = true;
    }
    this.setPiece(piece);
    this.deletePiece();
  }
  handleCastling(piece: PieceType) {
    const isKing = piece?.name === PieceName.KING;
    const isWhite = piece?.color === Color.WHITE;
    const isBlack = piece?.color === Color.BLACK;
  
    if (isKing) {
      if (isWhite) {
        this.castle('G1', 'H1', 'F1', piece);
        this.castle('C1', 'A1', 'D1', piece);
      } else if (isBlack) {
        this.castle('G8', 'H8', 'F8', piece);
        this.castle('C8', 'A8', 'D8', piece);
      }
    }
  }

  castle(kingTargetId: string, rookSourceId: string, rookTargetId: string, piece: PieceType) {
    const boardCondition = usePieces.getState().pieces;
  
    if (this.to.id === kingTargetId) {
      this.setPiece(piece);
      this.deletePiece();

      const rook = boardCondition.get(rookSourceId);
      if (rook) {
        rook.coordination = new Coordination(rookTargetId.charAt(0), parseInt(rookTargetId.charAt(1)));
        this.boardCondition.set(rookTargetId, rook);
        this.boardCondition.delete(rookSourceId);
      }
    }
  }
  
}
