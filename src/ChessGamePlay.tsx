import React from "react"
import Board from "./board/Board"
import { GameStateChecker } from "./gameState/GameStateChecker";
import { Color, GameState } from "./enum";
import { usePieces } from "./store/usePieces";
import { CoordinationId, PieceType } from "./types";
import GameStatePopUp from "./gameState/GameStatePopUp";
import { AISettings } from "./components/AISettings";
import { AIInfoPanel, AIInfo } from "./components/AIInfoPanel";
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
    aiInfo: AIInfo
}

export default class ChessGamePlay extends React.Component {

    private chessAI: ChessAI;

    public state: GameStateType = {
        colorTurn: Color.WHITE,
        gameState: GameState.ONGOING,
        boardCondition: usePieces.getState().pieces,
        aiEnabled: true,
        aiDifficulty: Difficulty.MEDIUM,
        aiInfo: {
            thinking: false,
            moveHistory: []
        }
    }

    constructor(board: Board) {
        super(board)
        this.chessAI = new ChessAI(Difficulty.MEDIUM);
    }

    gameLoop() {
        const colorToMove: Color = this.state.colorTurn;

        if (this.state.gameState === GameState.ONGOING) {
            this.setState({ gameState: this.determineGameState(this.state.boardCondition, colorToMove) });
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

    componentDidUpdate(_prevProps: GameStateType, prevState: GameStateType) {
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
            !this.state.aiInfo.thinking &&
            prevState.colorTurn !== this.state.colorTurn
        ) {
            this.makeAIMove();
        }
    }

    /**
     * Make AI move
     */
    makeAIMove = async () => {
        this.setState({
            aiInfo: {
                ...this.state.aiInfo,
                thinking: true
            }
        });

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

                // Update AI info with move details
                const moveNotation = `${aiMove.from}-${aiMove.to}`;
                this.setState({
                    aiInfo: {
                        thinking: false,
                        lastMove: {
                            from: aiMove.from,
                            to: aiMove.to,
                            score: aiMove.score,
                            depth: aiMove.depth || 0,
                            timeMs: aiMove.timeMs || 0,
                            openingBook: aiMove.openingBook || false
                        },
                        moveHistory: [...this.state.aiInfo.moveHistory, moveNotation]
                    }
                });

                this.changeColorTurn();
                this.changeBoardCondition(usePieces.getState().pieces);
            } else {
                console.log("AI has no legal moves");
                this.setState({
                    aiInfo: {
                        ...this.state.aiInfo,
                        thinking: false
                    }
                });
            }
        } catch (error) {
            console.error("AI move error:", error);
            this.setState({
                aiInfo: {
                    ...this.state.aiInfo,
                    thinking: false
                }
            });
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
            aiInfo: {
                thinking: false,
                moveHistory: []
            }
        });
        this.chessAI.clearHistory();
    }


    render() {
        return (
            <>
                { this.state.gameState !== GameState.ONGOING && <GameStatePopUp gameState={this.state.gameState} />}

                <div className="min-h-screen bg-gray-900">
                    <div className="container mx-auto px-4 py-6 max-w-7xl">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h1 className="text-3xl font-bold text-white">
                                Chess AI
                            </h1>
                            <button
                                onClick={this.resetGame}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition duration-200 shadow-lg"
                            >
                                New Game
                            </button>
                        </div>

                        {/* Settings */}
                        <div className="mb-6">
                            <AISettings
                                aiEnabled={this.state.aiEnabled}
                                difficulty={this.state.aiDifficulty}
                                onAIEnabledChange={this.handleAIEnabledChange}
                                onDifficultyChange={this.handleDifficultyChange}
                            />
                        </div>

                        {/* Main Layout: Board + Sidebar (like lichess.org) */}
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-6">
                            {/* Left Column: Chess Board */}
                            <div className="flex flex-col items-center justify-center">
                                <div className="w-full max-w-[600px]">
                                    {/* Player Info - Black */}
                                    <div className="bg-gray-800 rounded-lg p-3 mb-3 flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-gray-900 rounded-full flex items-center justify-center text-white font-bold mr-3">
                                                🤖
                                            </div>
                                            <div>
                                                <div className="text-white font-semibold">Computer</div>
                                                <div className="text-gray-400 text-sm">
                                                    {this.state.aiEnabled ? `AI (${['Beginner', 'Easy', 'Medium', 'Hard', 'Expert', 'Master'][this.state.aiDifficulty - 1]})` : 'Player 2'}
                                                </div>
                                            </div>
                                        </div>
                                        {this.state.colorTurn === Color.BLACK && (
                                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                        )}
                                    </div>

                                    {/* Chess Board */}
                                    <Board
                                        colorTurn={this.state.colorTurn}
                                        changeColorTurn={this.changeColorTurn}
                                        changeBoardCondition={this.changeBoardCondition}
                                    />

                                    {/* Player Info - White */}
                                    <div className="bg-gray-800 rounded-lg p-3 mt-3 flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-gray-900 font-bold mr-3">
                                                👤
                                            </div>
                                            <div>
                                                <div className="text-white font-semibold">You</div>
                                                <div className="text-gray-400 text-sm">Player 1</div>
                                            </div>
                                        </div>
                                        {this.state.colorTurn === Color.WHITE && (
                                            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Right Column: AI Analysis */}
                            <div className="lg:sticky lg:top-6 h-fit">
                                <AIInfoPanel aiInfo={this.state.aiInfo} />
                            </div>
                        </div>
                    </div>
                </div>
            </>
        );

    }
}

