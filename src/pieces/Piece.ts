import Coordination from '../board/Coordination';
import CoordinationShift from '../board/CoordinationShift';
import { Color, PieceName } from '../enum';
import { usePieces } from '../store/usePieces';
import { CoordinationId, PieceType } from '../types';
// import { usePieces } from "../store/usePieces";
// import { CoordinationId,PieceType } from "../types";
export abstract class Piece {
  coordination: Coordination;
  color: Color;
  name: PieceName;
  isPieceMoved: boolean;
  constructor(coordination: Coordination, color: Color) {
    this.coordination = coordination;
    this.color = color;
    this.name = 0;
    this.isPieceMoved = false;
  }

  //returns available moves where piece can legally move
  getAvailableMoves(): Set<CoordinationId> {
    const boardCondition = usePieces.getState().pieces;
    const availableMoves:Set<CoordinationId>=new Set()
   

    for (const shift of this.getPieceMoves()) {
      if (this.coordination.canShift(shift)) {
        const coordination = new Coordination(
          this.coordination.file,
          this.coordination.rank
        );
        const newCoordination = coordination.shift(shift);
        if (
          this.isSquareAvailableForMove(newCoordination) &&
          this.isSquareAvailableForAttack(newCoordination, boardCondition)
        ) {
          availableMoves.add(newCoordination.id);
        }
      }
    }

    return availableMoves;
  }

  protected isSquareAvailableForMove(coordination: Coordination) {
    const boardCondition = usePieces.getState().pieces;
    return (
      !this.isSamePieceColor(boardCondition, coordination) ||
      this.isSquareEmpty(boardCondition, coordination)
    );
  }

  protected isSquareEmpty(
    boardCondition: Map<CoordinationId, PieceType>,
    coordination: Coordination
  ) {
    return !boardCondition.get(coordination.id);
  }

  private isSamePieceColor(
    boardCondition: Map<CoordinationId, PieceType>,
    coordination: Coordination
  ) {
    return boardCondition.get(coordination.id)?.color === this.color;
  }

  protected getPiecesByColor(
    color: Color,
    board: Map<CoordinationId, PieceType>
  ): Piece[] {
    const result: Piece[] = [];
    const boardPieces = board.values();

    for (const piece of boardPieces) {
      if (piece?.color === color) {
        result.push(piece);
      }
    }
    return result;
  }

  //TODO 1)CHEKCING ENEMY PIECE ATTACKING THE KING, WHICH PARALYZED PIECES WHICH CANNOT BLOCK THE ATTACK OR CAPTURE THE ATTACKING PIECE,
  //TODO MENTION DOUBLE ATTACK ,WHERE ATTACKED KING MAKE THE MOVE
  //TODO 2) DO NOT FORGET ABOUT DISCOVERY ATTACK TO THE OWN KING , AFTER YOU DID THIS , SOLVE THIS LIKE i DID ON KING CLASS LIKE THIS FUNCTION isMoveSafe()

  //Checking a square where king can not move
  protected isSquareAttackedByEnemy(
    coordination: Coordination,
    color: Color,
    boardCondition: Map<CoordinationId, PieceType>
  ): boolean {
    const pieces = this.getPiecesByColor(color, boardCondition);
    for (const piece of pieces) {
      const attackedSquares = piece.getAttackedSquares(boardCondition);
      if (attackedSquares.has(coordination.id)) {
        return true;
      }
    }

    return false;
  }
  protected getPieceAttacks(): CoordinationShift[] {
    return this.getPieceMoves();
  }
  public oppositeColor = (color: Color): number => {
    return color === Color.WHITE ? Color.BLACK : Color.WHITE;
  };
  ///Getting all attacked squares from the enemy
  public getAttackedSquares(
    boardCondition: Map<CoordinationId, PieceType>
  ): Set<CoordinationId> {
    const pieceAttacks: CoordinationShift[] = this.getPieceAttacks();
    const result: Set<CoordinationId> = new Set<CoordinationId>();
    for (const pieceAttack of pieceAttacks) {
      if (this.coordination.canShift(pieceAttack)) {
        const shiftedCoordinates: Coordination =
          this.coordination.shift(pieceAttack);
        if (
          this.isSquareAvailableForAttack(shiftedCoordinates, boardCondition)
        ) {
          result.add(shiftedCoordinates.id);
        }
      }
    }
    return result;
  }
  protected isSquareAvailableForAttack(
    coordination: Coordination,
    boarCondtion: Map<CoordinationId, PieceType>
  ): boolean {
    if (coordination && boarCondtion) return true;
    return false;
  }
  protected abstract getPieceMoves(): CoordinationShift[];
}
