/**
 * Chess AI Type Definitions
 */

import type { CoordinationId } from "../types";

export interface AIMove {
  from: CoordinationId;
  to: CoordinationId;
  score: number;
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
