import React from "react";
import Coordination from "./Coordination";
import Pawn from "../pieces/Pawn";
import Rook from "../pieces/Rook";
import { Color, PieceName } from "../enum";
import Knight from "../pieces/Knight";
import Bishop from "../pieces/Bishop";
import Queen from "../pieces/Queen";
import King from "../pieces/King";
import { Piece } from "../pieces/Piece";
import BoardFactory from "./BoardFactory";
import { Move } from "./Move";
import { useHistory } from "../store/useHistory";
import { usePieces } from "../store/usePieces";
import { CoordinationId, PieceType } from "../types";



interface BoardProps {
  colorTurn: Color,
  changeColorTurn: () => void,
  changeBoardCondition:(boardCondition:Map<CoordinationId,PieceType>)=>void
}

export default class Board extends React.Component<BoardProps> {
  board: BoardFactory
  state: { selectedPieceCoordination: Coordination | null } = { selectedPieceCoordination: null };
  constructor(props:BoardProps) {
    super(props)
    this.board = this.fromFEN('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1')
  }
  fromFEN(fen: string): BoardFactory {
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
    usePieces.getState().setPieces(board.pieces)
    return board;
  }

  private fromFenChar(fenChar: string, coordination: Coordination): Piece {

    switch (fenChar) {
      case 'p':
        return new Pawn(coordination, Color.BLACK);
      case 'P':
        return new Pawn(coordination, Color.WHITE);

      case 'r':
        return new Rook(coordination, Color.BLACK);

      case 'R':
        return new Rook(coordination, Color.WHITE);

      case 'n':
        return new Knight(coordination, Color.BLACK);

      case 'N':
        return new Knight(coordination, Color.WHITE);

      case 'b':
        return new Bishop(coordination, Color.BLACK);

      case 'B':
        return new Bishop(coordination, Color.WHITE);

      case 'q':
        return new Queen(coordination, Color.BLACK);

      case 'Q':
        return new Queen(coordination, Color.WHITE);

      case 'k':
        return new King(coordination, Color.BLACK);

      case 'K':
        return new King(coordination, Color.WHITE);

      default:
        throw new Error("Unknown FEN character");
    }

  }
  private getMoveIndicators() {
    const { selectedPieceCoordination } = this.state;
    const boardCondition = usePieces.getState().pieces;
    if (selectedPieceCoordination) {
      const piece = boardCondition.get(selectedPieceCoordination.id);
      if (piece?.color !== this.props.colorTurn) return
      else {
        const indicators = piece?.getAvailableMoves()
        return indicators
      }
    }
  }
  private isCurrentPositionLegalToMove(currentCondition: Coordination) {
    const { selectedPieceCoordination } = this.state;
    const boardCondition = usePieces.getState().pieces;
    if (selectedPieceCoordination) {
      const availableMoves = boardCondition.get(selectedPieceCoordination.id)?.getAvailableMoves()
      return availableMoves?.has(currentCondition.id)
    }
    else {
      this.setState({ selectedPieceCoordination: null });
      return false
    }
  }

  private showCheckedKing(file: string, rank: number) {
    const coordination = new Coordination(file, rank);
    const boardCondition = usePieces.getState().pieces;
    const king = boardCondition.get(coordination.id);

    // Ensure the piece is a King of the correct color
    if (king && king.name === PieceName.KING) {
      // Get all pieces of the opposite color
      const enemyPieces = Array.from(boardCondition.values()).filter(
        piece => piece?.color !== king.color
      );

      // Check if any enemy piece can attack the King
      for (const enemyPiece of enemyPieces) {
        const attackedSquares = enemyPiece?.getAttackedSquares(boardCondition);
        if (attackedSquares?.has(coordination.id)) {
          return 'under-check';
        }
      }
    }

    return '';
  }

  private renderMoveIndicator(file: string, rank: number): string {
    const currentBoard = new Coordination(file, rank);
    const indicators = this.getMoveIndicators();
    const { selectedPieceCoordination } = this.state;
    const boardCondition = usePieces.getState().pieces;

    if (selectedPieceCoordination) {
      const selected = boardCondition.get(selectedPieceCoordination.id)?.coordination.id;
      if (currentBoard.id === selected) return 'selected';
    }

    if (!indicators) return '';
    for (const indicator of indicators) {
      if (currentBoard.id === indicator) {
        const pieceExist = boardCondition.get(indicator);
        return pieceExist ? '' : 'empty';
      }
    }
    return '';
  }

  private renderPreviousMovePositions(file: string, rank: number) {
    const history = useHistory.getState().history
    if (history.length) {
      const lastMove = useHistory.getState().lastMove()
      const coordination = new Coordination(file, rank).id
      if (lastMove.to.id == coordination || lastMove.from.id == coordination) return 'last-move'
    }
    return ''
  }
  private renderPieceMoveIndicator(file: string, rank: number) {
    const currentBoard = new Coordination(file, rank);
    const indicators = this.getMoveIndicators();
    const boardCondition = usePieces.getState().pieces;
    if (!indicators) return '';
    for (const indicator of indicators) {
      if (currentBoard.id === indicator) {
        const pieceExist = boardCondition.get(indicator);
        return pieceExist ? 'piece' : '';
      }
    }
    return '';
  }

  private handleMove = (file: string, rank: number) => {
    const { selectedPieceCoordination } = this.state;
    const currentCoordination = new Coordination(file, rank);
    // If the same piece is clicked again, deselect it
    if (selectedPieceCoordination && selectedPieceCoordination.id === currentCoordination.id) {
      this.setState({ selectedPieceCoordination: null });
      return;
    }
    // If a piece is already selected, attempt to move it
    if (selectedPieceCoordination && this.isCurrentPositionLegalToMove(currentCoordination)) {
      const pieceActivity = new Move(currentCoordination, selectedPieceCoordination);
      pieceActivity.move();
      if (!pieceActivity.isTheSamePosition){
        this.props?.changeColorTurn!()
        const boardCondition = usePieces.getState().pieces;
        // CRITICAL: Create new Map to avoid reference sharing with global store
        this.props.changeBoardCondition!(new Map(boardCondition))

      }

      this.setState({ selectedPieceCoordination: null });
    } else {
      // If no piece is selected or an invalid move is clicked, update the selected piece coordination
      const boardCondition = usePieces.getState().pieces;
      if (boardCondition.get(currentCoordination.id)?.color === this.props.colorTurn) {
        this.setState({ selectedPieceCoordination: currentCoordination });
      } else {
        this.setState({ selectedPieceCoordination: null });
      }
    }
  }


  render() {
    // CRITICAL FIX: Use the global pieces store instead of stale this.board.pieces
    const currentPieces = usePieces.getState().pieces;

    return (
      <div className="flex justify-center items-center">
        <div className="inline-block">
          {BoardFactory.ranks.map((rank) => (
            <div key={rank} className="flex">
              <div className=" w-12 h-12 flex items-center justify-center font-bold">{rank}</div>
              {BoardFactory.files.map((file) => {
                const piece = currentPieces.get(new Coordination(file, rank).id)

                return (
                  <div
                    key={file + rank}
                    onClick={() => this.handleMove(file, rank)}
                    id={file + rank}
                    className={` w-12 h-12 flex items-center justify-center font-bold relative ${this.board.colorBoard(file, rank)} `}
                  >
                    <div>
                      {piece && (
                        <img
                          className={` absolute inset-0 z-10 ${this.showCheckedKing(file, rank)} ${this.renderPieceMoveIndicator(file, rank)}`}
                          src={this.board.getPieceImage(piece)}
                          alt={`${piece.name}_${piece.color}`}
                        />
                      )}
                    </div>
                    <div
                      className={`absolute inset-0 z-2  ${this.renderMoveIndicator(file, rank)} ${this.renderPreviousMovePositions(file, rank)}  `}
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

