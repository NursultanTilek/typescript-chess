import React from "react"
import Board from "./board/Board"
import { GameStateChecker } from "./gameState/GameStateChecker";
import { Color, GameState } from "./enum";
import { usePieces } from "./store/usePieces";
import { CoordinationId, PieceType } from "./types";
import GameStatePopUp from "./gameState/GameStatePopUp";
// import ClockContainer from "./clock/ClockContainer"

type GameStateType = {
    colorTurn: Color,
    gameState: GameState,
    boardCondition: Map<CoordinationId, PieceType>
}

export default class ChessGamePlay extends React.Component {



    public state = { colorTurn: Color.WHITE, gameState: GameState.ONGOING, boardCondition: usePieces.getState().pieces }
    constructor(board: Board) {
        super(board)
    }

    gameLoop() {
        let colorToMove: Color = this.state.colorTurn;
        let state = this.determineGameState(this.state.boardCondition, colorToMove);

        if (this.state.gameState === GameState.ONGOING) {
            this.setState({ gameState: this.determineGameState(this.state.boardCondition, this.state.colorTurn) });
            state = this.determineGameState(this.state.boardCondition, colorToMove);
        }
    }


    private determineGameState(boardCondition: Map<CoordinationId, PieceType>, color: Color) {

            const state = new GameStateChecker().check(boardCondition, color);

            if (state !== GameState.ONGOING) {
                return state;
            }
    

        return GameState.ONGOING;

    }

    changeColorTurn = () => {
        this.setState({ colorTurn: this.state.colorTurn === Color.BLACK ? Color.WHITE : Color.BLACK });
    }
    changeBoardCondition=(newBoardCondition:Map<CoordinationId, PieceType>)=>{
        this.setState({boardCondition:newBoardCondition})
    }

    componentDidUpdate(prevProps: GameStateType, prevState: GameStateType) {
        // Check if colorTurn or boardCondition has changed
        console.log(this.state.boardCondition)
        if (this.state.colorTurn !== prevState.colorTurn || this.state.boardCondition !== prevState.boardCondition) {
            // If so, run the game loop
            this.gameLoop();
        }
    }


    render() {
        return (
            <>
                { this.state.gameState !== GameState.ONGOING && <GameStatePopUp gameState={this.state.gameState} />}
                <div className="flex flex-wrap justify-center p-6">
                    <Board 
                    colorTurn={this.state.colorTurn} 
                    changeColorTurn={this.changeColorTurn}
                    changeBoardCondition={this.changeBoardCondition}
                    />
                </div>
            </>
        );

    }
}

