/**
 * Monte Carlo Tree Search (MCTS) Implementation
 * Based on AlphaZero approach with Upper Confidence Bounds for Trees (UCT)
 */

import { Color, PieceName } from "../enum";
import { CoordinationId, PieceType } from "../types";
import { evaluatePosition } from "./evaluation";
import { usePieces } from "../store/usePieces";
import { Move } from "../board/Move";
import Coordination from "../board/Coordination";
import { debug } from "../utils/debug";
import { deepCloneBoard } from "../utils/boardClone";

/**
 * MCTS Node representing a game state
 */
export class MCTSNode {
  state: Map<CoordinationId, PieceType>;
  color: Color;
  parent: MCTSNode | null;
  move: { from: CoordinationId; to: CoordinationId } | null;
  children: MCTSNode[];
  visits: number;
  totalValue: number;
  untriedMoves: Array<{ from: CoordinationId; to: CoordinationId }>;

  constructor(
    state: Map<CoordinationId, PieceType>,
    color: Color,
    parent: MCTSNode | null = null,
    move: { from: CoordinationId; to: CoordinationId } | null = null
  ) {
    // CRITICAL: Deep clone to prevent piece mutation during MCTS simulation
    this.state = deepCloneBoard(state);
    this.color = color;
    this.parent = parent;
    this.move = move;
    this.children = [];
    this.visits = 0;
    this.totalValue = 0;
    this.untriedMoves = this.getLegalMoves();
  }

  /**
   * Get all legal moves from current state
   */
  getLegalMoves(): Array<{ from: CoordinationId; to: CoordinationId }> {
    const moves: Array<{ from: CoordinationId; to: CoordinationId }> = [];

    // Temporarily set pieces
    const originalPieces = usePieces.getState().pieces;
    usePieces.getState().setPieces(this.state);

    try {
      for (const [fromId, piece] of this.state.entries()) {
        if (!piece || !fromId || piece.color !== this.color) continue;

        const availableMoves = piece.getAvailableMoves();
        for (const toId of availableMoves) {
          if (toId) {
            moves.push({ from: fromId, to: toId });
          }
        }
      }
    } finally {
      usePieces.getState().setPieces(originalPieces);
    }

    return moves;
  }

  /**
   * Check if node is fully expanded
   */
  isFullyExpanded(): boolean {
    return this.untriedMoves.length === 0;
  }

  /**
   * Check if node is terminal (game over)
   */
  isTerminal(): boolean {
    // Simple check: if no legal moves or king is captured
    if (this.untriedMoves.length === 0 && this.children.length === 0) {
      return true;
    }

    // Check if king is missing (captured)
    let hasKing = false;
    for (const [_, piece] of this.state.entries()) {
      if (piece && piece.name === PieceName.KING && piece.color === this.color) {
        hasKing = true;
        break;
      }
    }

    return !hasKing;
  }

  /**
   * UCB1 formula for selecting best child
   * UCB1 = exploitation + exploration
   */
  ucb1(explorationParam: number = Math.sqrt(2)): number {
    if (this.visits === 0) return Infinity;

    const exploitation = this.totalValue / this.visits;
    const exploration =
      explorationParam * Math.sqrt(Math.log(this.parent!.visits) / this.visits);

    return exploitation + exploration;
  }

  /**
   * Select best child using UCB1
   */
  selectBestChild(explorationParam: number = Math.sqrt(2)): MCTSNode {
    return this.children.reduce((best, child) =>
      child.ucb1(explorationParam) > best.ucb1(explorationParam) ? child : best
    );
  }

  /**
   * Expand node by trying an untried move
   */
  expand(): MCTSNode {
    if (this.untriedMoves.length === 0) {
      throw new Error("No untried moves to expand");
    }

    // Pick a random untried move
    const moveIndex = Math.floor(Math.random() * this.untriedMoves.length);
    const move = this.untriedMoves.splice(moveIndex, 1)[0];

    // Create new state by applying move
    const newState = this.applyMove(move);

    // Create child node
    const child = new MCTSNode(
      newState,
      this.color === Color.WHITE ? Color.BLACK : Color.WHITE,
      this,
      move
    );

    this.children.push(child);
    return child;
  }

  /**
   * Apply a move to current state and return new state
   */
  applyMove(move: {
    from: CoordinationId;
    to: CoordinationId;
  }): Map<CoordinationId, PieceType> {
    // CRITICAL: Deep clone to prevent mutation of parent node's state
    const newState = deepCloneBoard(this.state);

    // Temporarily set pieces to perform move
    const originalPieces = usePieces.getState().pieces;
    usePieces.getState().setPieces(newState);

    try {
      const moveObj = new Move(
        Coordination.fromId(move.to),
        Coordination.fromId(move.from)
      );
      moveObj.move();

      // Get updated state with deep clone
      return deepCloneBoard(usePieces.getState().pieces);
    } finally {
      usePieces.getState().setPieces(originalPieces);
    }
  }

  /**
   * Simulate a random playout from current state
   */
  simulate(): number {
    // Use evaluation function instead of random playout for better results
    // This is a hybrid MCTS approach
    const score = evaluatePosition(this.state, this.color);

    // Normalize score to [-1, 1] range
    // Positive = good for this player, negative = bad
    return Math.tanh(score / 1000);
  }

  /**
   * Backpropagate result up the tree
   */
  backpropagate(value: number): void {
    this.visits += 1;
    this.totalValue += value;

    if (this.parent) {
      // Negate value for parent (opponent's perspective)
      this.parent.backpropagate(-value);
    }
  }
}

/**
 * MCTS Search Configuration
 */
export interface MCTSConfig {
  iterations: number;
  explorationParam: number;
  timeLimitMs?: number;
}

/**
 * Default MCTS configuration
 */
export const DEFAULT_MCTS_CONFIG: MCTSConfig = {
  iterations: 1000,
  explorationParam: Math.sqrt(2),
  timeLimitMs: 5000,
};

/**
 * Perform MCTS search to find best move
 */
export function mctsSearch(
  state: Map<CoordinationId, PieceType>,
  color: Color,
  config: MCTSConfig = DEFAULT_MCTS_CONFIG
): { from: CoordinationId; to: CoordinationId; visits: number } | null {
  const startTime = Date.now();
  const root = new MCTSNode(state, color);

  // If no legal moves, return null
  if (root.isTerminal()) {
    return null;
  }

  let iterations = 0;

  // MCTS main loop
  while (
    iterations < config.iterations &&
    (!config.timeLimitMs || Date.now() - startTime < config.timeLimitMs)
  ) {
    // 1. Selection: traverse tree using UCB1
    let node = root;
    while (!node.isTerminal() && node.isFullyExpanded()) {
      node = node.selectBestChild(config.explorationParam);
    }

    // 2. Expansion: add new child if not terminal
    if (!node.isTerminal() && !node.isFullyExpanded()) {
      node = node.expand();
    }

    // 3. Simulation: evaluate position
    const value = node.simulate();

    // 4. Backpropagation: update statistics
    node.backpropagate(value);

    iterations++;
  }

  // Select best move based on visit count (most robust)
  if (root.children.length === 0) {
    return null;
  }

  const bestChild = root.children.reduce((best, child) =>
    child.visits > best.visits ? child : best
  );

  debug.log(
    `MCTS completed ${iterations} iterations in ${
      Date.now() - startTime
    }ms, best move visits: ${bestChild.visits}`
  );

  if (!bestChild.move) {
    return null;
  }

  return {
    from: bestChild.move.from,
    to: bestChild.move.to,
    visits: bestChild.visits,
  };
}
