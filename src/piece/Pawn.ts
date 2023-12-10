import BoardFactory from "../board/BoardFactory";
import { BoardUtils } from "../board/BoardUtils";
import Coordination from "../board/Coordination";
import CoordinationShift from "../board/CoordinationShift";
import { Color, PieceName } from "../enum";
import { useHistory } from "../store/useHistory";
import { usePieces } from "../store/usePieces";
import { CoordinationId } from "../types";
import { Piece } from "./Piece";


export default class Pawn extends Piece  {
    name=PieceName.PAWN
    constructor(coordination:Coordination,color:Color) {
    super(coordination,color)
    }

    override getPieceMoves(): CoordinationShift[] {
      const result = [];
  
      if (this.color === Color.WHITE) {
        result.push(new CoordinationShift(0, 1));
  
        if (this.coordination.rank === 2) {
          result.push(new CoordinationShift(0, 2));
        }
  
        result.push(new CoordinationShift(-1, 1));
        result.push(new CoordinationShift(1, 1));
      } else {
        result.push(new CoordinationShift(0, -1));
  
        if (this.coordination.rank === 7) {
          result.push(new CoordinationShift(0, -2));
        }
  
        result.push(new CoordinationShift(-1, -1));
        result.push(new CoordinationShift(1, -1));
      }


      
  
      return result
    }
  
    protected override getPieceAttacks(): CoordinationShift[] {
      const result = [];
  
      if (this.color === Color.WHITE) {
        result.push(new CoordinationShift(-1, 1));
        result.push(new CoordinationShift(1, 1));
      } else {
        result.push(new CoordinationShift(-1, -1));
        result.push(new CoordinationShift(1, -1));
      }

  
      return  result
    }

    enPassant(): CoordinationId {
      const lastMove = useHistory.getState().lastMove();
  
      if (this.isValidEnPassant()) {
          const leftFile = BoardFactory.files[this.coordination.file.charCodeAt(0) - Coordination.charNumber - 1];
          const rightFile = BoardFactory.files[this.coordination.file.charCodeAt(0) - Coordination.charNumber + 1];
          const left = new Coordination(leftFile, this.coordination.rank + (this.color === Color.WHITE ? 1 : -1));
          const right = new Coordination(rightFile, this.coordination.rank + (this.color === Color.WHITE ? 1 : -1));
              if (right.file === lastMove.to.file) {
                return right.id
              }
              else{
                  return left.id           
              }
      }
      return '' 
      
  }
  
  isValidEnPassant(){
      const lastMove=useHistory.getState().lastMove()
      if(lastMove && lastMove.pieceColor !== this.color && lastMove.pieceName === PieceName.PAWN && (Math.abs(lastMove.from.rank - lastMove.to.rank) === 2) ){
        const neiFilesChecking=Math.abs(this.coordination.file.charCodeAt(0)-lastMove.to.file.charCodeAt(0))===1
        const neiRankChecking=Math.abs(this.coordination.rank-lastMove.to.rank)===0
        return neiFilesChecking && neiRankChecking
      }
      return false
  }

  
  
  
  
  protected override isSquareAvailableForMove(coordination: Coordination): boolean {
      const boardCondition=usePieces.getState().pieces
      if(coordination.id===this.enPassant() )return true
      if (this.coordination.file === coordination.file) {
        const rankShift = Math.abs(this.coordination.rank - coordination.rank);  
        if (rankShift === 2) {
          const between = BoardUtils.getVerticalCoordinationBetween(this.coordination, coordination);
          return super.isSquareEmpty(boardCondition,between[0]) && super.isSquareEmpty(boardCondition,coordination);
        } else {
          return super.isSquareEmpty(boardCondition,coordination);
        }
      } else {
        if (super.isSquareEmpty(boardCondition,coordination)) {
          return false;
        } else {
          return boardCondition.get(coordination.id)?.color!==this.color;
        }
      }
    }
}

