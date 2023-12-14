import BoardFactory from '../board/BoardFactory';
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
    const availableMoves: Set<CoordinationId> = new Set();
    const boardCondtion = usePieces.getState().pieces;

    for (const move of this.getPieceMoves()) {
      const newCoordination = this.coordinationAvailablityUttils(move);
      if (
        newCoordination &&
        this.isSquareAvailableForAttack(newCoordination, boardCondtion) &&
        this.isSquareAvailableForMove(newCoordination, boardCondtion) &&
        this.isMoveSafe(newCoordination)
      ) {
        availableMoves.add(newCoordination.id);
      }
    }

    return availableMoves;
  }

  protected isSquareAvailableForMove(
    coordination: Coordination,
    boardCondition: Map<CoordinationId, PieceType>
  ) {
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

  public isMoveSafe(newCoordination: Coordination) {
    const boardCondition = usePieces.getState().pieces;
    const tempBoard = new Map(boardCondition);
    // Simulating the move
    tempBoard.delete(this.coordination.id);
    const pieceName = this.name;
    const color = this.color;
    const newPiece = BoardFactory.setupPiecePosition(
      newCoordination,
      pieceName,
      color
    );
    tempBoard.set(newCoordination.id, newPiece);

    return !this.isInCheck(tempBoard);
  }

  private coordinationAvailablityUttils(move: CoordinationShift) {
    if (this.coordination.canShift(move)) {
      const coordination = new Coordination(
        this.coordination.file,
        this.coordination.rank
      );
      if (coordination) return coordination.shift(move);
    }
  }
  public isInCheck(boardCondition: Map<CoordinationId, PieceType>) {
    const kingPosition = this.sameColorKingPosition(boardCondition);
    if (kingPosition)
      return this.isSquareAttackedByEnemy(
        kingPosition,
        this.oppositeColor(this.color),
        boardCondition
      );
  }
  public sameColorKingPosition(
    boardCondition: Map<CoordinationId, PieceType>
  ): Coordination | undefined {
    const boardPieces = boardCondition.values();
    for (const piece of boardPieces) {
      if (
        piece &&
        piece.color === this.color &&
        piece.name === PieceName.KING
      ) {
        return piece.coordination;
      }
    }
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
  abstract getPieceMoves(): CoordinationShift[];
  castlingMoves() {
    return this.getPieceMoves();
  }
}
