import Coordination from "../board/Coordination";
import CoordinationShift from "../board/CoordinationShift";
import { Color, PieceName } from "../enum";
import { Piece } from "./Piece";

export default class Knight extends Piece   {
   public name=PieceName.KNIGHT
    constructor(coordination:Coordination,color:Color) {
     super(coordination,color)
    }

   override getPieceMoves(): CoordinationShift[] {
    
        return [
          new CoordinationShift(1, 2),
          new CoordinationShift(2, 1),
    
          new CoordinationShift(2, -1),
          new CoordinationShift(1, -2),
    
          new CoordinationShift(-2, -1),
          new CoordinationShift(-1, -2),  
    
          new CoordinationShift(-2, 1),
          new CoordinationShift(-1, 2)
        ];

      }
}
