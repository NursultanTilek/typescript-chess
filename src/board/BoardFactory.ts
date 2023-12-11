import whitePawn from '../../src/assets/images/pawn_w.png';
import blackPawn from '../../src/assets/images/pawn_b.png';
import whiteKnight from '../../src/assets/images/knight_w.png';
import blackKnight from '../../src/assets/images/knight_b.png';
import whiteBishop from '../../src/assets/images/bishop_w.png';
import blackBishop from '../../src/assets/images/bishop_b.png';
import whiteRook from '../../src/assets/images/rook_w.png';
import blackRook from '../../src/assets/images/rook_b.png';
import whiteQueen from '../../src/assets/images/queen_w.png';
import blackQueen from '../../src/assets/images/queen_b.png';
import whiteKing from '../../src/assets/images/king_w.png';
import blackKing from '../../src/assets/images/king_b.png';

import { Color } from '../enum';
import { CoordinationId, PieceType } from '../types';
import { usePieces } from '../store/usePieces';
import { Piece } from '../pieces/Piece';
import Coordination from './Coordination';

/** */ 

class BoardFactory   {

    startingFen:string='r3k2r/pp3p1p/8/2p3pP/8/8/PP4P1/R3K2R w KQkq g6 0 1'
    pieces = new Map<CoordinationId, PieceType>();
    

    static files = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
    static ranks = [8, 7, 6, 5, 4, 3, 2, 1];



    constructor(fen:string) {
        this.startingFen=fen?fen:this.startingFen
    }
    
    //  setupDefaultPiecesPositions(): void {



    //     //for queens

    //     this.setPiece(new Coordination('D', 1), new Queen(new Coordination('D', 1), Color.WHITE));
    //     this.setPiece(new Coordination('D', 8), new Queen(new Coordination('D', 8), Color.BLACK));


    //     // // for kings

    //     this.setPiece(new Coordination('E', 1), new King(new Coordination('E', 1), Color.WHITE));
    //     this.setPiece(new Coordination('E', 8), new King(new Coordination('E', 8), Color.BLACK));

    //     // // for rooks

    //     this.setPiece(new Coordination('A', 1), new Rook(new Coordination('A', 1), Color.WHITE));
    //     this.setPiece(new Coordination('A', 8), new Rook(new Coordination('A', 8), Color.BLACK));
    //     this.setPiece(new Coordination('H', 1), new Rook(new Coordination('H', 1), Color.WHITE));
    //     this.setPiece(new Coordination('H', 8), new Rook(new Coordination('H', 8), Color.BLACK));

    //     // for knights

    //     this.setPiece(new Coordination('G', 1), new Knight(new Coordination('G', 1), Color.WHITE));
    //     this.setPiece(new Coordination('G', 8), new Knight(new Coordination('G', 8), Color.BLACK));
    //     this.setPiece(new Coordination('B', 1), new Knight(new Coordination('B', 1), Color.WHITE));
    //     this.setPiece(new Coordination('B', 8), new Knight(new Coordination('B', 8), Color.BLACK));

    //     // for bishop

    //     this.setPiece(new Coordination('C', 1), new Bishop(new Coordination('C', 1), Color.WHITE));
    //     this.setPiece(new Coordination('C', 8), new Bishop(new Coordination('C', 8), Color.BLACK));
    //     this.setPiece(new Coordination('F', 1), new Bishop(new Coordination('F', 1), Color.WHITE));
    //     this.setPiece(new Coordination('F', 8), new Bishop(new Coordination('F', 8), Color.BLACK));

    //     // // for pawns

    //     for (const file of Board.files) {
    //         this.setPiece(new Coordination(file, 2), new Pawn(new Coordination(file, 2), Color.WHITE));
    //         this.setPiece(new Coordination(file, 7), new Pawn(new Coordination(file, 7), Color.BLACK));
    //     }


    // }

     setPiece(coordination: Coordination, piece: Piece): void {
        this.pieces.set(coordination.id, piece);
        usePieces.getState().setPieces(this.pieces)
    }
     getPiece(coordination: Coordination) {
        const piece = this.pieces.get(coordination?.id);
        return piece
    }


     getPieceImage(piece: Piece) {
        let image;

        switch (piece.name) {
            case 5:
                image = piece.color === Color.WHITE ? whitePawn : blackPawn;
                break;
            case 4:
                image = piece.color === Color.WHITE ? whiteKnight : blackKnight;
                break;
            case 3:
                image = piece.color === Color.WHITE ? whiteBishop : blackBishop;
                break;
            case 2:
                image = piece.color === Color.WHITE ? whiteRook : blackRook;
                break;
            case 1:
                image = piece.color === Color.WHITE ? whiteQueen : blackQueen;
                break;
            case 0:
                image = piece.color === Color.WHITE ? whiteKing : blackKing;
                break;
        
        }

        return image
    }

     colorBoard(file: string, rank: number): string {
        return rank % 2 === BoardFactory.files.indexOf(file) % 2 ? 'bg-yellow-200' : 'bg-yellow-800'
    }

  



  




}

export default BoardFactory;