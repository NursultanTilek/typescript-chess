import React from "react"
import Board from "./board/Board"
import { GameStateChecker } from "./gameState/GameStateChecker";
import { Color, GameState } from "./enum";
import { usePieces } from "./store/usePieces";
import { CoordinationId, PieceType } from "./types";
import GameStatePopUp from "./gameState/GameStatePopUp";
import { AISettings } from "./components/AISettings";
import { ChessAI } from "./ai/ChessAI";
import { Difficulty } from "./ai/types";
import Coordination from "./board/Coordination";
import { Move } from "./board/Move";
// import ClockContainer from "./clock/ClockContainer"

type GameStateType = {
    colorTurn: Color,
    gameState: GameState,
    boardCondition: Map<CoordinationId, PieceType>,
    aiEnabled: boolean,
    aiDifficulty: Difficulty,
    aiThinking: boolean
}

export default class ChessGamePlay extends React.Component {

    private chessAI: ChessAI;

    public state: GameStateType = {
        colorTurn: Color.WHITE,
        gameState: GameState.ONGOING,
        boardCondition: usePieces.getState().pieces,
        aiEnabled: true,
        aiDifficulty: Difficulty.MEDIUM,
        aiThinking: false
    }

    constructor(board: Board) {
        super(board)
        this.chessAI = new ChessAI(Difficulty.MEDIUM);
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

        // Check if AI should move
        if (
            this.state.aiEnabled &&
            this.state.colorTurn === Color.BLACK &&
            this.state.gameState === GameState.ONGOING &&
            !this.state.aiThinking &&
            prevState.colorTurn !== this.state.colorTurn
        ) {
            this.makeAIMove();
        }
    }

    /**
     * Make AI move
     */
    makeAIMove = async () => {
        this.setState({ aiThinking: true });

        // Add a small delay to make it feel more natural
        await new Promise((resolve) => setTimeout(resolve, 500));

        try {
            const aiMove = this.chessAI.getMove(this.state.boardCondition, Color.BLACK);

            if (aiMove && aiMove.from && aiMove.to) {
                console.log(`AI plays: ${aiMove.from} -> ${aiMove.to}`);

                // Execute the move
                const move = new Move(
                    Coordination.fromId(aiMove.to),
                    Coordination.fromId(aiMove.from)
                );
                move.move();

                // Update state
                this.setState({ aiThinking: false });
                this.changeColorTurn();
                this.changeBoardCondition(usePieces.getState().pieces);
            } else {
                console.log("AI has no legal moves");
                this.setState({ aiThinking: false });
            }
        } catch (error) {
            console.error("AI move error:", error);
            this.setState({ aiThinking: false });
        }
    }

    /**
     * Handle AI settings changes
     */
    handleAIEnabledChange = (enabled: boolean) => {
        this.setState({ aiEnabled: enabled });
        if (enabled) {
            this.chessAI.setDifficulty(this.state.aiDifficulty);
        }
    }

    handleDifficultyChange = (difficulty: Difficulty) => {
        this.setState({ aiDifficulty: difficulty });
        this.chessAI.setDifficulty(difficulty);
    }

    /**
     * Reset game
     */
    resetGame = () => {
        this.setState({
            colorTurn: Color.WHITE,
            gameState: GameState.ONGOING,
            aiThinking: false
        });
        this.chessAI.clearHistory();
    }


    render() {
        return (
            <>
                { this.state.gameState !== GameState.ONGOING && <GameStatePopUp gameState={this.state.gameState} />}

                <div className="min-h-screen bg-gray-900 py-8">
                    <div className="container mx-auto px-4">
                        <h1 className="text-4xl font-bold text-white text-center mb-6">
                            Chess Game
                        </h1>

                        <AISettings
                            aiEnabled={this.state.aiEnabled}
                            difficulty={this.state.aiDifficulty}
                            onAIEnabledChange={this.handleAIEnabledChange}
                            onDifficultyChange={this.handleDifficultyChange}
                        />

                        {this.state.aiThinking && (
                            <div className="text-center text-white text-xl mb-4">
                                AI is thinking...
                            </div>
                        )}

                        <div className="flex flex-wrap justify-center">
                            <Board
                                colorTurn={this.state.colorTurn}
                                changeColorTurn={this.changeColorTurn}
                                changeBoardCondition={this.changeBoardCondition}
                            />
                        </div>

                        <div className="text-center mt-6">
                            <button
                                onClick={this.resetGame}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
                            >
                                New Game
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );

    }
}

