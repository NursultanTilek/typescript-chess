import Coordination from "../board/Coordination";
import CoordinationShift from "../board/CoordinationShift";
import { Color, PieceName } from "../enum";
import { LongRangePiece } from "./LongRangePiece";

export default class Queen extends LongRangePiece  {
    public name=PieceName.QUEEN
    constructor(coordination:Coordination,color:Color) {
     super(coordination,color)

    }
    override getPieceMoves(): CoordinationShift[] {
      return [...super.getRookMoves(), ...super.getBishopMoves()];
    }

}
