import BoardFactory from '../board/BoardFactory';
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

  override getPieceMoves(): CoordinationShift[] {
    return [...this.regularKingMoves(), ...this.castlingMoves()];
  }
  private regularKingMoves(): CoordinationShift[] {
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

  private castlingMoves() {
    const result: CoordinationShift[] = [];
    const rookRank = this.color ? 8 : 1;

    // Define the file indices for short and long castling
    const shortCastlingFiles = [5, 6];
    const longCastlingFiles = [1, 2, 3];

    // Check for short castling
    if (this.canCastle(shortCastlingFiles, rookRank)) {
      result.push(new CoordinationShift(2, 0));
    }
    // Check for long castling
    if (this.canCastle(longCastlingFiles, rookRank)) {
      result.push(new CoordinationShift(-2, 0));
    }
    return result;
  }

  private canCastle(files: number[], rookRank: number): boolean {
    const boardCondition = usePieces.getState().pieces;
    let canCastleFlag = false;

    for (let file of files) {
      const coordinationBetween = new Coordination(
        BoardFactory.files[file],
        rookRank
      );
           

      if (
        this.isSquareEmpty(boardCondition, coordinationBetween) &&
        !this.isSquareAttackedByEnemy(
          coordinationBetween,
          this.oppositeColor(this.color),
          boardCondition
        ) &&
        !this.isInCheck(boardCondition)
      ) {
        const rookFile =
          files.length === 3 ? BoardFactory.files[7] : BoardFactory.files[0];
        const rook = boardCondition.get(`${rookFile}${rookRank}`);

        canCastleFlag =
          rook?.name === PieceName.ROOK &&
          !rook.isPieceMoved &&
          !this.isPieceMoved;
      }
      else{
        return false
      }
    }

    return canCastleFlag;
  }

  override getAttackedSquares(
    boardCondition: Map<CoordinationId, PieceType>
  ): Set<CoordinationId> {
    const pieceAttacks: CoordinationShift[] = this.regularKingMoves();
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
      } else {
        continue;
      }
    }
    return result;
  }
  override isSquareAvailableForMove(coordination: Coordination): boolean {
    const boardCondition = usePieces.getState().pieces;
    const isCanMove = super.isSquareAvailableForMove(
      coordination,
      boardCondition
    );
    if (!isCanMove) return false;
    return !this.isSquareAttackedByEnemy(
      coordination,
      this.oppositeColor(this.color),
      boardCondition
    );
  }
}
