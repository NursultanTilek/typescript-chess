import React from "react";
import Coordination from "./Coordination";
import Pawn from "../piece/Pawn";
import Rook from "../piece/Rook";
import { Color } from "../enum";
import Knight from "../piece/Knight";
import Bishop from "../piece/Bishop";
import Queen from "../piece/Queen";
import King from "../piece/King";
import { Piece } from "../piece/Piece";
import BoardFactory from "./BoardFactory";
import { Move } from "./Move";




export default class Board extends React.Component  {
    board:BoardFactory
    state = { selectedPieceCoordination:null, };

    constructor(props:never) {
        super(props)
        this.board=this.fromFEN('r3k2r/pp3p1p/8/2p3pP/8/8/PP4P1/R3K2R w KQkq g6 0 1')
    }
   

    fromFEN(fen: string): BoardFactory  {
      const board = new BoardFactory(fen);  
      const parts = fen.split(" ");
      const piecePositions = parts[0];
  
      const fenRows = piecePositions.split("/");
  
      for (let i = 0; i < fenRows.length; i++) {
        const row = fenRows[i];
        const rank = 8 - i; 
  
        let fileIndex = 0;
        for (let j = 0; j < row.length; j++) {
          const fenChar = row.charAt(j);
  
          if (!isNaN(Number(fenChar))) {
            fileIndex += Number(fenChar); 
          } else {
            const file = BoardFactory.files[fileIndex]; 
            const coordination = new Coordination(file, rank);
              
            board.setPiece(coordination, this.fromFenChar(fenChar, coordination));
            fileIndex++;
          }
        }
      }
  
      return board;
    }

  private  fromFenChar(fenChar: string, coordination: Coordination): Piece{
  
        switch(fenChar) {
          case 'p':
            return new Pawn(coordination,Color.BLACK );
          
          case 'P':  
            return new Pawn( coordination,Color.WHITE);
    
          case 'r':
            return new Rook( coordination,Color.BLACK);
    
          case 'R':
            return new Rook( coordination,Color.WHITE);
    
          case 'n':
            return new Knight( coordination,Color.BLACK);
          
          case 'N':
            return new Knight( coordination,Color.WHITE);  
    
          case 'b':
            return new Bishop( coordination,Color.BLACK);
    
          case 'B':
            return new Bishop( coordination,Color.WHITE);
          
          case 'q':
            return new Queen( coordination,Color.BLACK);
    
          case 'Q':
            return new Queen( coordination,Color.WHITE);  
    
          case 'k':
            return new King( coordination,Color.BLACK);
    
          case 'K':
            return new King( coordination,Color.WHITE);
    
          default: 
            throw new Error("Unknown FEN character");    
        }
    
  }
  getMoveIndicators() {
    const { selectedPieceCoordination } = this.state;
    if (selectedPieceCoordination) {
        const indicators = this.board.getPiece(selectedPieceCoordination)?.getAvailableMoves()
        return indicators
    }

    

}

  showCheckedKing(){
    
  }

 renderPieceMoveIndicator(file: string, rank: number): string {
    const currentBoard = new Coordination(file, rank).id
    const indicators = this.getMoveIndicators()

    if (!indicators) return ''
    for (const indicator of indicators) {
        if (currentBoard === indicator) {
            const pieceExist = this.board.pieces.get(indicator)
            return pieceExist ? 'piece' : 'empty'
        }

    }
    return ''
}

  handleMove = (file: string, rank: number) => {
    const { selectedPieceCoordination } = this.state;
    const currentCoordination = new Coordination(file, rank);

    if (selectedPieceCoordination && this.board.getPiece(selectedPieceCoordination)) {
        // If a piece is already selected, attempt to move it

        new Move(currentCoordination, selectedPieceCoordination).move()
        //Clearing the spaces of the move 
        this.board.getPiece(currentCoordination)?.availableMoves?.clear()
        // Reset the selected piece coordination
        this.setState({ selectedPieceCoordination: null });
    } else {
        // If no piece is selected, update the selected piece coordination
        this.setState({ selectedPieceCoordination: currentCoordination });
   


    }


}
  
    // copy(source: Board): Board {
    //   const clone = this.fromFEN(source.startingFen);
      
    //   source.moves.forEach(move => {
    //     clone.makeMove(move); 
    //   });
  
    //   return clone;
    // }

  render() {
     return (
            <div className="flex justify-center items-center">
                <div className="inline-block">
                    {BoardFactory.ranks.map((rank) => (
                        <div key={rank} className="flex">
                            <div className=" w-12 h-12 flex items-center justify-center font-bold">{rank}</div>
                            {BoardFactory.files.map((file) => {
                                const piece = this.board.getPiece(new Coordination(file, rank))
                              
                                return (
                                    <div
                                        key={file + rank}
                                        onClick={() => this.handleMove(file, rank)}
                                        id={file + rank}
                                        className={` w-12 h-12 flex items-center justify-center font-bold  relative ${this.board.colorBoard(file, rank)} `}
                                    >
                                        <div>
                                            {piece && (
                                                <img
                                                    src={this.board.getPieceImage(piece)}
                                                    alt={`${piece.name}_${piece.color}`}
                                                />
                                            )}

                                        </div>
                                        <div
                                            className={`absolute inset-0 z-0   ${this.renderPieceMoveIndicator(file, rank)} `}
                                        >
                                        </div>

                                    </div>
                                );

                            })}
                        </div>
                    ))}

                    <div className="flex">
                        <div className="w-12"></div>
                        {BoardFactory.files.map((file) => (
                            <div key={file} className=" w-12 h-12 flex items-center justify-center font-bold">
                                {file}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
  }

