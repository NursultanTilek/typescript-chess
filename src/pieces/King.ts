import BoardFactory from '../board/BoardFactory';
import { BoardUtils } from '../board/BoardUtils';
import Coordination from '../board/Coordination';
import CoordinationShift from '../board/CoordinationShift';
import { Color, PieceName } from '../enum';
import { usePieces } from '../store/usePieces';
import { CoordinationId, PieceType } from '../types';
import { Piece } from './Piece';

export default class King extends Piece {
  public name = PieceName.KING;
  constructor(coordination: Coordination, color: Color) {
    super(coordination, color);
  }
  get regularKingMoves(): CoordinationShift[] {
    const result: CoordinationShift[] = [];

    // Add regular king moves
    for (let fileShift = -1; fileShift <= 1; fileShift++) {
      for (let rankShift = -1; rankShift <= 1; rankShift++) {
        if (fileShift === 0 && rankShift === 0) continue;
        result.push(new CoordinationShift(fileShift, rankShift));
      }
    }
    return result;
  }

  get castlingMoves(): CoordinationShift[] {
    const result: CoordinationShift[] = [];
    const boardCondition = usePieces.getState().pieces;
    const rookRank = this.color ? 8 : 1;
    let isCoordinationBetweenEmpty = true;
    // Check for short castling
    for (let i = 5; i < 7; i++) {
      const coordinationBetween = new Coordination(
        BoardFactory.files[i],
        this.color === Color.WHITE ? 1 : 8
      );
      if (!this.isSquareEmpty(boardCondition, coordinationBetween)) {
        isCoordinationBetweenEmpty = false;
        break;
      } else isCoordinationBetweenEmpty = true;
    }
    const shortCastleRook = boardCondition.get(
      `${BoardFactory.files[7]}${rookRank}`
    );
    let isItRook = shortCastleRook?.name === PieceName.ROOK;
    if (
      isItRook &&
      shortCastleRook?.isPieceMoved === false &&
      !this.isPieceMoved &&
      isCoordinationBetweenEmpty
    ) {
      result.push(new CoordinationShift(2, 0));
    }
    // Check for long castling
    for (let i = 1; i < 4; i++) {
      const coordinationBetween = new Coordination(
        BoardFactory.files[i],
        this.color == Color.WHITE ? 1 : 8
      );
      if (!this.isSquareEmpty(boardCondition, coordinationBetween)) {
        isCoordinationBetweenEmpty = false;
        break;
      } else isCoordinationBetweenEmpty = true;
    }

    const longCastleRook = boardCondition.get(
      `${BoardFactory.files[0]}${rookRank}`
    );
    isItRook = longCastleRook?.name === PieceName.ROOK;

    if (
      isItRook &&
      !longCastleRook?.isPieceMoved &&
      !this.isPieceMoved &&
      isCoordinationBetweenEmpty
    ) {
      result.push(new CoordinationShift(-2, 0));
    }
    return result;
  }

  override getPieceMoves(): CoordinationShift[] {
    return [...this.regularKingMoves, ...this.castlingMoves];
  }

  private isMoveSafe(coordination: Coordination): boolean {
    const boardCondition=usePieces.getState().pieces
    const tempBoard = new Map(boardCondition);
    // Simulating the move
    tempBoard.delete(this.coordination.id);
    const king = new King(coordination, this.color);
    tempBoard.set(coordination.id, king);
    // Check if the king would be in check after the move
    const isInCheck = this.isSquareAttackedByEnemy(
      coordination,
      this.oppositeColor(this.color),
      tempBoard
    );

    //Checking enemy attacking the way to castle

    const squareRank = this.color ? 8 : 1;
    let shortCastle=new Coordination(BoardFactory.files[5],squareRank)
    let longCastle=new Coordination(BoardFactory.files[2],squareRank)
    let isCastleAvailable=true

      if(coordination===shortCastle && this.isSquareAttackedByEnemy(coordination,this.oppositeColor(this.color),boardCondition)){
        isCastleAvailable=false
      }

    // Returning the opposite of isInCheck because if the king is in check, the move is not safe

    return isCastleAvailable && !isInCheck;
  }

 
  
  // override isSquareAvailableForAttack(coordination: Coordination, boardCondition: Map<CoordinationId, PieceType>): boolean {
  //   const coordinationBetween=BoardUtils.getHorizontalCoordinationBetween(this.coordination,coordination)
  //   for (const coord of coordinationBetween) {
  //     if (boardCondition.get(coord.id)) {
  //       return false;
  //     }
  //   }

  //   return true;
  // }

  override isSquareAvailableForMove(coordination: Coordination): boolean {
    const boardCondition = usePieces.getState().pieces;
    const isCanMove = super.isSquareAvailableForMove(coordination);
    if (!isCanMove) return false;

    return (
      !this.isSquareAttackedByEnemy(
        coordination,
        this.oppositeColor(this.color),
        boardCondition
      ) && this.isMoveSafe(coordination)
    );
  }
}
