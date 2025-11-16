/**
 * Chess Opening Book
 *
 * Contains common opening lines and their best moves
 * This helps the AI play strong opening moves without deep search
 */

import { CoordinationId } from "../types";

export interface OpeningMove {
  from: CoordinationId;
  to: CoordinationId;
}

/**
 * Opening book database
 * Key: sequence of moves in algebraic notation (e.g., "E2-E4,E7-E5")
 * Value: array of good response moves
 */
const OPENING_BOOK: Record<string, OpeningMove[]> = {
  // Starting position - popular first moves for white
  "": [
    { from: "E2", to: "E4" }, // King's Pawn
    { from: "D2", to: "D4" }, // Queen's Pawn
    { from: "C2", to: "C4" }, // English Opening
    { from: "G1", to: "F3" }, // Reti Opening
  ],

  // Responses to 1. e4
  "E2-E4": [
    { from: "E7", to: "E5" }, // King's Pawn Game
    { from: "C7", to: "C5" }, // Sicilian Defense
    { from: "E7", to: "E6" }, // French Defense
    { from: "C7", to: "C6" }, // Caro-Kann Defense
  ],

  // Responses to 1. d4
  "D2-D4": [
    { from: "D7", to: "D5" }, // Queen's Pawn Game
    { from: "G8", to: "F6" }, // Indian Defenses
    { from: "F7", to: "F5" }, // Dutch Defense
  ],

  // King's Pawn Game: 1. e4 e5
  "E2-E4,E7-E5": [
    { from: "G1", to: "F3" }, // King's Knight
    { from: "F1", to: "C4" }, // Bishop's Opening
    { from: "F2", to: "F4" }, // King's Gambit
  ],

  // After 1. e4 e5 2. Nf3
  "E2-E4,E7-E5,G1-F3": [
    { from: "B8", to: "C6" }, // Most common response
    { from: "G8", to: "F6" }, // Petrov Defense
  ],

  // Ruy Lopez: 1. e4 e5 2. Nf3 Nc6
  "E2-E4,E7-E5,G1-F3,B8-C6": [
    { from: "F1", to: "B5" }, // Ruy Lopez
    { from: "F1", to: "C4" }, // Italian Game
  ],

  // Ruy Lopez main line: 1. e4 e5 2. Nf3 Nc6 3. Bb5
  "E2-E4,E7-E5,G1-F3,B8-C6,F1-B5": [
    { from: "A7", to: "A6" }, // Morphy Defense
    { from: "G8", to: "F6" }, // Berlin Defense
  ],

  // Italian Game: 1. e4 e5 2. Nf3 Nc6 3. Bc4
  "E2-E4,E7-E5,G1-F3,B8-C6,F1-C4": [
    { from: "F8", to: "C5" }, // Giuoco Piano
    { from: "G8", to: "F6" }, // Two Knights Defense
  ],

  // Sicilian Defense: 1. e4 c5
  "E2-E4,C7-C5": [
    { from: "G1", to: "F3" }, // Open Sicilian
    { from: "C2", to: "C3" }, // Alapin Variation
  ],

  // Sicilian Defense: 1. e4 c5 2. Nf3
  "E2-E4,C7-C5,G1-F3": [
    { from: "D7", to: "D6" }, // Najdorf/Dragon setup
    { from: "B8", to: "C6" }, // Sveshnikov/Accelerated Dragon
    { from: "E7", to: "E6" }, // Paulsen/Taimanov
  ],

  // French Defense: 1. e4 e6
  "E2-E4,E7-E6": [
    { from: "D2", to: "D4" }, // Main line
    { from: "D2", to: "D3" }, // King's Indian Attack
  ],

  // French Defense: 1. e4 e6 2. d4
  "E2-E4,E7-E6,D2-D4": [
    { from: "D7", to: "D5" }, // Standard response
  ],

  // French Defense: 1. e4 e6 2. d4 d5
  "E2-E4,E7-E6,D2-D4,D7-D5": [
    { from: "B8", to: "C3" }, // Advance/Exchange Variation
    { from: "E4", to: "E5" }, // Advance Variation
  ],

  // Caro-Kann Defense: 1. e4 c6
  "E2-E4,C7-C6": [
    { from: "D2", to: "D4" }, // Main line
  ],

  // Caro-Kann Defense: 1. e4 c6 2. d4
  "E2-E4,C7-C6,D2-D4": [
    { from: "D7", to: "D5" }, // Standard response
  ],

  // Queen's Gambit: 1. d4 d5
  "D2-D4,D7-D5": [
    { from: "C2", to: "C4" }, // Queen's Gambit
    { from: "G1", to: "F3" }, // London System
  ],

  // Queen's Gambit: 1. d4 d5 2. c4
  "D2-D4,D7-D5,C2-C4": [
    { from: "E7", to: "E6" }, // Queen's Gambit Declined
    { from: "D5", to: "C4" }, // Queen's Gambit Accepted
    { from: "C7", to: "C6" }, // Slav Defense
  ],

  // Indian Defenses: 1. d4 Nf6
  "D2-D4,G8-F6": [
    { from: "C2", to: "C4" }, // Standard continuation
    { from: "G1", to: "F3" }, // Various setups
  ],

  // Indian Defenses: 1. d4 Nf6 2. c4
  "D2-D4,G8-F6,C2-C4": [
    { from: "E7", to: "E6" }, // Nimzo/Queen's Indian
    { from: "G7", to: "G6" }, // King's Indian Defense
    { from: "E7", to: "E5" }, // Budapest Gambit
  ],

  // King's Indian Defense: 1. d4 Nf6 2. c4 g6
  "D2-D4,G8-F6,C2-C4,G7-G6": [
    { from: "B8", to: "C3" }, // Standard continuation
    { from: "G1", to: "F3" }, // Alternative
  ],

  // English Opening: 1. c4
  "C2-C4": [
    { from: "E7", to: "E5" }, // Reversed Sicilian
    { from: "G8", to: "F6" }, // Anglo-Indian
    { from: "C7", to: "C5" }, // Symmetrical English
  ],
};

/**
 * Get move sequence key from move history
 */
function getMoveSequenceKey(moveHistory: string[]): string {
  return moveHistory.join(",");
}

/**
 * Get a random move from the opening book
 */
export function getOpeningBookMove(
  moveHistory: string[]
): OpeningMove | null {
  // Try to find position in opening book
  for (let i = moveHistory.length; i >= 0; i--) {
    const key = getMoveSequenceKey(moveHistory.slice(0, i));
    const moves = OPENING_BOOK[key];

    if (moves && moves.length > 0) {
      // Return random move from the options
      const randomIndex = Math.floor(Math.random() * moves.length);
      return moves[randomIndex];
    }
  }

  return null;
}

/**
 * Check if we're still in opening book territory
 */
export function isInOpeningBook(moveHistory: string[]): boolean {
  const key = getMoveSequenceKey(moveHistory);
  return key in OPENING_BOOK;
}

/**
 * Convert move to notation for opening book
 */
export function moveToNotation(from: CoordinationId, to: CoordinationId): string {
  return `${from}-${to}`;
}
