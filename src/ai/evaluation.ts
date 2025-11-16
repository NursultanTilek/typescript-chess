/**
 * Chess Position Evaluation
 *
 * This module evaluates chess positions using:
 * - Material balance
 * - Piece-square tables (positional bonuses)
 * - Mobility (number of available moves)
 * - King safety
 * - Pawn structure
 * - Center control
 */

import { Color, PieceName } from "../enum";
import { CoordinationId, PieceType } from "../types";
import Coordination from "../board/Coordination";
import { EvaluationWeights } from "./types";

/**
 * Material values for each piece type
 */
export const PIECE_VALUES = {
  [PieceName.PAWN]: 100,
  [PieceName.KNIGHT]: 320,
  [PieceName.BISHOP]: 330,
  [PieceName.ROOK]: 500,
  [PieceName.QUEEN]: 900,
  [PieceName.KING]: 20000,
};

/**
 * Piece-Square Tables
 * These tables give bonuses for pieces on certain squares
 * Values are from white's perspective (flip for black)
 */

// Pawn position table - encourages advancement and center control
const PAWN_TABLE = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [5, 5, 10, 25, 25, 10, 5, 5],
  [0, 0, 0, 20, 20, 0, 0, 0],
  [5, -5, -10, 0, 0, -10, -5, 5],
  [5, 10, 10, -20, -20, 10, 10, 5],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

// Knight position table - prefers center and avoids edges
const KNIGHT_TABLE = [
  [-50, -40, -30, -30, -30, -30, -40, -50],
  [-40, -20, 0, 0, 0, 0, -20, -40],
  [-30, 0, 10, 15, 15, 10, 0, -30],
  [-30, 5, 15, 20, 20, 15, 5, -30],
  [-30, 0, 15, 20, 20, 15, 0, -30],
  [-30, 5, 10, 15, 15, 10, 5, -30],
  [-40, -20, 0, 5, 5, 0, -20, -40],
  [-50, -40, -30, -30, -30, -30, -40, -50],
];

// Bishop position table - likes long diagonals
const BISHOP_TABLE = [
  [-20, -10, -10, -10, -10, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 10, 10, 5, 0, -10],
  [-10, 5, 5, 10, 10, 5, 5, -10],
  [-10, 0, 10, 10, 10, 10, 0, -10],
  [-10, 10, 10, 10, 10, 10, 10, -10],
  [-10, 5, 0, 0, 0, 0, 5, -10],
  [-20, -10, -10, -10, -10, -10, -10, -20],
];

// Rook position table - likes open files and 7th rank
const ROOK_TABLE = [
  [0, 0, 0, 0, 0, 0, 0, 0],
  [5, 10, 10, 10, 10, 10, 10, 5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [-5, 0, 0, 0, 0, 0, 0, -5],
  [0, 0, 0, 5, 5, 0, 0, 0],
];

// Queen position table - flexible positioning
const QUEEN_TABLE = [
  [-20, -10, -10, -5, -5, -10, -10, -20],
  [-10, 0, 0, 0, 0, 0, 0, -10],
  [-10, 0, 5, 5, 5, 5, 0, -10],
  [-5, 0, 5, 5, 5, 5, 0, -5],
  [0, 0, 5, 5, 5, 5, 0, -5],
  [-10, 5, 5, 5, 5, 5, 0, -10],
  [-10, 0, 5, 0, 0, 0, 0, -10],
  [-20, -10, -10, -5, -5, -10, -10, -20],
];

// King middlegame table - stay safe behind pawns
const KING_MIDDLEGAME_TABLE = [
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-30, -40, -40, -50, -50, -40, -40, -30],
  [-20, -30, -30, -40, -40, -30, -30, -20],
  [-10, -20, -20, -20, -20, -20, -20, -10],
  [20, 20, 0, 0, 0, 0, 20, 20],
  [20, 30, 10, 0, 0, 10, 30, 20],
];

// King endgame table - activate the king
const KING_ENDGAME_TABLE = [
  [-50, -40, -30, -20, -20, -30, -40, -50],
  [-30, -20, -10, 0, 0, -10, -20, -30],
  [-30, -10, 20, 30, 30, 20, -10, -30],
  [-30, -10, 30, 40, 40, 30, -10, -30],
  [-30, -10, 30, 40, 40, 30, -10, -30],
  [-30, -10, 20, 30, 30, 20, -10, -30],
  [-30, -30, 0, 0, 0, 0, -30, -30],
  [-50, -30, -30, -30, -30, -30, -30, -50],
];

/**
 * Get piece-square table value for a piece
 */
function getPieceSquareValue(
  piece: PieceType,
  coord: Coordination,
  isEndgame: boolean
): number {
  if (!piece) return 0;

  const file = coord.file.charCodeAt(0) - "A".charCodeAt(0);
  const rank = piece.color === Color.WHITE ? coord.rank - 1 : 8 - coord.rank;

  const table = (() => {
    switch (piece.name) {
      case PieceName.PAWN:
        return PAWN_TABLE;
      case PieceName.KNIGHT:
        return KNIGHT_TABLE;
      case PieceName.BISHOP:
        return BISHOP_TABLE;
      case PieceName.ROOK:
        return ROOK_TABLE;
      case PieceName.QUEEN:
        return QUEEN_TABLE;
      case PieceName.KING:
        return isEndgame ? KING_ENDGAME_TABLE : KING_MIDDLEGAME_TABLE;
      default:
        return null;
    }
  })();

  return table ? table[rank][file] : 0;
}

/**
 * Get material value of a piece
 */
export function getPieceValue(piece: PieceType): number {
  if (!piece) return 0;
  return PIECE_VALUES[piece.name] || 0;
}

/**
 * Check if position is in endgame (few pieces remaining)
 */
function isEndgame(pieces: Map<CoordinationId, PieceType>): boolean {
  let queens = 0;
  let minorPieces = 0;

  for (const piece of pieces.values()) {
    if (!piece) continue;
    if (piece.name === PieceName.QUEEN) queens++;
    if (piece.name === PieceName.KNIGHT || piece.name === PieceName.BISHOP)
      minorPieces++;
  }

  // Endgame if no queens or very few pieces
  return queens === 0 || (queens === 2 && minorPieces <= 2);
}

/**
 * Evaluate material balance
 */
function evaluateMaterial(
  pieces: Map<CoordinationId, PieceType>,
  color: Color
): number {
  let score = 0;

  for (const piece of pieces.values()) {
    if (!piece) continue;
    const value = getPieceValue(piece);
    score += piece.color === color ? value : -value;
  }

  return score;
}

/**
 * Evaluate piece positioning using piece-square tables
 */
function evaluatePositionSquares(
  pieces: Map<CoordinationId, PieceType>,
  color: Color
): number {
  let score = 0;
  const endgame = isEndgame(pieces);

  for (const [coordId, piece] of pieces.entries()) {
    if (!piece || !coordId) continue;
    const coord = Coordination.fromId(coordId);
    const value = getPieceSquareValue(piece, coord, endgame);
    score += piece.color === color ? value : -value;
  }

  return score;
}

/**
 * Evaluate mobility (number of available moves)
 * Note: This is a simplified version since we can't easily calculate
 * mobility without running full move generation for each position
 */
function evaluateMobility(
  pieces: Map<CoordinationId, PieceType>,
  color: Color
): number {
  let score = 0;

  // Count pieces and positions as a proxy for mobility
  for (const [coordId, piece] of pieces.entries()) {
    if (!piece || !coordId || piece.color !== color) continue;

    const coord = Coordination.fromId(coordId);

    // Central pieces have more mobility
    const file = coord.file.charCodeAt(0) - "A".charCodeAt(0);
    const rank = coord.rank - 1;

    const centralityBonus = Math.max(
      0,
      4 - Math.abs(file - 3.5) - Math.abs(rank - 3.5)
    );

    score += centralityBonus;
  }

  return score;
}

/**
 * Evaluate king safety
 */
function evaluateKingSafety(
  pieces: Map<CoordinationId, PieceType>,
  color: Color
): number {
  let score = 0;

  // Find the king
  let kingCoord: Coordination | null = null;
  for (const [coordId, piece] of pieces.entries()) {
    if (!piece || !coordId) continue;
    if (piece.name === PieceName.KING && piece.color === color) {
      kingCoord = Coordination.fromId(coordId);
      break;
    }
  }

  if (!kingCoord) return 0;

  // Check pawn shield
  const direction = color === Color.WHITE ? 1 : -1;
  const pawnShieldFiles = [-1, 0, 1];

  for (const fileDelta of pawnShieldFiles) {
    const file = String.fromCharCode(
      kingCoord.file.charCodeAt(0) + fileDelta
    );
    const rank = kingCoord.rank + direction;

    if (rank < 1 || rank > 8) continue;

    try {
      const coord = new Coordination(file, rank);
      const piece = pieces.get(coord.id);
      if (piece && piece.name === PieceName.PAWN && piece.color === color) {
        score += 10;
      }
    } catch {
      // Invalid square, ignore
    }
  }

  return score;
}

/**
 * Evaluate pawn structure
 */
function evaluatePawnStructure(
  pieces: Map<CoordinationId, PieceType>,
  color: Color
): number {
  let score = 0;
  const pawns: Coordination[] = [];

  // Collect all pawns
  for (const [coordId, piece] of pieces.entries()) {
    if (!piece || !coordId) continue;
    if (piece.name === PieceName.PAWN && piece.color === color) {
      pawns.push(Coordination.fromId(coordId));
    }
  }

  for (let i = 0; i < pawns.length; i++) {
    const coord1 = pawns[i];

    // Check for doubled pawns (same file)
    for (let j = i + 1; j < pawns.length; j++) {
      const coord2 = pawns[j];
      if (coord1.file === coord2.file) {
        score -= 15; // Penalty for doubled pawns
      }
    }

    // Check for isolated pawns (no friendly pawns on adjacent files)
    const hasNeighbor = pawns.some((coord) => {
      return (
        Math.abs(coord.file.charCodeAt(0) - coord1.file.charCodeAt(0)) === 1
      );
    });
    if (!hasNeighbor) {
      score -= 10; // Penalty for isolated pawns
    }

    // Bonus for passed pawns (simplified check)
    const advancement =
      color === Color.WHITE ? coord1.rank - 2 : 7 - coord1.rank;
    if (advancement >= 4) {
      score += 10 + advancement * 3;
    }
  }

  return score;
}

/**
 * Evaluate center control
 */
function evaluateCenterControl(
  pieces: Map<CoordinationId, PieceType>,
  color: Color
): number {
  let score = 0;
  const centerSquares = ["D4", "D5", "E4", "E5"];
  const extendedCenter = [
    "C3",
    "C4",
    "C5",
    "C6",
    "D3",
    "D6",
    "E3",
    "E6",
    "F3",
    "F4",
    "F5",
    "F6",
  ];

  for (const [coordId, piece] of pieces.entries()) {
    if (!piece || !coordId || piece.color !== color) continue;

    // Bonus for pieces in center
    if (centerSquares.includes(coordId)) {
      score += 15;
    } else if (extendedCenter.includes(coordId)) {
      score += 5;
    }
  }

  return score;
}

/**
 * Default evaluation weights
 */
export const DEFAULT_WEIGHTS: EvaluationWeights = {
  material: 1.0,
  position: 0.5,
  mobility: 0.3,
  kingSafety: 0.8,
  pawnStructure: 0.4,
  centerControl: 0.3,
};

/**
 * Main evaluation function
 * Returns a score from the perspective of the given color
 * Positive score = good for color, Negative = good for opponent
 */
export function evaluatePosition(
  pieces: Map<CoordinationId, PieceType>,
  color: Color,
  weights: EvaluationWeights = DEFAULT_WEIGHTS
): number {
  let score = 0;

  score += evaluateMaterial(pieces, color) * weights.material;
  score += evaluatePositionSquares(pieces, color) * weights.position;
  score += evaluateMobility(pieces, color) * weights.mobility;
  score += evaluateKingSafety(pieces, color) * weights.kingSafety;
  score += evaluatePawnStructure(pieces, color) * weights.pawnStructure;
  score += evaluateCenterControl(pieces, color) * weights.centerControl;

  return score;
}
