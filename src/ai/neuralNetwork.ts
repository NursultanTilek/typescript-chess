/**
 * Neural Network Chess AI
 *
 * Uses TensorFlow.js to load and run the AlphaZero-trained model
 * for chess move prediction and position evaluation.
 */

import * as tf from '@tensorflow/tfjs';
import { Color, PieceType as PieceTypeEnum } from '../enum';
import { CoordinationId, PieceType } from '../types';
import { usePieces } from '../store/usePieces';
import { debug } from '../utils/debug';
import type { AIMove, MoveCandidate, AIAnalysis } from './types';

/**
 * Neural Network Model Wrapper
 */
export class NeuralNetworkPlayer {
  private model: tf.GraphModel | null = null;
  private isLoading: boolean = false;
  private loadError: string | null = null;
  private temperature: number = 1.0; // Temperature for move selection (0 = deterministic, higher = more random)

  /**
   * Load the TensorFlow.js model
   */
  async loadModel(modelPath: string = '/models/model.json'): Promise<boolean> {
    if (this.model) {
      debug('Model already loaded');
      return true;
    }

    if (this.isLoading) {
      debug('Model is currently loading');
      return false;
    }

    try {
      this.isLoading = true;
      debug(`Loading neural network model from ${modelPath}...`);

      this.model = await tf.loadGraphModel(modelPath);

      debug('✓ Neural network model loaded successfully');
      this.isLoading = false;
      return true;

    } catch (error) {
      this.loadError = error instanceof Error ? error.message : String(error);
      debug(`✗ Failed to load model: ${this.loadError}`);
      this.isLoading = false;
      return false;
    }
  }

  /**
   * Check if model is ready
   */
  isReady(): boolean {
    return this.model !== null;
  }

  /**
   * Get load error message
   */
  getLoadError(): string | null {
    return this.loadError;
  }

  /**
   * Set temperature for move selection
   * @param temp Temperature value (0 = deterministic, 1 = normal, >1 = more random)
   */
  setTemperature(temp: number): void {
    this.temperature = Math.max(0.1, temp); // Minimum 0.1 to avoid division by zero
  }

  /**
   * Get current temperature
   */
  getTemperature(): number {
    return this.temperature;
  }

  /**
   * Convert chess board to neural network input tensor (8x8x18)
   */
  private boardToTensor(color: Color): tf.Tensor4D {
    const pieces = usePieces.getState().pieces;
    const boardCondition = usePieces.getState().boardCondition;

    // Create 18-channel tensor: 12 for pieces + 6 for game state
    const tensor = new Float32Array(18 * 8 * 8);

    // Piece channel mapping
    const pieceChannels: Record<string, number> = {
      'WHITE_PAWN': 0,
      'WHITE_KNIGHT': 1,
      'WHITE_BISHOP': 2,
      'WHITE_ROOK': 3,
      'WHITE_QUEEN': 4,
      'WHITE_KING': 5,
      'BLACK_PAWN': 6,
      'BLACK_KNIGHT': 7,
      'BLACK_BISHOP': 8,
      'BLACK_ROOK': 9,
      'BLACK_QUEEN': 10,
      'BLACK_KING': 11,
    };

    // Fill piece positions (channels 0-11)
    pieces.forEach(piece => {
      const key = `${piece.color}_${piece.type}`;
      const channel = pieceChannels[key];

      if (channel !== undefined) {
        const rank = Math.floor(piece.coordination / 8);
        const file = piece.coordination % 8;
        const index = channel * 64 + rank * 8 + file;
        tensor[index] = 1.0;
      }
    });

    // Channel 12: Current player's turn (1 if white to move, 0 if black)
    const turnChannel = 12 * 64;
    if (color === Color.WHITE) {
      for (let i = 0; i < 64; i++) {
        tensor[turnChannel + i] = 1.0;
      }
    }

    // Channels 13-16: Castling rights
    const castlingChannel = 13 * 64;

    // White kingside castling
    if (boardCondition.get('whiteKingMoved') === false &&
        boardCondition.get('whiteRookRightMoved') === false) {
      for (let i = 0; i < 64; i++) {
        tensor[castlingChannel + i] = 1.0;
      }
    }

    // White queenside castling
    if (boardCondition.get('whiteKingMoved') === false &&
        boardCondition.get('whiteRookLeftMoved') === false) {
      const queensideChannel = 14 * 64;
      for (let i = 0; i < 64; i++) {
        tensor[queensideChannel + i] = 1.0;
      }
    }

    // Black kingside castling
    if (boardCondition.get('blackKingMoved') === false &&
        boardCondition.get('blackRookRightMoved') === false) {
      const blackKingsideChannel = 15 * 64;
      for (let i = 0; i < 64; i++) {
        tensor[blackKingsideChannel + i] = 1.0;
      }
    }

    // Black queenside castling
    if (boardCondition.get('blackKingMoved') === false &&
        boardCondition.get('blackRookLeftMoved') === false) {
      const blackQueensideChannel = 16 * 64;
      for (let i = 0; i < 64; i++) {
        tensor[blackQueensideChannel + i] = 1.0;
      }
    }

    // Channel 17: En passant (simplified - would need move history for full implementation)
    // For now, we leave this channel empty

    // Create tensor with shape [1, 18, 8, 8]
    return tf.tensor4d(tensor, [1, 18, 8, 8]);
  }

  /**
   * Convert move index (0-4095) to coordinates
   */
  private indexToMove(index: number): { from: number; to: number } {
    const from = Math.floor(index / 64);
    const to = index % 64;
    return { from, to };
  }

  /**
   * Convert coordinates to move index
   */
  private moveToIndex(from: number, to: number): number {
    return from * 64 + to;
  }

  /**
   * Get legal moves for current position
   */
  private getLegalMoves(color: Color): Array<{ from: CoordinationId; to: CoordinationId }> {
    const pieces = usePieces.getState().pieces;
    const legalMoves: Array<{ from: CoordinationId; to: CoordinationId }> = [];

    pieces.forEach(piece => {
      if (piece.color === color) {
        const moves = piece.getValidMoves();
        moves.forEach(to => {
          legalMoves.push({
            from: piece.coordination as CoordinationId,
            to: to as CoordinationId
          });
        });
      }
    });

    return legalMoves;
  }

  /**
   * Apply temperature to policy probabilities
   */
  private applyTemperature(probs: number[], temperature: number): number[] {
    if (temperature === 1.0) return probs;

    // Apply temperature: prob = exp(log(prob) / temp)
    const tempProbs = probs.map(p => Math.exp(Math.log(Math.max(p, 1e-10)) / temperature));

    // Renormalize
    const sum = tempProbs.reduce((a, b) => a + b, 0);
    return tempProbs.map(p => p / sum);
  }

  /**
   * Calculate entropy of policy distribution (measure of uncertainty)
   */
  private calculateEntropy(probs: number[]): number {
    return -probs.reduce((sum, p) => {
      if (p > 1e-10) {
        return sum + p * Math.log(p);
      }
      return sum;
    }, 0);
  }

  /**
   * Find best move using neural network with detailed analysis
   */
  async findBestMove(color: Color, returnTopN: number = 5): Promise<AIMove | null> {
    if (!this.model) {
      debug('✗ Model not loaded, cannot find best move');
      return null;
    }

    try {
      const startTime = performance.now();

      // Convert board to tensor
      const inputTensor = this.boardToTensor(color);

      // Get predictions from model
      const predictions = this.model.predict(inputTensor) as [tf.Tensor, tf.Tensor];
      const [policyLogits, value] = predictions;

      // Convert to arrays
      const policyArray = Array.from(await policyLogits.data());
      const valueArray = await value.data();

      // Clean up tensors
      inputTensor.dispose();
      policyLogits.dispose();
      value.dispose();

      // Get legal moves
      const legalMoves = this.getLegalMoves(color);

      if (legalMoves.length === 0) {
        debug('No legal moves available');
        return null;
      }

      // Get policy probabilities for legal moves only
      const moveProbabilities: Array<{ move: { from: CoordinationId; to: CoordinationId }, prob: number }> = [];

      legalMoves.forEach(move => {
        const moveIndex = this.moveToIndex(move.from, move.to);
        moveProbabilities.push({
          move,
          prob: policyArray[moveIndex]
        });
      });

      // Normalize probabilities over legal moves
      const totalProb = moveProbabilities.reduce((sum, mp) => sum + Math.exp(mp.prob), 0);
      moveProbabilities.forEach(mp => {
        mp.prob = Math.exp(mp.prob) / totalProb;
      });

      // Apply temperature
      const temperatures = moveProbabilities.map(mp => mp.prob);
      const tempProbs = this.applyTemperature(temperatures, this.temperature);
      moveProbabilities.forEach((mp, i) => {
        mp.prob = tempProbs[i];
      });

      // Calculate entropy (measure of uncertainty)
      const entropy = this.calculateEntropy(tempProbs);

      // Sort by probability
      moveProbabilities.sort((a, b) => b.prob - a.prob);

      // Get top N moves
      const topMoves: MoveCandidate[] = moveProbabilities
        .slice(0, returnTopN)
        .map(mp => ({
          from: mp.move.from,
          to: mp.move.to,
          probability: mp.prob,
          evaluation: valueArray[0] // Same evaluation for all moves in this position
        }));

      // Select best move (or sample based on temperature)
      let selectedMove;
      if (this.temperature < 0.1) {
        // Deterministic: always pick best move
        selectedMove = moveProbabilities[0].move;
      } else {
        // Sample from probability distribution
        const rand = Math.random();
        let cumProb = 0;
        selectedMove = moveProbabilities[0].move;

        for (const mp of moveProbabilities) {
          cumProb += mp.prob;
          if (rand <= cumProb) {
            selectedMove = mp.move;
            break;
          }
        }
      }

      const timeMs = performance.now() - startTime;
      const positionValue = valueArray[0];

      // Create detailed analysis
      const analysis: AIAnalysis = {
        topMoves,
        positionEvaluation: positionValue,
        temperature: this.temperature,
        thinkingTimeMs: timeMs,
        engine: 'neural_network',
        policyEntropy: entropy
      };

      debug(`Neural network: Move ${selectedMove.from}→${selectedMove.to}, ` +
            `Value: ${positionValue.toFixed(3)}, ` +
            `Top prob: ${topMoves[0].probability.toFixed(4)}, ` +
            `Entropy: ${entropy.toFixed(3)}, ` +
            `Temp: ${this.temperature}, ` +
            `Time: ${timeMs.toFixed(1)}ms`);

      return {
        from: selectedMove.from,
        to: selectedMove.to,
        score: positionValue,
        timeMs,
        analysis
      };

    } catch (error) {
      debug(`✗ Neural network inference error: ${error}`);
      return null;
    }
  }

  /**
   * Evaluate current position (returns value between -1 and 1)
   */
  async evaluatePosition(color: Color): Promise<number> {
    if (!this.model) {
      return 0;
    }

    try {
      const inputTensor = this.boardToTensor(color);
      const predictions = this.model.predict(inputTensor) as [tf.Tensor, tf.Tensor];
      const [, value] = predictions;

      const valueArray = await value.data();
      const evaluation = valueArray[0];

      inputTensor.dispose();
      value.dispose();

      return evaluation;

    } catch (error) {
      debug(`✗ Position evaluation error: ${error}`);
      return 0;
    }
  }

  /**
   * Unload the model and free memory
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
      debug('Neural network model disposed');
    }
  }
}

// Singleton instance
let neuralNetworkInstance: NeuralNetworkPlayer | null = null;

/**
 * Get or create the neural network player instance
 */
export function getNeuralNetworkPlayer(): NeuralNetworkPlayer {
  if (!neuralNetworkInstance) {
    neuralNetworkInstance = new NeuralNetworkPlayer();
  }
  return neuralNetworkInstance;
}
