/**
 * Chess Search Algorithms
 *
 * Implements:
 * - Minimax algorithm
 * - Alpha-beta pruning
 * - Move ordering
 * - Quiescence search
 * - Transposition table
 */

import { Color, GameState } from "../enum";
import { CoordinationId, PieceType } from "../types";
import Coordination from "../board/Coordination";
import { Move } from "../board/Move";
import { evaluatePosition as evaluate, getPieceValue } from "./evaluation";
import { AIMove, TranspositionEntry, SearchConfig } from "./types";
import { GameStateChecker } from "../gameState/GameStateChecker";
import { usePieces } from "../store/usePieces";

/**
 * Transposition table for memoizing position evaluations
 */
class TranspositionTable {
  private table: Map<string, TranspositionEntry> = new Map();
  private maxSize = 100000; // 100k entries to avoid memory issues

  get(key: string): TranspositionEntry | undefined {
    return this.table.get(key);
  }

  set(key: string, entry: TranspositionEntry): void {
    if (this.table.size >= this.maxSize) {
      // Simple replacement strategy: clear oldest entries
      const keysToDelete = Array.from(this.table.keys()).slice(
        0,
        Math.floor(this.maxSize * 0.1)
      );
      keysToDelete.forEach((k) => this.table.delete(k));
    }
    this.table.set(key, entry);
  }

  clear(): void {
    this.table.clear();
  }
}

/**
 * Generate a hash key for a position
 */
function getPositionHash(pieces: Map<CoordinationId, PieceType>): string {
  const sortedPieces = Array.from(pieces.entries())
    .filter(([coord, piece]) => coord && piece)
    .sort((a, b) => (a[0] || "").localeCompare(b[0] || ""));

  return sortedPieces
    .map(
      ([coord, piece]) =>
        `${coord}:${piece!.constructor.name}:${piece!.color}`
    )
    .join("|");
}

/**
 * Get all legal moves for a color
 */
function getAllLegalMoves(
  pieces: Map<CoordinationId, PieceType>,
  color: Color
): Array<{ from: CoordinationId; to: CoordinationId }> {
  const moves: Array<{ from: CoordinationId; to: CoordinationId }> = [];

  // Temporarily set the board state
  const originalPieces = usePieces.getState().pieces;
  usePieces.getState().setPieces(pieces);

  try {
    for (const [fromId, piece] of pieces.entries()) {
      if (!piece || !fromId || piece.color !== color) continue;

      const availableMoves = piece.getAvailableMoves();

      for (const toId of availableMoves) {
        if (toId) {
          moves.push({ from: fromId, to: toId });
        }
      }
    }
  } finally {
    // Restore original board state
    usePieces.getState().setPieces(originalPieces);
  }

  return moves;
}

/**
 * Make a move and return the new board state
 */
function makeMove(
  pieces: Map<CoordinationId, PieceType>,
  from: CoordinationId,
  to: CoordinationId
): Map<CoordinationId, PieceType> {
  // Set the temporary board state
  const originalPieces = usePieces.getState().pieces;
  usePieces.getState().setPieces(new Map(pieces));

  try {
    if (!from || !to) {
      return pieces;
    }

    const move = new Move(Coordination.fromId(to), Coordination.fromId(from));
    move.move();

    // Get the updated pieces from the store
    const newPieces = new Map(usePieces.getState().pieces) as Map<CoordinationId, PieceType>;
    return newPieces;
  } finally {
    // Restore original board state
    usePieces.getState().setPieces(originalPieces);
  }
}

/**
 * Order moves for better alpha-beta pruning
 * Priority: Captures > Center moves > Other moves
 */
function orderMoves(
  moves: Array<{ from: CoordinationId; to: CoordinationId }>,
  pieces: Map<CoordinationId, PieceType>
): Array<{ from: CoordinationId; to: CoordinationId }> {
  return moves.sort((a, b) => {
    // Prioritize captures
    const aIsCapture = a.to && pieces.has(a.to);
    const bIsCapture = b.to && pieces.has(b.to);

    if (aIsCapture && !bIsCapture) return -1;
    if (!aIsCapture && bIsCapture) return 1;

    // If both are captures, prioritize higher value captures
    if (aIsCapture && bIsCapture && a.to && b.to) {
      const aValue = getPieceValue(pieces.get(a.to));
      const bValue = getPieceValue(pieces.get(b.to));
      const aPiece = a.from ? pieces.get(a.from) : undefined;
      const bPiece = b.from ? pieces.get(b.from) : undefined;

      // MVV-LVA: Most Valuable Victim - Least Valuable Attacker
      const aScore = aValue - getPieceValue(aPiece) * 0.1;
      const bScore = bValue - getPieceValue(bPiece) * 0.1;

      return bScore - aScore;
    }

    // Prioritize center moves
    const centerSquares = ["D4", "D5", "E4", "E5"];
    const aIsCenter = a.to && centerSquares.includes(a.to);
    const bIsCenter = b.to && centerSquares.includes(b.to);

    if (aIsCenter && !bIsCenter) return -1;
    if (!aIsCenter && bIsCenter) return 1;

    return 0;
  });
}

/**
 * Quiescence search - search tactical positions until quiet
 */
function quiescenceSearch(
  pieces: Map<CoordinationId, PieceType>,
  color: Color,
  alpha: number,
  beta: number
): number {
  const standPat = evaluate(pieces, color);

  if (standPat >= beta) return beta;
  if (alpha < standPat) alpha = standPat;

  // Only search captures
  const moves = getAllLegalMoves(pieces, color);
  const captures = moves.filter((move) => pieces.has(move.to));

  if (captures.length === 0) return standPat;

  const orderedCaptures = orderMoves(captures, pieces);

  for (const move of orderedCaptures) {
    const newPieces = makeMove(pieces, move.from, move.to);
    const score = -quiescenceSearch(
      newPieces,
      color === Color.WHITE ? Color.BLACK : Color.WHITE,
      -beta,
      -alpha
    );

    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }

  return alpha;
}

/**
 * Minimax algorithm with alpha-beta pruning
 */
function minimax(
  pieces: Map<CoordinationId, PieceType>,
  depth: number,
  alpha: number,
  beta: number,
  color: Color,
  maximizingPlayer: boolean,
  config: SearchConfig,
  transpositionTable: TranspositionTable,
  startTime: number
): number {
  // Check time limit
  if (config.timeLimitMs && Date.now() - startTime > config.timeLimitMs) {
    return evaluate(pieces, color);
  }

  // Check transposition table
  const posHash = getPositionHash(pieces);
  const ttEntry = transpositionTable.get(posHash);
  if (ttEntry && ttEntry.depth >= depth) {
    if (ttEntry.flag === "EXACT") return ttEntry.score;
    if (ttEntry.flag === "LOWER_BOUND")
      alpha = Math.max(alpha, ttEntry.score);
    if (ttEntry.flag === "UPPER_BOUND") beta = Math.min(beta, ttEntry.score);
    if (alpha >= beta) return ttEntry.score;
  }

  // Terminal node or depth limit reached
  if (depth === 0) {
    if (config.useQuiescence) {
      return quiescenceSearch(pieces, color, alpha, beta);
    }
    return evaluate(pieces, color);
  }

  // Check for game over
  const currentColor = maximizingPlayer
    ? color
    : color === Color.WHITE
    ? Color.BLACK
    : Color.WHITE;
  const gameStateChecker = new GameStateChecker();
  const gameState = gameStateChecker.check(pieces, currentColor);

  if (
    gameState === GameState.WHITE_CHECKMATE ||
    gameState === GameState.BLACK_CHECKMATE
  ) {
    // Prefer quicker checkmates
    return maximizingPlayer ? -100000 + depth : 100000 - depth;
  }
  if (gameState === GameState.STALEMATE) {
    return 0; // Draw
  }

  const moves = getAllLegalMoves(pieces, currentColor);
  if (moves.length === 0) {
    return evaluate(pieces, color);
  }

  const orderedMoves = orderMoves(moves, pieces);

  if (maximizingPlayer) {
    let maxEval = -Infinity;

    for (const move of orderedMoves) {
      const newPieces = makeMove(pieces, move.from, move.to);
      const evalScore = minimax(
        newPieces,
        depth - 1,
        alpha,
        beta,
        color,
        false,
        config,
        transpositionTable,
        startTime
      );

      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);

      if (config.useAlphaBeta && beta <= alpha) {
        break; // Beta cutoff
      }
    }

    // Store in transposition table
    const flag =
      maxEval <= alpha
        ? "UPPER_BOUND"
        : maxEval >= beta
        ? "LOWER_BOUND"
        : "EXACT";
    transpositionTable.set(posHash, { score: maxEval, depth, flag });

    return maxEval;
  } else {
    let minEval = Infinity;

    for (const move of orderedMoves) {
      const newPieces = makeMove(pieces, move.from, move.to);
      const evalScore = minimax(
        newPieces,
        depth - 1,
        alpha,
        beta,
        color,
        true,
        config,
        transpositionTable,
        startTime
      );

      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);

      if (config.useAlphaBeta && beta <= alpha) {
        break; // Alpha cutoff
      }
    }

    // Store in transposition table
    const flag =
      minEval <= alpha
        ? "UPPER_BOUND"
        : minEval >= beta
        ? "LOWER_BOUND"
        : "EXACT";
    transpositionTable.set(posHash, { score: minEval, depth, flag });

    return minEval;
  }
}

/**
 * Find the best move using minimax with alpha-beta pruning
 */
export function findBestMove(
  pieces: Map<CoordinationId, PieceType>,
  color: Color,
  config: SearchConfig
): AIMove | null {
  const startTime = Date.now();
  const transpositionTable = new TranspositionTable();

  let bestMove: AIMove | null = null;
  let searchDepth = config.maxDepth;

  // Iterative deepening
  if (config.useIterativeDeepening) {
    for (let depth = 1; depth <= config.maxDepth; depth++) {
      const result = searchAtDepth(
        pieces,
        color,
        depth,
        config,
        transpositionTable,
        startTime
      );

      if (result) {
        bestMove = result;
        searchDepth = depth;
      }

      // Stop if time limit exceeded
      if (
        config.timeLimitMs &&
        Date.now() - startTime > config.timeLimitMs
      ) {
        console.log(`Search stopped at depth ${depth} due to time limit`);
        break;
      }
    }
  } else {
    const result = searchAtDepth(
      pieces,
      color,
      searchDepth,
      config,
      transpositionTable,
      startTime
    );
    if (result) {
      bestMove = result;
    }
  }

  if (bestMove) {
    const elapsed = Date.now() - startTime;
    console.log(
      `Best move: ${bestMove.from} -> ${bestMove.to}, Score: ${bestMove.score.toFixed(
        2
      )}, Depth: ${searchDepth}, Time: ${elapsed}ms`
    );
  }

  return bestMove;
}

/**
 * Search for best move at a specific depth
 */
function searchAtDepth(
  pieces: Map<CoordinationId, PieceType>,
  color: Color,
  depth: number,
  config: SearchConfig,
  transpositionTable: TranspositionTable,
  startTime: number
): AIMove | null {
  const moves = getAllLegalMoves(pieces, color);

  if (moves.length === 0) {
    return null;
  }

  const orderedMoves = orderMoves(moves, pieces);
  let bestMove: AIMove | null = null;
  let bestScore = -Infinity;
  let alpha = -Infinity;
  const beta = Infinity;

  for (const move of orderedMoves) {
    const newPieces = makeMove(pieces, move.from, move.to);
    const score = -minimax(
      newPieces,
      depth - 1,
      -beta,
      -alpha,
      color,
      false,
      config,
      transpositionTable,
      startTime
    );

    if (score > bestScore) {
      bestScore = score;
      bestMove = {
        from: move.from,
        to: move.to,
        score: score,
      };
    }

    alpha = Math.max(alpha, score);

    // Time check
    if (config.timeLimitMs && Date.now() - startTime > config.timeLimitMs) {
      break;
    }
  }

  return bestMove;
}

/**
 * Default search configuration
 */
export const DEFAULT_SEARCH_CONFIG: SearchConfig = {
  maxDepth: 4,
  useAlphaBeta: true,
  useIterativeDeepening: true,
  useQuiescence: true,
  timeLimitMs: 5000, // 5 seconds
};
