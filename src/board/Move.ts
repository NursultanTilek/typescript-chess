
import { Color, PieceName } from "../enum";
import Pawn from "../piece/Pawn";
import Queen from "../piece/Queen";
import { useHistory } from "../store/useHistory";
import { usePieces } from "../store/usePieces";
import { CoordinationId, PieceType } from "../types";
import Coordination from "./Coordination";

export type IMove={
    to:Coordination,
    from:Coordination,
    pieceName:PieceName|undefined,
    pieceColor:Color|undefined,
    boardCondition:Map<CoordinationId,PieceType>

}

export  class Move implements IMove {
    to:Coordination
    from:Coordination
    pieceName:PieceName|undefined
    pieceColor:Color|undefined
    boardCondition:Map<CoordinationId,PieceType>

    constructor(to:Coordination,from:Coordination) {
        this.to=to
        this.from=from
        this.boardCondition=usePieces.getState().pieces
        this.pieceName=this.boardCondition.get(from.id)?.name
        this.pieceColor=this.getPieceColor
    }


    move(){

        //TODO 3) QUEUE OF MOVE BETWEEN BLACK AND WHITE 

        const piece: PieceType = this.boardCondition.get(this.from.id);
    

        if (piece && !this.isTheSamePosition && this.isMoveOnlyInSelectedPosition(piece) ) {
            this.deleteEnPassantPawn()
            if(this.transformPawnToAnotherPiece()){
                this.transformPawnToAnotherPiece()
            }
            else{
                
                this.moveUtils(piece)
            }
            useHistory.getState().addMove(this); 
        }
    }

    isMoveOnlyInSelectedPosition(piece:PieceType){
        const availableMoves=piece?.availableMoves
        if(availableMoves && this.to.id){
            if(availableMoves.has(this.to.id)) return true
        }
        return false
    }


    getPiece(coordination:Coordination) {
        const piece = this.boardCondition.get(coordination?.id);
        return piece
    }

    get isTheSamePosition(){
        return this.to.id === this.from.id
    }
    get getPieceColor(){
        const piece = this.boardCondition.get(this.from?.id);
        return piece?.color
    }



    setPiece(piece:PieceType){
        if(this.to.id  && piece){
            this.boardCondition.set(this.to.id, piece);
            piece.coordination=new Coordination(this.to.file,this.to.rank)
        }
        usePieces.getState().setPieces(this.boardCondition)
    }
    deletePiece(){
        this.boardCondition.delete(this.from.id)
    }
    deleteEnPassantPawn(){    
        const piece=this.getPiece(this.from) 
        if(piece instanceof Pawn && piece.enPassant()===this.to.id && useHistory.getState().lastMove()?.pieceName===PieceName.PAWN ){
            
            const lastMovePawnPosition=useHistory.getState().lastMove()?.to.id
            const lastMovePawn=this.boardCondition.get(lastMovePawnPosition)
            this.boardCondition.delete(lastMovePawn?.coordination.id)
            
        }
    }

    transformPawnToAnotherPiece(){
        let newQueen ;
        if(this.getPiece(this.from)?.name===PieceName.PAWN && this.to.rank===8 && this.getPiece(this.from)?.color===Color.WHITE){
            newQueen = new Queen(this.from,Color.WHITE);
        }
        else if (this.getPiece(this.from)?.name===PieceName.PAWN && this.to.rank===1 && this.getPiece(this.from)?.color===Color.BLACK){
            newQueen = new Queen(this.from,Color.BLACK); 
        }
        this.setPiece(newQueen)
        this.deletePiece()
        return newQueen;
        
    }

    moveUtils(piece:PieceType){
        if(piece){
            piece.isPieceMoved=true
        }
        this.setPiece(piece)
        this.deletePiece()
      
    }
    // castle(king: King, rook: Rook) {

    //     if(king.canCastle(rook)) {
    
    //       this.boardCondition.delete(rook.coordination.id);
    //       rook.coordination = this.getRookCastledCoord(rook); 
    //       this.boardCondition.set(rook.coordination.id, rook);
    
    //       this.boardCondition.delete(king.coordination.id);
    //       king.coordination = this.getKingCastledCoord(king);
    //       this.boardCondition.set(king.coordination.id, king);
    
    //       king.isCastled = true;
    //       rook.isCastled = true;
    
    //       usePieces.setState(this.boardCondition);
    //       useHistory.addMove(this);
    
    //     }
    
    //   }

}