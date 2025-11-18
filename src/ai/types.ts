/**
 * Chess AI Type Definitions
 */

import type { CoordinationId } from "../types";

export interface AIMove {
  from: CoordinationId;
  to: CoordinationId;
  score: number;
  depth?: number;
  timeMs?: number;
  openingBook?: boolean;
  analysis?: AIAnalysis; // Detailed thinking process
}

export interface MoveCandidate {
  from: CoordinationId;
  to: CoordinationId;
  probability: number;
  evaluation: number;
}

export interface AIAnalysis {
  topMoves: MoveCandidate[];  // Top N move candidates
  positionEvaluation: number; // Position score (-1 to +1 or centipawns)
  temperature: number;         // Temperature used for move selection
  thinkingTimeMs: number;      // Time spent thinking
  nodesSearched?: number;      // Number of positions evaluated
  engine: 'minimax' | 'mcts' | 'neural_network' | 'opening_book';
  policyEntropy?: number;      // Measure of uncertainty (for neural networks)
}

export interface EvaluationWeights {
  material: number;
  position: number;
  mobility: number;
  kingSafety: number;
  pawnStructure: number;
  centerControl: number;
}

export interface SearchConfig {
  maxDepth: number;
  useAlphaBeta: boolean;
  useIterativeDeepening: boolean;
  useQuiescence: boolean;
  timeLimitMs?: number;
}

export enum Difficulty {
  BEGINNER = 1,
  EASY = 2,
  MEDIUM = 3,
  HARD = 4,
  EXPERT = 5,
  MASTER = 6,
}

export interface TranspositionEntry {
  score: number;
  depth: number;
  flag: "EXACT" | "LOWER_BOUND" | "UPPER_BOUND";
}
