/**
 * Chess AI Engine
 *
 * Main class that coordinates all AI components:
 * - Opening book
 * - Position evaluation
 * - Move search (minimax with alpha-beta)
 * - Difficulty levels
 */

import { Color } from "../enum";
import { CoordinationId, PieceType } from "../types";
import { findBestMove, DEFAULT_SEARCH_CONFIG } from "./search";
import { getOpeningBookMove, moveToNotation } from "./openingBook";
import { mctsSearch, DEFAULT_MCTS_CONFIG, MCTSConfig } from "./mcts";
import { evaluatePosition } from "./evaluation";
import { getNeuralNetworkPlayer } from "./neuralNetwork";
import { AIMove, Difficulty, SearchConfig } from "./types";
import { usePieces } from "../store/usePieces";
import { debug } from "../utils/debug";

/**
 * Main Chess AI Engine
 */
export class ChessAI {
  private difficulty: Difficulty;
  private moveHistory: string[] = [];
  private useOpeningBook: boolean = true;
  private useMCTS: boolean = true; // Use MCTS by default (AlphaZero-style)
  private useNeuralNetwork: boolean = false; // Use trained neural network (requires model to be loaded)

  constructor(difficulty: Difficulty = Difficulty.MEDIUM) {
    this.difficulty = difficulty;
  }

  /**
   * Set AI difficulty level
   */
  setDifficulty(difficulty: Difficulty): void {
    this.difficulty = difficulty;
  }

  /**
   * Get current difficulty level
   */
  getDifficulty(): Difficulty {
    return this.difficulty;
  }

  /**
   * Enable or disable opening book
   */
  setUseOpeningBook(use: boolean): void {
    this.useOpeningBook = use;
  }

  /**
   * Enable or disable MCTS (Monte Carlo Tree Search)
   */
  setUseMCTS(use: boolean): void {
    this.useMCTS = use;
  }

  /**
   * Check if MCTS is enabled
   */
  isUsingMCTS(): boolean {
    return this.useMCTS;
  }

  /**
   * Enable or disable Neural Network
   */
  setUseNeuralNetwork(use: boolean): void {
    this.useNeuralNetwork = use;
    if (use) {
      // When enabling neural network, disable MCTS to avoid conflicts
      this.useMCTS = false;
    }
  }

  /**
   * Check if Neural Network is enabled
   */
  isUsingNeuralNetwork(): boolean {
    return this.useNeuralNetwork;
  }

  /**
   * Load the neural network model
   */
  async loadNeuralNetwork(modelPath?: string): Promise<boolean> {
    const nn = getNeuralNetworkPlayer();
    return await nn.loadModel(modelPath);
  }

  /**
   * Check if neural network model is ready
   */
  isNeuralNetworkReady(): boolean {
    const nn = getNeuralNetworkPlayer();
    return nn.isReady();
  }

  /**
   * Add a move to the history (for opening book)
   */
  addMoveToHistory(from: CoordinationId, to: CoordinationId): void {
    this.moveHistory.push(moveToNotation(from, to));
  }

  /**
   * Clear move history
   */
  clearHistory(): void {
    this.moveHistory = [];
  }

  /**
   * Get MCTS configuration based on difficulty
   */
  private getMCTSConfig(): MCTSConfig {
    switch (this.difficulty) {
      case Difficulty.BEGINNER:
        return {
          iterations: 100,
          explorationParam: Math.sqrt(2),
          timeLimitMs: 500,
        };

      case Difficulty.EASY:
        return {
          iterations: 300,
          explorationParam: Math.sqrt(2),
          timeLimitMs: 1000,
        };

      case Difficulty.MEDIUM:
        return {
          iterations: 500,
          explorationParam: Math.sqrt(2),
          timeLimitMs: 2000,
        };

      case Difficulty.HARD:
        return {
          iterations: 800,
          explorationParam: Math.sqrt(2),
          timeLimitMs: 3000,
        };

      case Difficulty.EXPERT:
        return {
          iterations: 1200,
          explorationParam: Math.sqrt(2),
          timeLimitMs: 5000,
        };

      case Difficulty.MASTER:
        return {
          iterations: 2000,
          explorationParam: Math.sqrt(2),
          timeLimitMs: 8000,
        };

      default:
        return DEFAULT_MCTS_CONFIG;
    }
  }

  /**
   * Get search configuration based on difficulty
   */
  private getSearchConfig(): SearchConfig {
    switch (this.difficulty) {
      case Difficulty.BEGINNER:
        return {
          maxDepth: 1,
          useAlphaBeta: true,
          useIterativeDeepening: false,
          useQuiescence: false,
          timeLimitMs: 500, // 0.5 seconds
        };

      case Difficulty.EASY:
        return {
          maxDepth: 2,
          useAlphaBeta: true,
          useIterativeDeepening: true,
          useQuiescence: false,
          timeLimitMs: 1000, // 1 second
        };

      case Difficulty.MEDIUM:
        return {
          maxDepth: 3,
          useAlphaBeta: true,
          useIterativeDeepening: true,
          useQuiescence: true,
          timeLimitMs: 3000, // 3 seconds
        };

      case Difficulty.HARD:
        return {
          maxDepth: 4,
          useAlphaBeta: true,
          useIterativeDeepening: true,
          useQuiescence: true,
          timeLimitMs: 5000, // 5 seconds
        };

      case Difficulty.EXPERT:
        return {
          maxDepth: 5,
          useAlphaBeta: true,
          useIterativeDeepening: true,
          useQuiescence: true,
          timeLimitMs: 8000, // 8 seconds
        };

      case Difficulty.MASTER:
        return {
          maxDepth: 6,
          useAlphaBeta: true,
          useIterativeDeepening: true,
          useQuiescence: true,
          timeLimitMs: 15000, // 15 seconds
        };

      default:
        return DEFAULT_SEARCH_CONFIG;
    }
  }

  /**
   * Get the best move for the AI
   */
  async getBestMove(
    pieces: Map<CoordinationId, PieceType>,
    color: Color
  ): Promise<AIMove | null> {
    debug.log(`AI (${Difficulty[this.difficulty]}) thinking...`);

    // Try opening book first (if enabled and early in game)
    if (this.useOpeningBook && this.moveHistory.length < 20) {
      const openingMove = getOpeningBookMove(this.moveHistory, pieces, color);
      if (openingMove) {
        debug.log("Using opening book move:", openingMove);
        this.addMoveToHistory(openingMove.from, openingMove.to);
        return {
          from: openingMove.from,
          to: openingMove.to,
          score: 0,
          depth: 0,
          timeMs: 0,
          openingBook: true,
        };
      }
    }

    // Use Neural Network if enabled and ready
    if (this.useNeuralNetwork) {
      const nn = getNeuralNetworkPlayer();
      if (nn.isReady()) {
        debug.log("Using neural network AI");
        const move = await nn.findBestMove(color);
        if (move) {
          this.addMoveToHistory(move.from, move.to);
          return move;
        } else {
          debug.log("Neural network failed, falling back to MCTS");
        }
      } else {
        debug.log("Neural network not ready, falling back to MCTS");
      }
    }

    // Use MCTS or traditional search based on settings
    if (this.useMCTS) {
      // Use Monte Carlo Tree Search (AlphaZero-style)
      const startTime = Date.now();
      const mctsConfig = this.getMCTSConfig();
      const mctsMove = mctsSearch(pieces, color, mctsConfig);

      if (mctsMove) {
        const elapsed = Date.now() - startTime;
        const score = evaluatePosition(pieces, color);

        this.addMoveToHistory(mctsMove.from, mctsMove.to);

        return {
          from: mctsMove.from,
          to: mctsMove.to,
          score: score,
          depth: Math.floor(Math.log2(mctsMove.visits + 1)), // Approximate depth from visits
          timeMs: elapsed,
          openingBook: false,
        };
      }

      return null;
    } else {
      // Use traditional minimax search
      const config = this.getSearchConfig();
      const move = findBestMove(pieces, color, config);

      if (move) {
        this.addMoveToHistory(move.from, move.to);
      }

      return move;
    }
  }

  /**
   * Make AI introduce random errors based on difficulty
   * Lower difficulty = more errors
   */
  private shouldMakeError(): boolean {
    const errorRates: Record<Difficulty, number> = {
      [Difficulty.BEGINNER]: 0.3, // 30% chance of error
      [Difficulty.EASY]: 0.15, // 15% chance of error
      [Difficulty.MEDIUM]: 0.05, // 5% chance of error
      [Difficulty.HARD]: 0.02, // 2% chance of error
      [Difficulty.EXPERT]: 0.0, // No errors
      [Difficulty.MASTER]: 0.0, // No errors
    };

    return Math.random() < errorRates[this.difficulty];
  }

  /**
   * Get a random legal move (for errors/variety)
   */
  private getRandomMove(
    pieces: Map<CoordinationId, PieceType>,
    color: Color
  ): AIMove | null {
    const allMoves: Array<{ from: CoordinationId; to: CoordinationId }> = [];

    // Temporarily set pieces
    const originalPieces = usePieces.getState().pieces;
    usePieces.getState().setPieces(pieces);

    try {
      for (const [fromId, piece] of pieces.entries()) {
        if (!piece || !fromId || piece.color !== color) continue;

        const moves = piece.getAvailableMoves();

        for (const toId of moves) {
          if (toId) {
            allMoves.push({ from: fromId, to: toId });
          }
        }
      }
    } finally {
      usePieces.getState().setPieces(originalPieces);
    }

    if (allMoves.length === 0) return null;

    const randomMove = allMoves[Math.floor(Math.random() * allMoves.length)];
    return {
      from: randomMove.from,
      to: randomMove.to,
      score: 0,
      openingBook: false,
    };
  }

  /**
   * Get AI move with potential errors based on difficulty
   */
  async getMove(
    pieces: Map<CoordinationId, PieceType>,
    color: Color
  ): Promise<AIMove | null> {
    // Occasionally make a random move to simulate human error
    if (this.shouldMakeError()) {
      debug.log("AI making an intentional error (difficulty simulation)");
      return this.getRandomMove(pieces, color);
    }

    return await this.getBestMove(pieces, color);
  }

  /**
   * Get difficulty description
   */
  static getDifficultyDescription(difficulty: Difficulty): string {
    const descriptions: Record<Difficulty, string> = {
      [Difficulty.BEGINNER]:
        "Beginner - Makes frequent mistakes, depth 1, 0.5s think time",
      [Difficulty.EASY]:
        "Easy - Makes occasional mistakes, depth 2, 1s think time",
      [Difficulty.MEDIUM]:
        "Solid play with few errors, depth 3, 3s think time",
      [Difficulty.HARD]:
        "Hard - Strong tactical play, depth 4, 5s think time",
      [Difficulty.EXPERT]:
        "Expert - Very strong play, depth 5, 8s think time",
      [Difficulty.MASTER]:
        "Master - Top-level play, depth 6, 15s think time",
    };

    return descriptions[difficulty];
  }
}

/**
 * Create a new Chess AI instance with specified difficulty
 */
export function createChessAI(
  difficulty: Difficulty = Difficulty.MEDIUM
): ChessAI {
  return new ChessAI(difficulty);
}
