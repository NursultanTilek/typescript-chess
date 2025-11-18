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
import { deepCloneBoard } from "./utils/boardClone";
import { debug } from "./utils/debug";
// import ClockContainer from "./clock/ClockContainer"

type GameStateType = {
    colorTurn: Color,
    gameState: GameState,
    boardCondition: Map<CoordinationId, PieceType>,
    aiEnabled: boolean,
    aiDifficulty: Difficulty,
    playerColor: Color,  // Color the human player plays
    aiInfo: AIInfo
}

export default class ChessGamePlay extends React.Component {

    private chessAI: ChessAI;

    public state: GameStateType = {
        colorTurn: Color.WHITE,
        gameState: GameState.ONGOING,
        // CRITICAL: Deep clone to create completely independent piece objects
        // Shallow copy (new Map) would still share piece objects causing corruption
        boardCondition: deepCloneBoard(usePieces.getState().pieces),
        aiEnabled: true,
        aiDifficulty: Difficulty.MEDIUM,
        playerColor: Color.WHITE,  // Player plays white by default, AI plays black
        aiInfo: {
            thinking: false,
            moveHistory: []
        }
    }

    constructor(board: Board) {
        super(board)
        this.chessAI = new ChessAI(Difficulty.MEDIUM);
    }

    /**
     * Load neural network model when component mounts
     */
    async componentDidMount() {
        console.log('Loading neural network model...');
        const loaded = await this.chessAI.loadNeuralNetwork('/models/model.json');

        if (loaded) {
            console.log('✓ Neural network loaded successfully');
            this.chessAI.setUseNeuralNetwork(true);
            console.log('✓ Neural network AI enabled - your AI is now much smarter!');
        } else {
            console.log('⚠ Neural network not found - using MCTS fallback');
            console.log('  Train and convert your model, then place in public/models/');
        }
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
        debug.log(this.state.boardCondition)
        if (this.state.colorTurn !== prevState.colorTurn || this.state.boardCondition !== prevState.boardCondition) {
            // If so, run the game loop
            this.gameLoop();
        }

        // Check if AI should move (when it's AI's turn, which is opposite of player's color)
        const aiColor = this.state.playerColor === Color.WHITE ? Color.BLACK : Color.WHITE;
        if (
            this.state.aiEnabled &&
            this.state.colorTurn === aiColor &&
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
            // Use current pieces from store to ensure we have the latest board state
            const currentPieces = usePieces.getState().pieces;
            // AI plays the opposite color of the player
            const aiColor = this.state.playerColor === Color.WHITE ? Color.BLACK : Color.WHITE;
            const aiMove = await this.chessAI.getMove(currentPieces, aiColor);

            if (aiMove && aiMove.from && aiMove.to) {
                debug.log(`AI plays: ${aiMove.from} -> ${aiMove.to}`);

                // Check if piece exists at source
                const piece = currentPieces.get(aiMove.from);
                debug.log(`Piece at ${aiMove.from}:`, piece?.constructor.name, piece?.color);

                if (!piece) {
                    debug.error(`ERROR: No piece at ${aiMove.from}`);
                    this.setState({
                        aiInfo: {
                            ...this.state.aiInfo,
                            thinking: false
                        }
                    });
                    return;
                }

                // Check if piece is the right color
                if (piece.color !== aiColor) {
                    debug.error(`ERROR: Piece at ${aiMove.from} is ${piece.color}, but AI is ${aiColor}`);
                    this.setState({
                        aiInfo: {
                            ...this.state.aiInfo,
                            thinking: false
                        }
                    });
                    return;
                }

                // Execute the move
                const move = new Move(
                    Coordination.fromId(aiMove.to),
                    Coordination.fromId(aiMove.from)
                );

                debug.log(`Executing move from ${aiMove.from} to ${aiMove.to}`);
                debug.log(`Move validation - isTheSamePosition:`, move.isTheSamePosition);
                debug.log(`Move validation - piece available moves:`, Array.from(piece.getAvailableMoves()));

                move.move();

                const newPieces = usePieces.getState().pieces;
                debug.log(`Move executed. Piece now at:`, newPieces.get(aiMove.to)?.constructor.name);
                debug.log(`Piece at source ${aiMove.from}:`, newPieces.get(aiMove.from)?.constructor.name);

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

                // CRITICAL FIX: Create a NEW Map instance to trigger React re-render
                // React won't detect changes if we pass the same Map reference
                this.changeColorTurn();

                // Debug: Log all pieces and their coordinates to verify consistency
                debug.log('=== Board State After AI Move ===');
                for (const [key, piece] of newPieces.entries()) {
                    if (!piece) continue; // Skip if piece is undefined
                    const coordMatch = piece.coordination.id === key;
                    if (!coordMatch) {
                        debug.error(`MISMATCH: Piece at ${key} has coordination ${piece.coordination.id}`);
                    }
                }

                this.changeBoardCondition(new Map(newPieces));
            } else {
                debug.log("AI has no legal moves");
                this.setState({
                    aiInfo: {
                        ...this.state.aiInfo,
                        thinking: false
                    }
                });
            }
        } catch (error) {
            debug.critical("AI move error:", error);
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
        this.setState({ aiEnabled: enabled }, () => {
            if (enabled) {
                this.chessAI.setDifficulty(this.state.aiDifficulty);
                // Check if it's AI's turn and trigger move if needed
                setTimeout(() => {
                    const aiColor = this.state.playerColor === Color.WHITE ? Color.BLACK : Color.WHITE;
                    if (this.state.colorTurn === aiColor && this.state.gameState === GameState.ONGOING && !this.state.aiInfo.thinking) {
                        this.makeAIMove();
                    }
                }, 100);
            }
        });
    }

    handleDifficultyChange = (difficulty: Difficulty) => {
        this.setState({ aiDifficulty: difficulty });
        this.chessAI.setDifficulty(difficulty);
    }

    handlePlayerColorChange = (color: Color) => {
        this.setState({ playerColor: color }, () => {
            // Reset the game when color changes
            this.resetGame();
            // After reset, check if AI should make the first move
            // (e.g., if player chose BLACK, AI (WHITE) moves first)
            setTimeout(() => {
                const aiColor = this.state.playerColor === Color.WHITE ? Color.BLACK : Color.WHITE;
                if (this.state.aiEnabled && this.state.colorTurn === aiColor && this.state.gameState === GameState.ONGOING) {
                    this.makeAIMove();
                }
            }, 100);
        });
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
                                playerColor={this.state.playerColor}
                                onAIEnabledChange={this.handleAIEnabledChange}
                                onDifficultyChange={this.handleDifficultyChange}
                                onPlayerColorChange={this.handlePlayerColorChange}
                            />
                        </div>

                        {/* Main Layout: Board + Sidebar (like lichess.org) */}
                        <div className="grid grid-cols-1 lg:grid-cols-[1fr,400px] gap-6">
                            {/* Left Column: Chess Board */}
                            <div className="flex flex-col items-center justify-center">
                                <div className="w-full max-w-[600px]">
                                    {/* Top Player Info (Black's side) */}
                                    <div className="bg-gray-800 rounded-lg p-3 mb-3 flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mr-3 ${
                                                this.state.playerColor === Color.BLACK ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'
                                            }`}>
                                                {this.state.playerColor === Color.BLACK ? '👤' : '🤖'}
                                            </div>
                                            <div>
                                                <div className="text-white font-semibold">
                                                    {this.state.playerColor === Color.BLACK ? 'You' : 'Computer'}
                                                </div>
                                                <div className="text-gray-400 text-sm">
                                                    {this.state.playerColor === Color.BLACK
                                                        ? 'Player (Black)'
                                                        : this.state.aiEnabled
                                                            ? `AI (${['Beginner', 'Easy', 'Medium', 'Hard', 'Expert', 'Master'][this.state.aiDifficulty - 1]})`
                                                            : 'Player 2 (Black)'}
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

                                    {/* Bottom Player Info (White's side) */}
                                    <div className="bg-gray-800 rounded-lg p-3 mt-3 flex items-center justify-between">
                                        <div className="flex items-center">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mr-3 ${
                                                this.state.playerColor === Color.WHITE ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'
                                            }`}>
                                                {this.state.playerColor === Color.WHITE ? '👤' : '🤖'}
                                            </div>
                                            <div>
                                                <div className="text-white font-semibold">
                                                    {this.state.playerColor === Color.WHITE ? 'You' : 'Computer'}
                                                </div>
                                                <div className="text-gray-400 text-sm">
                                                    {this.state.playerColor === Color.WHITE
                                                        ? 'Player (White)'
                                                        : this.state.aiEnabled
                                                            ? `AI (${['Beginner', 'Easy', 'Medium', 'Hard', 'Expert', 'Master'][this.state.aiDifficulty - 1]})`
                                                            : 'Player 2 (White)'}
                                                </div>
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

