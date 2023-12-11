import { BoardUtils } from '../board/BoardUtils';
import Coordination from '../board/Coordination';
import CoordinationShift from '../board/CoordinationShift';
import { Color } from '../enum';
import { usePieces } from '../store/usePieces';
import { CoordinationId, PieceType } from '../types';
import { Piece } from './Piece';

export abstract class LongRangePiece extends Piece {
  constructor(coordination: Coordination, color: Color) {
    super(coordination, color);
  }

  override isSquareAvailableForMove(coordination: Coordination): boolean {
    const result = super.isSquareAvailableForMove(coordination);
    if (result) {
      const boardCondition = usePieces.getState().pieces;
      return this.isSquareAvailableForAttack(coordination, boardCondition);
    } else {
      return false;
    }
  }

  override isSquareAvailableForAttack(
    coordination: Coordination,
    boardCondition: Map<CoordinationId, PieceType>
  ): boolean {
    let coordinationBetween;
    if (this.coordination.file == coordination.file) {
      coordinationBetween = BoardUtils.getVerticalCoordinationBetween(
        this.coordination,
        coordination
      );
    } else if (this.coordination.rank == coordination.rank) {
      coordinationBetween = BoardUtils.getHorizontalCoordinationBetween(
        this.coordination,
        coordination
      );
      
    } else {
      coordinationBetween = BoardUtils.getDiagonalCoordinationBetween(
        this.coordination,
        coordination
      );
    }

    for (const coord of coordinationBetween) {
      if (boardCondition.get(coord.id)) {
        return false;
      }
    }

    return true;
  }

  getBishopMoves(): CoordinationShift[] {
    const result = [];

    for (let i = -7; i <= 7; i++) {
      if (i == 0) continue;

      result.push(new CoordinationShift(i, i));
    }

    for (let i = -7; i <= 7; i++) {
      if (i == 0) continue;

      result.push(new CoordinationShift(i, -i));
    }

    return result;
  }

  getRookMoves(): CoordinationShift[] {
    const result = [];

    for (let i = -7; i <= 7; i++) {
      if (i == 0) continue;

      result.push(new CoordinationShift(i, 0));
    }

    for (let i = -7; i <= 7; i++) {
      if (i == 0) continue;

      result.push(new CoordinationShift(0, i));
    }

    return result;
  }
}
