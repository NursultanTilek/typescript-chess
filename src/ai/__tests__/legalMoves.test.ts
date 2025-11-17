/**
 * Legal Move Validation Test
 *
 * This test ensures the AI only suggests moves that are actually legal
 * according to chess rules.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { ChessAI } from '../ChessAI'
import { Difficulty } from '../types'
import { Color } from '../../enum'
import { CoordinationId, PieceType } from '../../types'
import Pawn from '../../pieces/Pawn'
import Rook from '../../pieces/Rook'
import Knight from '../../pieces/Knight'
import Bishop from '../../pieces/Bishop'
import Queen from '../../pieces/Queen'
import King from '../../pieces/King'
import Coordination from '../../board/Coordination'
import { usePieces } from '../../store/usePieces'

// Helper to create starting position
function createStartingPosition(): Map<CoordinationId, PieceType> {
  const pieces = new Map<CoordinationId, PieceType>()

  // White pieces
  pieces.set('A1', new Rook(new Coordination('A', 1), Color.WHITE))
  pieces.set('B1', new Knight(new Coordination('B', 1), Color.WHITE))
  pieces.set('C1', new Bishop(new Coordination('C', 1), Color.WHITE))
  pieces.set('D1', new Queen(new Coordination('D', 1), Color.WHITE))
  pieces.set('E1', new King(new Coordination('E', 1), Color.WHITE))
  pieces.set('F1', new Bishop(new Coordination('F', 1), Color.WHITE))
  pieces.set('G1', new Knight(new Coordination('G', 1), Color.WHITE))
  pieces.set('H1', new Rook(new Coordination('H', 1), Color.WHITE))
  for (const file of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) {
    pieces.set(`${file}2` as CoordinationId, new Pawn(new Coordination(file, 2), Color.WHITE))
  }

  // Black pieces
  pieces.set('A8', new Rook(new Coordination('A', 8), Color.BLACK))
  pieces.set('B8', new Knight(new Coordination('B', 8), Color.BLACK))
  pieces.set('C8', new Bishop(new Coordination('C', 8), Color.BLACK))
  pieces.set('D8', new Queen(new Coordination('D', 8), Color.BLACK))
  pieces.set('E8', new King(new Coordination('E', 8), Color.BLACK))
  pieces.set('F8', new Bishop(new Coordination('F', 8), Color.BLACK))
  pieces.set('G8', new Knight(new Coordination('G', 8), Color.BLACK))
  pieces.set('H8', new Rook(new Coordination('H', 8), Color.BLACK))
  for (const file of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) {
    pieces.set(`${file}7` as CoordinationId, new Pawn(new Coordination(file, 7), Color.BLACK))
  }

  return pieces
}

describe('AI Legal Move Validation', () => {
  beforeEach(() => {
    // Reset pieces in store before each test
    const pieces = createStartingPosition()
    usePieces.getState().setPieces(pieces)
  })

  it('should suggest a piece that actually exists on the board', () => {
    const ai = new ChessAI(Difficulty.MEDIUM)
    const pieces = createStartingPosition()
    usePieces.getState().setPieces(pieces)

    const move = ai.getMove(pieces, Color.WHITE)

    expect(move).not.toBeNull()
    if (move) {
      console.log(`AI suggested: ${move.from} -> ${move.to}`)

      // Check that there's actually a piece at the FROM square
      const piece = pieces.get(move.from)
      expect(piece).toBeDefined()
      console.log(`Piece at ${move.from}: ${piece?.constructor.name}, Color: ${piece?.color === Color.WHITE ? 'WHITE' : 'BLACK'}`)

      // Check that the piece belongs to the AI
      expect(piece?.color).toBe(Color.WHITE)
    }
  })

  it('should not suggest moving to a square occupied by own piece', () => {
    const ai = new ChessAI(Difficulty.MEDIUM)
    const pieces = createStartingPosition()
    usePieces.getState().setPieces(pieces)

    const move = ai.getMove(pieces, Color.WHITE)

    expect(move).not.toBeNull()
    if (move) {
      console.log(`AI suggested: ${move.from} -> ${move.to}`)

      // Check if destination has a piece
      const destPiece = pieces.get(move.to)
      if (destPiece) {
        console.log(`Destination ${move.to} has: ${destPiece.constructor.name}, Color: ${destPiece.color === Color.WHITE ? 'WHITE' : 'BLACK'}`)
        // If there's a piece at destination, it must be the opponent's
        expect(destPiece.color).not.toBe(Color.WHITE)
      } else {
        console.log(`Destination ${move.to} is empty`)
      }
    }
  })

  it('should suggest moves that are in the piece legal moves list', () => {
    const ai = new ChessAI(Difficulty.MEDIUM)
    const pieces = createStartingPosition()
    usePieces.getState().setPieces(pieces)

    const move = ai.getMove(pieces, Color.WHITE)

    expect(move).not.toBeNull()
    if (move) {
      console.log(`AI suggested: ${move.from} -> ${move.to}`)

      const piece = pieces.get(move.from)
      expect(piece).toBeDefined()

      if (piece) {
        // Get the piece's legal moves
        const legalMovesSet = piece.getAvailableMoves()
        const legalMoves = Array.from(legalMovesSet)
        console.log(`Legal moves for ${piece.constructor.name} at ${move.from}:`, legalMoves)

        // Check if the suggested move is in the legal moves
        const isLegal = legalMovesSet.has(move.to)

        if (!isLegal) {
          console.error(`ILLEGAL MOVE DETECTED!`)
          console.error(`AI suggested ${move.from} -> ${move.to}`)
          console.error(`But legal moves are:`, legalMoves)
        }

        expect(isLegal).toBe(true)
      }
    }
  })

  it('opening book moves should be legal', () => {
    const ai = new ChessAI(Difficulty.MEDIUM)
    const pieces = createStartingPosition()
    usePieces.getState().setPieces(pieces)

    // Get move from starting position (should use opening book)
    const move = ai.getMove(pieces, Color.WHITE)

    expect(move).not.toBeNull()
    if (move) {
      console.log(`Opening book suggested: ${move.from} -> ${move.to}`)
      console.log(`Is from opening book: ${move.openingBook}`)

      const piece = pieces.get(move.from)
      expect(piece).toBeDefined()

      if (piece) {
        const legalMovesSet = piece.getAvailableMoves()
        const legalMoves = Array.from(legalMovesSet)
        const isLegal = legalMovesSet.has(move.to)

        if (!isLegal) {
          console.error(`ILLEGAL OPENING BOOK MOVE!`)
          console.error(`Suggested: ${move.from} -> ${move.to}`)
          console.error(`Legal moves:`, legalMoves)
        }

        expect(isLegal).toBe(true)
      }
    }
  })

  it('AI should handle multiple consecutive legal moves', () => {
    const ai = new ChessAI(Difficulty.MEDIUM)
    const pieces = createStartingPosition()
    usePieces.getState().setPieces(pieces)

    // Simulate 3 moves
    for (let i = 0; i < 3; i++) {
      const color = i % 2 === 0 ? Color.WHITE : Color.BLACK
      console.log(`\n--- Move ${i + 1} (${color === Color.WHITE ? 'WHITE' : 'BLACK'}) ---`)

      const move = ai.getMove(pieces, color)
      expect(move).not.toBeNull()

      if (move) {
        console.log(`AI plays: ${move.from} -> ${move.to}`)

        const piece = pieces.get(move.from)
        expect(piece).toBeDefined()
        expect(piece?.color).toBe(color)

        if (piece) {
          const legalMovesSet = piece.getAvailableMoves()
          const legalMoves = Array.from(legalMovesSet)
          const isLegal = legalMovesSet.has(move.to)

          if (!isLegal) {
            console.error(`ILLEGAL MOVE at turn ${i + 1}!`)
            console.error(`Suggested: ${move.from} -> ${move.to}`)
            console.error(`Legal moves:`, legalMoves)
            expect(isLegal).toBe(true)
          }

          // Apply the move
          pieces.delete(move.from)
          pieces.set(move.to, piece)
          usePieces.getState().setPieces(pieces)
          console.log(`Move applied successfully`)
        }
      }
    }
  })
})
